# MasakiClaw Privacy Policy

MasakiClaw is a browser extension for collecting images from Zhihu comment areas selected by the user and saving them to a local folder chosen by the user.

## Data Processed

MasakiClaw may process the following data when the user starts a capture task:

- Zhihu page URL and page title
- Zhihu comment image URLs
- Downloaded image files
- Comment-related metadata, such as visible comment time and author name when available
- Local task logs
- Duplicate detection metadata, such as normalized image URL, content hash, and visual hash
- Optional AI-generated filename and image description

## Local Storage

Captured images, task logs, duplicate reports, and `images.json` are saved to the folder selected by the user.

Extension settings and task state may be stored in local browser extension storage.

If the user chooses to save an AI API key, the key is stored locally in browser extension storage. The user may protect it with password-based local encryption or explicitly choose plain local storage.

## Data Sharing

MasakiClaw does not send collected data to the developer or to any developer-controlled server.

AI vision is disabled by default. If the user enables AI vision, image content is sent to the OpenAI-compatible API endpoint configured by the user. The AI API key is used only for requests to the user-configured AI endpoint.

## Remote Code

MasakiClaw does not load or execute remote code.

## Data Sale

MasakiClaw does not sell user data.

## Data Deletion

The user can delete captured images, logs, reports, and `images.json` from the local folder selected during capture.

The user can remove extension settings and any saved AI API key by clearing the extension's local storage or uninstalling the extension.

## Contact

For questions or issues, please use the project's GitHub issue tracker.