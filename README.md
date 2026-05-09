# 🎾 The Angels Tennis Tournament

Live site: **https://s0mg2788.github.io/angels-tournament/**

---

## 🚀 Setup Guide (Do This Once)

### Step 1 — Install Required Tools

Install these two free tools if you haven't already:

1. **Node.js** → https://nodejs.org (download LTS version, click Install)
2. **Git** → https://git-scm.com/download/win (download and install)

After installing, **close and reopen** your terminal/PowerShell.

---

### Step 2 — Set Up Google Sheets Backend (5 min)

This is where your tournament data will be stored — free, forever.

1. Go to https://sheets.google.com → create a **Blank spreadsheet**
2. Name it: `Angels Tournament Data`
3. Click **Extensions → Apps Script**
4. Delete all existing code in the editor
5. Open the file `apps-script.js` in this project folder and **copy-paste** all its contents
6. Click 💾 **Save** (name the project anything, e.g. `Angels`)
7. Click **Deploy → New deployment**
8. Click ⚙️ next to "Select type" → choose **Web app**
9. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
10. Click **Deploy** → click **Authorize access** → choose your Google account → Allow
11. Copy the **Web App URL** (looks like `https://script.google.com/macros/s/AKfy.../exec`)

---

### Step 3 — Add the Script URL to the Project

Open this file in a text editor:
```
src/storage.js
```

Find this line:
```js
const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL || "PASTE_YOUR_APPS_SCRIPT_URL_HERE";
```

Replace `PASTE_YOUR_APPS_SCRIPT_URL_HERE` with your URL from Step 2:
```js
const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL || "https://script.google.com/macros/s/YOUR_REAL_ID/exec";
```

Save the file.

---

### Step 4 — Push to GitHub

Open PowerShell in the project folder and run these commands one by one:

```powershell
# Initialize git
git init
git branch -M main

# Connect to your GitHub repo
git remote add origin https://github.com/s0mg2788/angels-tournament.git

# Install dependencies and build
npm install
npm run build

# Commit and push
git add .
git commit -m "Initial deploy"
git push -u origin main
```

When prompted, sign in with your GitHub account.

---

### Step 5 — Enable GitHub Pages

1. Go to https://github.com/s0mg2788/angels-tournament
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Source**, select **GitHub Actions**
4. Click **Save**

The GitHub Action will run automatically and deploy your site.
Your site will be live at: **https://s0mg2788.github.io/angels-tournament/**

---

### Step 6 — Future Updates (Whenever You Change the Script URL)

Add the URL as a GitHub Secret so the build pipeline uses it:

1. Go to your GitHub repo → **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `VITE_SCRIPT_URL`
4. Value: your Apps Script URL
5. Click **Add secret**

Then re-push any change to trigger a new deploy.

---

## 🔐 Admin Access

Password to access the admin panel (BTC area): **686969**

---

## 📁 Project Structure

```
angels-tournament/
├── src/
│   ├── App.jsx          ← Full tournament app
│   ├── storage.js       ← Google Sheets connector ← EDIT THIS with your URL
│   └── main.jsx         ← React entry point
├── apps-script.js       ← Paste this into Google Apps Script
├── .github/workflows/
│   └── deploy.yml       ← Auto-deploys to GitHub Pages on every push
├── index.html
├── vite.config.js
└── package.json
```
