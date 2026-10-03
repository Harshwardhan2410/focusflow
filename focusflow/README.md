# FocusFlow – Study Timer & Tasks (Chrome Extension)

A Manifest V3 Chrome extension with a Pomodoro study timer and a daily to-do list.

## Features
- Focus/break timer with adjustable durations and progress bar
- Timer keeps running when the popup is closed (chrome.alarms)
- Desktop notification when a session ends, badge while running
- Daily completed-session counter
- Task list (add, tick, delete) saved with chrome.storage

## Install (Developer Mode)
1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and select this folder (the one containing `manifest.json`)
4. Pin the extension from the puzzle-piece menu and click its icon

## Files
- `manifest.json` – extension configuration (permissions: storage, alarms, notifications)
- `popup.html / popup.css / popup.js` – user interface and logic
- `background.js` – service worker that handles the timer alarm
- `icons/` – extension icons
