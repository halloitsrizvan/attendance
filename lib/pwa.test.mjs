import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
function worker(offline=false){
 const events={};const cached=[];
 const context={self:{location:{origin:'https://college.example'},clients:{claim:async()=>{}},addEventListener:(name,fn)=>events[name]=fn},caches:{open:async()=>({addAll:async urls=>cached.push(...urls)}),keys:async()=>[],delete:async()=>true,match:async()=> 'offline-page'},fetch:async()=>{if(offline)throw Error('offline');return 'network-response';},URL,Response};
 vm.runInNewContext(source,context);return {events,cached};
}
test('manifest icons have the stated pixel dimensions and cover install requirements',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../public/manifest.json',import.meta.url),'utf8'));
 assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'/');
 assert.ok(manifest.icons.some(icon=>icon.sizes==='192x192'));assert.ok(manifest.icons.some(icon=>icon.sizes==='512x512'));
 for(const icon of manifest.icons){const bytes=fs.readFileSync(new URL('../public'+icon.src,import.meta.url));assert.equal(bytes.readUInt32BE(16)+'x'+bytes.readUInt32BE(20),icon.sizes);}
});
test('installation precaches only existing public assets',async()=>{
 const {events,cached}=worker();let task;events.install({waitUntil:promise=>task=promise});await task;
 for(const url of cached)assert.ok(fs.existsSync(new URL('../public'+url,import.meta.url)));
 assert.equal(cached.length,5);assert.ok(cached.every(url=>!url.startsWith('/api/')));
});
test('API calls, writes, external resources and RSC requests bypass worker caching',()=>{
 const {events}=worker();
 for(const request of [{url:'https://college.example/api/leave',method:'GET'},{url:'https://college.example/leave-form',method:'POST'},{url:'https://other.example/icon.png',method:'GET'},{url:'https://college.example/students-portal?_rsc=test',method:'GET',mode:'cors'}]){
 let handled=false;events.fetch({request,respondWith:()=>handled=true});assert.equal(handled,false);
 }
});
test('online navigation is network-first and offline navigation gets the fallback',async()=>{
 for(const offline of [false,true]){let result;worker(offline).events.fetch({request:{url:'https://college.example/students-portal',method:'GET',mode:'navigate'},respondWith:promise=>result=promise});assert.equal(await result,offline?'offline-page':'network-response');}
});
