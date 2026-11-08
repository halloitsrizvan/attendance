// Browser-memory cache: never persists student records or credentials to disk.
export function createRequestCache({ maxEntries = 100, now = Date.now } = {}) {
    const values = new Map(), pending = new Map();
    let generation = 0;
    const copy = value => structuredClone(value);
    return {
        clear() { generation++; values.clear(); pending.clear(); },
        async read(key, ttl, fetcher) {
            const existing = values.get(key);
            if (existing && existing.until > now()) return copy(existing.value);
            values.delete(key);
            if (pending.has(key)) return copy(await pending.get(key));
            const version = generation;
            const promise = Promise.resolve().then(fetcher).then(value => {
                if (version === generation) {
                    if (values.size >= maxEntries) values.delete(values.keys().next().value);
                    values.set(key, { value: copy(value), until: now() + ttl });
                }
                return value;
            });
            pending.set(key, promise);
            try { return copy(await promise); }
            finally { if (pending.get(key) === promise) pending.delete(key); }
        }
    };
}
