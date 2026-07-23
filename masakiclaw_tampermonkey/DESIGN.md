# MasakiClaw Tampermonkey Edition

## Goal

Adapt the Chrome edition's collection behaviour into one installable userscript, prioritising desktop Firefox and Safari while retaining enhanced direct-folder output in browsers that expose the File System Access API.

## Compatibility contract

- Preserve the Chrome edition's image discovery, filtering, scrolling, secondary-reply, AI fallback, deduplication, and `images.json` semantics.
- Officially support the current stable desktop Firefox, Chrome, and Edge releases; emit ES2020 syntax.
- Treat Safari, Opera, previous major browser releases, and mobile browsers as experimental until they have recorded browser-acceptance evidence.
- Treat experimental browsers as best effort.
- Leave the Chrome and Edge runtime packages unchanged.
- Bundle fixed dependency versions into the generated userscript; do not load runtime code from a CDN.
- Declare `@connect *` so a user-configured HTTPS OpenAI-compatible endpoint remains supported. AI stays off by default.

## User interface

The userscript injects a small floating button on supported Zhihu pages. It expands a Shadow DOM Control Panel containing the Chrome edition's current-page, URL, and batch controls. A Tampermonkey menu command opens the same panel.

Batch Collection remains fixed to Masaki.Ryuu answers, articles, and pins published on or after 2021-12-30. Targets run serially in foreground tabs. The controller returns focus to its own tab after each target.

## Deep modules and interfaces

The implementation uses four external seams:

1. `createCollectionCoordinator({ taskStore, targetRunner, onProgress })` hides queue transitions and checkpoint recovery behind `start(input)`, `resume()`, and `stop()`.
2. `createTaskStore(storageAdapter)` hides persisted job keys behind `load()`, `save(job)`, and `clear()`; `createGMTaskStore()` supplies the Tampermonkey adapter.
3. `createArchiveWriter(capabilities)` selects one of two real adapters behind `writeTarget(result, job)`, `restoreTask(task)`, and `complete(job)`.
4. `collectTarget(options)` returns image candidates and diagnostics without deciding job transitions; `shapeCapture(...)` defines its testable Chrome-collector result contract.

Tests exercise these public interfaces. Browser globals, time, remote AI calls, and filesystem/download capabilities are adapters at system seams.

## Checkpoints and recovery

Queue state and completed target results—including image candidates, AI results, and dedupe decisions—are persisted after each atomic target. Opening a supported Zhihu page after interruption offers recovery; it never restarts automatically. Folder writes use stable target IDs so a retry is idempotent and require the user to reselect the original folder. ZIP recovery re-fetches confirmed image bytes while reusing persisted names and analysis before packaging.

## Archive backends

- Directory-capable browsers append tasks and image records to a selected Local Archive.
- Other browsers create one self-contained Packaged Archive per Collection Job. Large jobs may be split into numbered ZIP files.
- Dedupe History is stored separately in Tampermonkey storage so ZIP jobs can deduplicate against prior jobs.

## Credential handling

Retain the Chrome edition's choices and threat model: do not save, save encrypted using a six-character ASCII password, or save plaintext after explicit opt-in. Stored credentials are local convenience protection and do not defend against control of the browser profile or operating-system account.

## Failure behaviour

- A target timeout or collection error is recorded and the serial batch continues.
- Stop completes the current atomic target operation and prevents opening the next target.
- AI failure records a compact error and falls back to the original filename.
- Confirmed URL/content duplicates are indexed but not saved; visual similarities are saved and reported.

## Verification

Automated tests cover the Chrome-collector result contract, URL normalisation and filtering, layered deduplication, job transitions, stop/resume, JSON compatibility, and both archive adapters. A manual checklist covers installation and the three collection modes, interruption recovery, AI, directory output, and ZIP output in Firefox, Safari, and Chromium. Unperformed browser checks remain explicitly marked pending.
