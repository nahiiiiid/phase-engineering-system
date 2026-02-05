# Phase Engineering — Frontend-only Task & Assignment System (No Backend)

This is a **production-style internal task monitoring system** that runs **entirely in the browser** (React + Vite + TypeScript).  
Data persists via **IndexedDB**, and can be backed up/restored with versioned JSON exports.

## Roles (No Auth Server)
- **CEO**: full access (Master Assignments + Reports + Data/Admin)
- **Employee**: sees only their own tasks; can update only Status, Remarks, Done Date

Role entry uses numeric access codes.

## Run locally
```bash
npm install
npm run dev
```

## Deploy to Vercel (Step-by-step)
1. Push this project to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<YOU>/<REPO>.git
   git push -u origin main
   ```

2. Go to Vercel → **Add New** → **Project** → Import your repo.

3. Build settings:
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. Click **Deploy**.

### SPA routing (important)
This repo includes `vercel.json` with rewrites so refreshing `/app/...` works.

## Data persistence & backup
- Stored in browser IndexedDB (per device + per browser profile)
- CEO can download a full JSON backup in **Data/Admin** and restore via import.
- CSV export is available for spreadsheets.

## Employee management (CEO only)
CEO can add/edit/delete employees and access codes in **Data/Admin**.
Changes reflect across Master Assignments, Employee views, and Reports.
