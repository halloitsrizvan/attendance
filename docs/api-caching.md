# API caching

The shared Axios adapter in utils/apiCache.js caches selected same-origin JSON GET responses in browser memory. It is installed once by TestUserBanner before page effects run. It deduplicates concurrent matching requests and separates entries by credentials and full URL, including query parameters.

## Lifetimes

- Classes and settings: 60 seconds.
- Teacher profiles and student lists: 30 seconds.
- Attendance, leaves, deductions, complaints, class documentation, student profile and selected Zehnuth reads: 10 seconds.
- Other endpoints, reports, uploads, login, non-JSON responses and requests with cancellation: no caching.

Every internal Axios mutation clears the cache before and after its request. In-flight results started before invalidation cannot repopulate it. Focus, returning to the browser tab, cross-tab storage events, account changes and teacher logout also clear it. Mutation notifications carry no response data.

Use axios.get(url, { cache: false }) for explicit Refresh actions or a read that always needs a network request. Documentation and admin complaint refresh controls already do this. The teacher home uses this shared cache instead of its unbounded sessionStorage copies. Other legacy sessionStorage caches remain separate.

The cache is not an offline database, server/CDN cache or replacement for API authorization. Browser reloads start with an empty cache. Native fetch, separate Axios instances and custom request adapters are not affected. Another user's writes can remain cached for the short TTL while a tab stays active; use Refresh to fetch immediately.

## Checks

Run node --test lib/requestCache.test.mjs for TTL, deduplication, mutation-safe invalidation, independent response copies, failed requests and bounded eviction.
