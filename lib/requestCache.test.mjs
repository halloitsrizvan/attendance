import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequestCache } from './requestCache.mjs';

test('reuses fresh data, then fetches again after expiry', async () => {
 let time=0, calls=0; const cache=createRequestCache({now:()=>time});
 const fetcher=async()=>({value:++calls});
 assert.equal((await cache.read('a',10,fetcher)).value,1);
 assert.equal((await cache.read('a',10,fetcher)).value,1);
 time=11; assert.equal((await cache.read('a',10,fetcher)).value,2);
});
test('deduplicates concurrent reads and isolates returned values', async () => {
 const cache=createRequestCache(); let calls=0;
 const fetcher=async()=>{calls++;return {list:[1]};};
 const [first,second]=await Promise.all([cache.read('a',1000,fetcher),cache.read('a',1000,fetcher)]);
 first.list.push(2); assert.deepEqual(second.list,[1]);assert.equal(calls,1);
});
test('invalidation prevents an older in-flight response from repopulating cache', async () => {
 const cache=createRequestCache();let resolve;
 const old=cache.read('a',1000,()=>new Promise(done=>{resolve=done;}));
 await Promise.resolve();cache.clear();
 await cache.read('a',1000,async()=> 'new');resolve('old');await old;
 assert.equal(await cache.read('a',1000,async()=> 'unexpected'),'new');
});
test('failures are not cached and different account keys stay separate', async () => {
 const cache=createRequestCache();
 await assert.rejects(cache.read('teacher:a',1000,async()=>{throw Error('offline');}));
 assert.equal(await cache.read('teacher:a',1000,async()=> 'A'),'A');
 assert.equal(await cache.read('teacher:b',1000,async()=> 'B'),'B');
});
test('clearing and bounded eviction force fresh reads',async()=>{
 const cache=createRequestCache({maxEntries:1});
 await cache.read('a',1000,async()=>1);await cache.read('b',1000,async()=>2);
 assert.equal(await cache.read('a',1000,async()=>3),3);
 cache.clear();assert.equal(await cache.read('a',1000,async()=>4),4);
});
