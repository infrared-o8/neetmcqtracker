# Leaderboard

## Global Leaderboard (Default)

The app is pre-configured to sync with a global leaderboard hosted at:
`https://splendor-entertain-skintight.ngrok-free.dev`

Simply open the **Leaderboard** tab to see how you rank against everyone!

## Local / Private Leaderboard (Single laptop)

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

- Go to **Settings** → **Server URL**
- Set to `http://localhost:3847` (or leave empty if using Vite proxy)
- Log MCQs on Dashboard, open **Leaderboard**

## LAN Leaderboard (Two laptops)

**Host (friend's laptop):**
```bash
npm run server
```
The terminal prints URLs like `http://192.168.1.42:3847` — share that with friends.

**Your laptop:** Settings → Server URL → `http://FRIEND_IP:3847` (must include `http://`) → **Test & sync**

**If connection fails (TCP / network error):**
1. Both on the **same Wi‑Fi** (not guest network)
2. Friend runs `npm run server` and keeps the terminal open
3. On friend's PC, allow firewall (Admin PowerShell):
   ```text
   netsh advfirewall firewall add rule name="NEET Tracker LB" dir=in action=allow protocol=TCP localport=3847
   ```
4. Use the exact URL from friend's server terminal (not `localhost`)
