# Portable Archive Output Uses Capability-Based Backends

The Tampermonkey edition must retain collection features across browsers even though direct directory writing is not portable. It will select an archive backend by browser capability: browsers exposing the File System Access API write the Local Archive directly into a user-selected folder, while other browsers download the same logical archive as ZIP files, splitting large results when needed. Collection, AI analysis, deduplication, indexing, and reporting remain independent of the selected backend.

## Consequences

Folder archives can be updated incrementally, while packaged archives require an explicit continuation strategy if results must accumulate across Collection Jobs. Both backends must consume the same finalized image records so their archive contents do not drift.
