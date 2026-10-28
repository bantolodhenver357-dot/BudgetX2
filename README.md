# BudgetX — HTML/CSS/JavaScript version (no React Native)

This project uses plain HTML, CSS, and JavaScript. It is a Progressive Web App (PWA) starter with a manifest and service worker for offline loading after the first successful visit.

## 1. Install the tools
1. Install Visual Studio Code: https://code.visualstudio.com/
2. Install Node.js LTS: https://nodejs.org/ (optional for this static project, but useful for VS Code tools).
3. Extract `BudgetX_Web.zip` to a folder on your computer.
4. In VS Code, choose **File → Open Folder** and select `BudgetX_Web`.

## 2. Run it on your computer
Recommended:
1. In VS Code, open **Extensions**.
2. Search for **Live Server** and install it.
3. Open `index.html`.
4. Right-click inside the editor and select **Open with Live Server**.
5. The app should open in your browser.

You can also use any local static web server. Service workers do not work reliably by opening `index.html` directly as a `file://` URL.

## 3. Install it on your Android phone
A PWA must be served from HTTPS (or localhost) to install and use service-worker offline features. For your phone, the simplest beginner method is GitHub Pages:

1. Create or sign in to a GitHub account at https://github.com/
2. Create a new repository named `budgetx`.
3. Upload all files and folders from inside `BudgetX_Web` (upload the files, not the ZIP).
4. Open the repository's **Settings → Pages**.
5. Under build/deployment, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
6. Wait for GitHub Pages to publish the site. Open the HTTPS address it gives you on your Android phone in Chrome.
7. Visit the page once while online so the app files can be cached.
8. In Chrome, tap **⋮ → Add to Home screen** or **Install app** if shown.
9. Open BudgetX from your home screen. After its first successful load/cache, the welcome screen can load offline.

## 4. Files
- `index.html` — app screen and text
- `style.css` — layout, colors, round button, responsive sizing
- `app.js` — button behavior and service-worker registration
- `manifest.json` — install name, icon, and standalone display
- `service-worker.js` — caches the app shell for offline loading
- `assets/` — BudgetX logo and install icons

## Important notes
- This is the welcome screen only. The button opens a placeholder next screen.
- Income/expense tracking and local financial-data storage have not been added yet.
- When we add financial records, use IndexedDB for structured offline storage in this web app.
- Back up/export records before clearing browser/site data or uninstalling/resetting the device. Offline caching stores the app files; it does not itself store finance records.
- GitHub Pages is just hosting the app files. It does not store the user's finance records. Those can stay on the phone in browser storage.
