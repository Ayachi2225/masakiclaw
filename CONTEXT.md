# MasakiClaw

MasakiClaw collects images from Zhihu comment threads and organizes them into a local archive.

## Language

**Collection Job**:
A user-initiated collection of comment images from one or more Zhihu targets, with one shared limit, result set, and completion state.
_Avoid_: Crawl, scrape

**Current-page Collection**:
A Collection Job whose sole target is the Zhihu page currently open in the initiating tab.
_Avoid_: Current-page mode

**URL Collection**:
A Collection Job whose sole target is a Zhihu URL supplied by the user.
_Avoid_: URL mode

**Batch Collection**:
A Collection Job whose ordered targets are discovered from the supported Masaki content sources and processed one at a time.
_Avoid_: Concurrent collection, batch mode

**Collection Target**:
A supported Zhihu answer, article, or pin whose comment thread is inspected for images.
_Avoid_: Page, source URL

**Control Panel**:
The expandable in-page interface from which a user configures, starts, observes, and stops a Collection Job.
_Avoid_: Popup, settings window

**Image Candidate**:
An image reference found in a Collection Target before archive-wide duplicate checks and saving decisions are applied.
_Avoid_: Download, saved image

**Local Archive**:
The user-controlled collection of saved images and its structured index, job log, and similarity report, delivered either as a writable folder or a packaged archive.
_Avoid_: Download folder, output

**Packaged Archive**:
A self-contained ZIP representation of one completed Collection Job, used when direct folder writing is unavailable.
_Avoid_: Backup, cumulative archive

**Dedupe History**:
The browser-local record of prior source URLs and image fingerprints used to detect duplicates across Collection Jobs, independently of any Packaged Archive.
_Avoid_: Archive index, image cache

**Collection Checkpoint**:
The persisted progress of an unfinished Collection Job that may be resumed only after user confirmation.
_Avoid_: Autosave, active task
