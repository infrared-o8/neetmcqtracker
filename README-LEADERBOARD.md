# Leaderboard

## Single laptop (web app)

**Terminal 1:**
```bash
npm run server
```

If you see `EADDRINUSE`, the server is already running — use that terminal, or run `npm run server:stop` first.

**Terminal 2:**
```bash
npm run dev
```

Or one command: `npm run dev:all`

- Leave **Server URL** empty in Settings (uses Vite proxy to `localhost:3847`)
- Log MCQs on Dashboard, open **Leaderboard**

## Two laptops

**Host:** `npm run server` — note LAN IP (`ipconfig`, e.g. `192.168.1.42`)

**Both laptops:** Settings → Server URL → `http://192.168.1.42:3847` → **Test & sync**

Allow port **3847** through Windows Firewall on the host if needed.
