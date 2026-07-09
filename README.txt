ROTE Mobile Inspector (Offline PWA) – Android

This is a simple offline-first “app” that runs in your phone browser and can be installed to your home screen.
It stores the inspection on the phone and generates:
- Copy/paste block (SafetyCulture)
- Printable report (use Android Print → Save as PDF)

How to run it without internet
Android won’t run offline apps properly from file://, so you need a tiny local web server app (no admin needed).

Recommended (Play Store):
- “Simple HTTP Server” (or any local server app)

Steps
1) Unzip this folder on your phone (e.g., Downloads/ROTE_App)
2) Open the local server app and point it at the unzipped folder
3) Start server (it will show a local address like http://127.0.0.1:8080)
4) Open that address in Chrome
5) Chrome menu (⋮) → “Add to Home screen” (installs like an app)
After that, it will work offline.

Export/Import
Use Export JSON to back up progress.
Use Import JSON to restore it.
