# Bookresio

A reading log for your phone. One book to a row, how far you are in each of
them, a stopwatch that runs while you read, and notes — text and photographs of
the pages worth keeping.

Installable web app (PWA), no account, no server. **Everything lives on your
device**, in IndexedDB. Nothing is ever uploaded.

## The shelf

Books sit one under another, never side by side. Each row carries the cover, the
title and author, a bar and a percentage worked out from the pages, how far in
you are, and the time you have spent. A book with a timer running shows a
pulsing dot and a live clock, and floats to the top of the list whatever order
you have chosen.

The `+` button adds a book: title, author, cover from the gallery, and the page
count. Sorting (top right) offers **recently read**, **progress**, **title** and
**newly added**.

## Inside a book

| | |
|---|---|
| **Progress** | The percentage, the bar, `148 / 352 pages`, and how many are left. |
| **Pages read** / **Total pages** | Tap either one and a numeric keypad slides up. `+1`, `+10` and a jump to the last page sit above the digits, and the bar in the keypad moves as you type, so you can see where you will land before you commit. |
| **Reading timer** | One button. It runs until you stop it, then adds the session to the book's total. Stop after more than a minute and the message offers **Update pages** — one tap from the stopwatch to the keypad. |
| **Notes** | As many as you like, newest first. |

Reach 100 % and the book is marked **Finished** — the bar and the percentage
turn gold. The `···` menu also finishes a book by hand, edits its details, or
deletes it.

The timer survives everything: it is stored as the moment it started, not as a
number counting up, so locking the phone, switching apps or closing Safari makes
no difference to it. Only one book can be running at a time — starting a second
stops the first and tells you which. A timer left running for more than six
hours is treated as forgotten: that session is dropped rather than quietly
adding six hours to your total, and the app says so when you come back.

## Notes

A note is free text plus photographs. Write whatever you like; the box grows
with it. **Photo** takes pictures straight from the gallery (or the camera), and
they are resized to 1900 px on the long edge and stored as JPEG, so a hundred
pages of a book do not fill the phone.

Tap a photo to open it full screen — pinch to zoom, drag down to close, and the
bin in the corner removes it. A note you open and leave without writing anything
does not stick around.

## Backups

Settings → **Export backup** writes a single `.json` with every book, every note
and every photo embedded. **Restore backup** replaces the contents of the device
with that file. Worth doing now and then — iOS clears the storage of web apps
you have not opened for a long time, and clearing Safari data wipes it
immediately.

## Language

English and Polish, in Settings → Language. Switching rebuilds the screens you
have open without losing your place.

## Install on iPhone

1. Open the link in **Safari**.
2. *Share* → **Add to Home Screen**.
3. It then opens full screen, without the address bar, and works offline.

## Files

```
index.html              the whole app (HTML + CSS + JS, no dependencies)
manifest.webmanifest    PWA manifest
sw.js                   service worker (offline shell)
icons/                  generated icons
tools/gen-icons.mjs     icon generator (plain Node, no libraries)
```

Run it locally:

```bash
npx serve -l 5178 .
```

Regenerate the icons after changing the logo geometry:

```bash
node tools/gen-icons.mjs
```

## Design

Creamy white (`#FAF6EF`) ground, baby blue (`#5B93C7`) used sparingly — deepened
just enough to hold its own as text against the cream. Chrome is set in the
system face so it feels like the phone it runs on; titles are set in a book
serif, so a shelf reads like a shelf. The logo is a bracketed serif **B**, drawn
as geometry in `tools/gen-icons.mjs` rather than shipped as an image, so every
icon size is rendered exactly and the mark on screen is the mark on your home
screen.
