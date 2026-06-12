# U-BOCC — Complete Recreation Prompt
**Unified Bus Operations Command Center · Chennai MTC**

---

## Project Overview

Build a real-time bus operations command center dashboard for Chennai's Metropolitan Transport Corporation (MTC) called **U-BOCC** (Unified Bus Operations Command Center). It runs on `localhost:3000` and simulates a live control room interface for MTC officers to monitor all buses across Chennai and approve/reject AI-generated dispatch/rerouting actions.

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router), TypeScript
- **Map:** Mapbox GL JS (`react-map-gl`) with a **dark map style** (e.g., `mapbox://styles/mapbox/dark-v11`) — alternatively use Leaflet with CartoDB Dark Matter tiles
- **Styling:** Tailwind CSS + custom CSS variables for the dark command-center theme
- **State:** React `useState` / `useEffect` with simulated live data
- **Icons:** Lucide React
- **Fonts:** Use a monospace or terminal-style font for stats (e.g., `JetBrains Mono`) and a clean sans for body (e.g., `Geist`)
- **Port:** 3000

---

## Visual Design System

### Color Palette
```css
--bg-primary: #0a0a0f        /* near-black map background */
--bg-surface: #12121a        /* sidebar/panel background */
--bg-card: #1a1a26           /* action cards */
--border: #2a2a3a            /* subtle borders */
--text-primary: #e8e8f0      /* primary text */
--text-muted: #6b6b80        /* secondary text */
--accent-blue: #4a9eff       /* route lines, normal buses */
--accent-orange: #ff8c42     /* overloaded/stuck buses */
--accent-yellow: #ffd166     /* warning states */
--accent-green: #06d6a0      /* APPROVE button, running buses */
--accent-red: #ef476f        /* CRITICAL badge, REJECT */
--accent-purple: #b388ff     /* Deluxe bus type */
--accent-cyan: #00e5ff       /* Express bus type */
--live-green: #22c55e        /* LIVE indicator pulse */
```

### Map Style
- Dark basemap (Mapbox dark-v11 or CartoDB Dark Matter)
- Centered on Chennai: `[80.2707, 13.0827]`, zoom ~11
- Bus route polylines drawn in `--accent-blue` with `opacity: 0.6`

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                        TOP HEADER BAR                           │
├──────────┬──────────────────────────────────────┬──────────────┤
│          │                                      │              │
│  LEFT    │         INTERACTIVE MAP              │   RIGHT      │
│ SIDEBAR  │         (Mapbox/Leaflet)             │   SIDEBAR    │
│          │                                      │  (Actions)   │
│          │                                      │              │
├──────────┴──────────────────────────────────────┴──────────────┤
│                  BOTTOM DISRUPTION TICKER                       │
└─────────────────────────────────────────────────────────────────┘
```

- Left sidebar: ~80px wide (icon + label buttons)
- Right sidebar: ~280px wide (action cards)
- Top header: ~50px tall
- Bottom ticker: ~36px tall

---

## 1. Top Header Bar

### Left Side — Branding
```
[Bus icon]  U-BOCC
             UNIFIED BUS OPERATIONS COMMAND CENTER · CHENNAI MTC
```

### Center — KPI Pills (5 metrics displayed as icon + value + label)
| Icon | Value | Label |
|------|-------|-------|
| 🚌 Bus icon | Dynamic count (1–10) | ACTIVE BUSES |
| 🔴 Circle | 0 | OVERLOADED |
| ⏱ Clock | 4.5 min | AVG WAIT |
| 📊 Bar chart | 62% | AVG OCC |
| 🗄 Stack | 284 | RESERVE FLEET |
| ⚡ Lightning | 8 | PENDING ACTIONS |

Each KPI pill: dark bg, small colored icon, bold number, muted label beneath.

### Right Side
- **LIVE** badge: green pulsing dot + "LIVE" text (animate the dot with `pulse` keyframe)
- **Time:** `HH:MM:SS IST` — live updating every second
- **Demo** button: small outlined button

---

## 2. Left Sidebar

Four navigation toggle buttons (stacked vertically), each with icon + label:

```
[Route icon]   Routes
[Flame icon]   Hotspots
[Depot icon]   Depots
[Traffic icon] Traffic
```

Below buttons, a small live counter:
```
● 666 buses live
```
(number updates every few seconds, range 640–700)

**Active state:** button gets `--accent-blue` background glow, border highlight.

**Default active:** Routes and Traffic are ON by default.

---

## 3. Interactive Map

### Center & Bounds
- Center: Chennai `[80.2707, 13.0827]`
- Initial zoom: 11
- Min zoom: 9, Max zoom: 16
- Dark basemap

### Bus Icons on Map
Simulate **~650–700 buses** scattered across Chennai with these properties:

**Bus marker appearance:**
- Small rectangular icon (like a tiny bus chip): ~32×20px
- Shows the route number (e.g., `21G`, `29C`, `18`, `101`, `104K`, `114A`) in tiny monospace text
- Color-coded by status:
  - Running → `--accent-blue` border + dim bg
  - Stopped → `--accent-orange` border + orange tint bg
  - Overloaded → flashing `--accent-red` border
  - Stuck → `--accent-yellow` border

**Bus types and colors:**
- Ordinary → white/gray text
- Deluxe → purple tint (`--accent-purple`)
- AC → cyan tint (`--accent-cyan`)
- Express → orange tint (`--accent-orange`)

**Real Chennai bus routes to simulate** (use these route numbers on bus markers):
`18, 21G, 23C, 29C, 29D, 47B, 70, 87, 101, 104K, 104P, 114A, 119, 1A, 5C, 15G, 27B, 35, 47C, 52A, 57, 70B, M9, M11, 216, 218, 29H`

**Bus movement simulation:**
- Every 3–5 seconds, randomly move 5–10% of buses slightly along their route direction
- Buses near "congestion zones" (Saidapet, Guindy, Anna Salai) move slower
- Each bus has: `id`, `route`, `type`, `status`, `lat`, `lng`, `occupancy`, `speed`, `nextStop`, `heading`, `eta`

**Depot markers** (when Depots layer is ON):
- Appear at: Adyar, Broadway, Madhavaram, Villivakkam, Tambaram depots
- Icon: small warehouse/bus-garage icon
- Shows depot name + bus count tooltip

**Route polylines** (when Routes layer is ON):
- Draw 5–10 key route paths across Chennai as polylines
- Color: `--accent-blue` at 60% opacity
- Key corridors: Anna Salai, GST Road, OMR, Poonamallee High Road, Rajaji Salai

**Hotspot circles** (when Hotspots layer is ON):
- Red semi-transparent circles at high-congestion areas
- Chepauk, Guindy, Koyambedu, Tambaram

### Bus Click Popup

When a bus marker is clicked, show a floating card near the bus:

```
┌──────────────────────────────┐
│  101              [Ordinary] │  ← route + type badge
│  ━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  STUCK                       │  ← status (red if stuck)
│                              │
│  Current   —                 │
│  Next Stop Tharadi           │
│  ETA       949 min           │
│  Speed     6 km/h            │
│  Heading   —                 │
│  Occupancy 85%               │
│  ████████░░  Inbound         │  ← occupancy bar + direction
└──────────────────────────────┘
```

Fields shown:
- Route number (large, bold)
- Bus type badge (Ordinary / Deluxe / AC / Express)
- Status (RUNNING green / STOPPED orange / STUCK yellow / OVERLOADED red)
- Next Stop name
- ETA (minutes)
- Speed (km/h)
- Occupancy % with a colored progress bar
- Direction (Inbound / Outbound)

Close button `[×]` in top-right corner of popup.

### Bottom-Left Map Legend
```
● Ordinary    ● Deluxe
● AC          ● Express
● running     ● stopped    ● overloaded
```
Small color dots + labels, floating panel with dark semi-transparent bg.

---

## 4. Right Sidebar — Actions Panel

### Tab Bar (4 tabs)
```
[ACTIONS (badge)] | [ALERTS (badge)] | [DEPOTS] | [LOG]
```
- Active tab has `--accent-blue` underline
- Badge shows pending count

### Actions Tab Content

**Header:**
```
PENDING OFFICER APPROVAL (8)
```
Small monospace text, muted color.

**Scrollable list of action cards.** Each card:

```
┌──────────────────────────────────────┐
│ 🚌 Route 23C              [CRITICAL] │
│ Besant Nagar → Ayanavaram            │
│ ─────────────────────────────────── │
│ Deploy 13 additional Ordinary buses  │
│ from Adyar depot on Route 23C        │
│ (Besant Nagar → Ayanavaram).         │
│ Reduces avg wait from 25 min to      │
│ 10 min.                              │
│                                      │
│ ACTION   ADD BUSES                   │
│ DEPOT    Adyar                       │
│                                      │
│ WAIT BEFORE → AFTER                  │
│ 25m         → 10m                    │
│                                      │
│ IMPACT                               │
│ -715 additional passengers served/hr │
│                                      │
│ Buses to dispatch:  [−] 13 [+]       │
│                                      │
│ [ ✓ APPROVE ]    [ ✗ REJECT ]        │
└──────────────────────────────────────┘
```

**Priority badges:**
- `CRITICAL` → red background, white text
- `MEDIUM` → yellow/amber background, dark text

**Action types:**
1. `ADD BUSES` → shows "DEPOT: [depot name]" and bus count stepper
2. `REROUTE` → shows reroute description and impact text instead of bus stepper

**Approve/Reject behavior:**
- APPROVE (green button): removes card from list, decrements pending count in header
- REJECT (dark button): removes card from list with a fade-out animation

**Pre-populated action cards** (generate ~8 total):

| Route | Priority | Action | From | Route Description | Wait Before→After | Impact |
|-------|----------|--------|------|-------------------|-------------------|--------|
| 23C | CRITICAL | ADD BUSES | Adyar | Besant Nagar → Ayanavaram | 25m → 10m | +715 pax/hr |
| 216 | CRITICAL | ADD BUSES | Broadway | Island Grounds → Kilambakkam(Xcbt) | 33m → 11m | +715 pax/hr |
| 29C | CRITICAL | ADD BUSES | Adyar | Besant Nagar → Perambur | 27m → 10m | +715 pax/hr |
| 29C | MEDIUM | REROUTE | — | Velachery Bypass → Pallikaranai Road (flood diversion) | 27m → 22m | Avoids flooded road |
| 18 | CRITICAL | ADD BUSES | Broadway | Broadway → Thandar Nagar | 33m → 9m | +715 pax/hr |
| 47B | CRITICAL | ADD BUSES | Madhavaram | Madhavaram → Koyambedu | 28m → 12m | +620 pax/hr |
| 70 | MEDIUM | ADD BUSES | Villivakkam | Villivakkam → Anna Nagar | 22m → 9m | +480 pax/hr |
| 87 | CRITICAL | ADD BUSES | Tambaram | Tambaram → Guindy | 35m → 11m | +790 pax/hr |

**Bus dispatch stepper** (`[−] 13 [+]`):
- Min 1, max 20 buses
- Clicking +/- updates the number on the card

### Alerts Tab
Show 3–5 alert cards with:
- Alert type (WEATHER, EVENT, INFRASTRUCTURE, CROWD)
- Title + description
- Severity badge
- Timestamp

Pre-populated alerts:
```
🌧 WEATHER — Heavy Rain: Velachery Bypass Flood [LIVE]
   Flooding reported. Route 29C affected.

🏏 EVENT — IPL Match: CSK vs MI @ MA Chidambaram [LIVE]
   High crowd density expected post-match at Chepauk.

👥 CROWD — Marina Beach Weekend Crowd Surge
   Elevated pedestrian activity near Beach Road.

🚧 INFRASTRUCTURE — Metro Phase-2 Construction: Saidapet
   Lane closure causing traffic slowdown on Mount Road.
```

### Depots Tab
Show a table/list of 5 depots:
| Depot | Location | Buses Available | Buses Deployed |
|-------|----------|-----------------|----------------|
| Adyar | Adyar | 45 | 120 |
| Broadway | Broadway | 38 | 95 |
| Madhavaram | Madhavaram | 52 | 140 |
| Villivakkam | Villivakkam | 31 | 88 |
| Tambaram | Tambaram | 48 | 105 |

### Log Tab
Chronological list of recent approved/rejected actions with timestamp, route, action type, and officer status.

---

## 5. Bottom Disruption Ticker

A marquee/ticker bar at the very bottom of the screen.

**Styling:** Dark background, slightly lighter than main bg. Small text. Scrolls continuously left to right (CSS `animation: scroll linear infinite`).

**Left label:** `DISRUPTION INTELLIGENCE` in small caps + a flashing red dot

**Content** (comma-separated, scrolling):
```
📍 IPL Match Ends — CSK vs MI @ Chepauk  [LIVE]  ·  
🌧 Heavy Rain — Velachery Bypass Flood  [LIVE]  ·  
👥 Marina Beach Weekend Crowd Surge  ·  
🚧 Metro Phase-2 Work — Saidapet Stall  ·  
🎓 Anna University Exams — Kotturpuram Congestion  ·  
🏥 Government Hospital OPD Rush — Egmore
```

`[LIVE]` items get a pulsing green badge.

---

## 6. Simulation Logic

### `useSimulation` hook
Runs on mount, updates state every 3 seconds:

```typescript
// Bus position drift
buses.forEach(bus => {
  if (bus.status === 'running') {
    bus.lat += (Math.random() - 0.5) * 0.002;
    bus.lng += (Math.random() - 0.5) * 0.002;
    bus.speed = Math.floor(Math.random() * 40) + 5;
  }
  // Random occupancy fluctuation ±5%
  bus.occupancy = Math.min(100, Math.max(10, bus.occupancy + (Math.random() - 0.5) * 10));
});

// Random status changes
if (Math.random() < 0.02) {
  // 2% chance per tick: a bus changes status
}
```

### Header KPI updates (every 5s)
- Active buses: randomly 1–8 (simulates buses going offline/online)
- Avg wait: 4.0–5.5 min range
- Avg OCC: 58–68% range
- Reserve fleet: 280–310 range

### Time
```typescript
const [time, setTime] = useState('');
useEffect(() => {
  const interval = setInterval(() => {
    setTime(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }));
  }, 1000);
  return () => clearInterval(interval);
}, []);
```

---

## 7. Data Generation

### Bus initial positions
Generate ~650 buses distributed across Chennai's key areas. Use these lat/lng bounding boxes:

```typescript
const CHENNAI_BOUNDS = {
  north: 13.25, south: 12.85,
  east: 80.35, west: 80.10
};

// Weight placement towards populated corridors:
const CORRIDORS = [
  { name: 'Anna Salai', lat: 13.05, lng: 80.25, density: 0.15 },
  { name: 'GST Road', lat: 12.92, lng: 80.15, density: 0.12 },
  { name: 'OMR', lat: 12.95, lng: 80.24, density: 0.10 },
  { name: 'Poonamallee', lat: 13.05, lng: 80.16, density: 0.10 },
  { name: 'North Chennai', lat: 13.15, lng: 80.27, density: 0.12 },
  // remaining spread across greater Chennai
];
```

### Bus data type
```typescript
interface Bus {
  id: string;          // e.g., "BUS-1042"
  route: string;       // e.g., "29C"
  type: 'Ordinary' | 'Deluxe' | 'AC' | 'Express';
  status: 'running' | 'stopped' | 'overloaded' | 'stuck';
  lat: number;
  lng: number;
  occupancy: number;   // 0–100
  speed: number;       // km/h
  nextStop: string;    // Chennai stop name
  heading: number;     // degrees
  eta: number;         // minutes
  direction: 'Inbound' | 'Outbound';
}
```

### Real Chennai bus stop names to use as `nextStop`
```
Adyar, Besant Nagar, Thiruvanmiyur, Velachery, Guindy, Saidapet,
T. Nagar, Egmore, Park Town, Broadway, Perambur, Villivakkam,
Madhavaram, Ambattur, Koyambedu, Anna Nagar, Avadi, Tambaram,
Chromepet, Pallavaram, Alandur, St. Thomas Mount, Porur, Valasaravakkam,
Sriperumbudur, Sholinganallur, Perungudi, Thoraipakkam, Karapakkam,
Kilambakkam, Vandaloor, Pallikaranai, Medavakkam, Selaiyur
```

---

## 8. Component File Structure

```
src/
├── app/
│   ├── page.tsx              ← Main dashboard page
│   └── layout.tsx
├── components/
│   ├── Header.tsx            ← Top KPI bar
│   ├── LeftSidebar.tsx       ← Navigation toggles
│   ├── MapView.tsx           ← Mapbox/Leaflet map + bus markers
│   ├── BusMarker.tsx         ← Individual bus chip component
│   ├── BusPopup.tsx          ← Click popup card
│   ├── RightSidebar.tsx      ← Actions/Alerts/Depots/Log panel
│   ├── ActionCard.tsx        ← Individual action card with approve/reject
│   ├── AlertCard.tsx         ← Alert item
│   ├── DepotTable.tsx        ← Depot status table
│   ├── DisruptionTicker.tsx  ← Bottom scrolling ticker
│   └── Legend.tsx            ← Map legend bottom-left
├── hooks/
│   ├── useSimulation.ts      ← Bus position + KPI simulation loop
│   └── useClock.ts           ← IST clock
├── data/
│   ├── buses.ts              ← Initial bus data generator
│   ├── actions.ts            ← Pre-populated action cards
│   ├── alerts.ts             ← Alert data
│   └── routes.ts             ← Route polyline coordinates
└── types/
    └── index.ts              ← TypeScript interfaces
```

---

## 9. Key Interactions & Behaviors

1. **Bus click** → show floating BusPopup card near the bus marker; clicking elsewhere or `×` dismisses it
2. **Sidebar toggle** → clicking Routes/Hotspots/Depots/Traffic toggles that map layer on/off
3. **Approve action** → card fades out with green flash, pending count decrements, action added to LOG tab
4. **Reject action** → card fades out with red flash, pending count decrements, action added to LOG tab
5. **Bus stepper** → `[−]` / `[+]` buttons on action card change the dispatch number (min 1, max 20)
6. **Live header** → KPI numbers update every 5 seconds with smooth number transitions
7. **Bus count badge** → left sidebar "X buses live" updates every 5 seconds
8. **Map panning/zooming** → fully interactive, buses stay on their correct positions as you pan

---

## 10. Animations & Polish

- **LIVE badge:** pulsing green circle (`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }`)
- **Overloaded buses:** subtle red glow animation on their border
- **Action card approve:** `opacity 0.3s ease-out, transform 0.3s ease-out` → slide right + fade
- **Action card reject:** same but slide left
- **Ticker scroll:** `@keyframes ticker { from { transform: translateX(100%); } to { transform: translateX(-100%); } }`, ~60s duration, linear, infinite
- **KPI number updates:** brief yellow flash/highlight on the number when it changes
- **Bus popup entry:** `scale(0.8) → scale(1)` fade-in with `transition: all 0.15s ease-out`

---

## 11. Sample `actions.ts` Data

```typescript
export const INITIAL_ACTIONS = [
  {
    id: 'a1',
    route: '23C',
    priority: 'CRITICAL',
    actionType: 'ADD_BUSES',
    description: 'Deploy 13 additional Ordinary buses from Adyar depot on Route 23C (Besant Nagar → Ayanavaram). Reduces avg wait from 25 min to 10 min.',
    routeDescription: 'Besant Nagar → Ayanavaram',
    depot: 'Adyar',
    busesRequired: 13,
    waitBefore: 25,
    waitAfter: 10,
    impact: '+715 additional passengers served/hr',
  },
  {
    id: 'a2',
    route: '216',
    priority: 'CRITICAL',
    actionType: 'ADD_BUSES',
    description: 'Deploy 10 additional Ordinary buses from Broadway depot on Route 216 (Island Grounds → Kilambakkam). Reduces avg wait from 33 min to 11 min.',
    routeDescription: 'Island Grounds → Kilambakkam(Xcbt)',
    depot: 'Broadway',
    busesRequired: 10,
    waitBefore: 33,
    waitAfter: 11,
    impact: '+715 additional passengers served/hr',
  },
  {
    id: 'a3',
    route: '29C',
    priority: 'CRITICAL',
    actionType: 'ADD_BUSES',
    description: 'Deploy 13 additional Ordinary buses from Adyar depot on Route 29C (Besant Nagar → Perambur). Reduces avg wait from 27 min to 10 min.',
    routeDescription: 'Besant Nagar → Perambur',
    depot: 'Adyar',
    busesRequired: 13,
    waitBefore: 27,
    waitAfter: 10,
    impact: '+715 additional passengers served/hr',
  },
  {
    id: 'a4',
    route: '29C',
    priority: 'MEDIUM',
    actionType: 'REROUTE',
    description: 'Divert Route 29C via Pallikaranai Road to avoid Velachery Bypass flooding. No passenger transfer required.',
    routeDescription: 'Velachery Bypass → Pallikaranai Road',
    depot: null,
    busesRequired: null,
    waitBefore: 27,
    waitAfter: 22,
    impact: 'Avoids flooded road, maintains schedule',
  },
  {
    id: 'a5',
    route: '18',
    priority: 'CRITICAL',
    actionType: 'ADD_BUSES',
    description: 'Deploy 13 additional Ordinary buses from Broadway depot on Route 18 (Broadway → Thandar Nagar). Reduces avg wait from 33 min to 9 min.',
    routeDescription: 'Broadway → Thandar Nagar',
    depot: 'Broadway',
    busesRequired: 13,
    waitBefore: 33,
    waitAfter: 9,
    impact: '+715 additional passengers served/hr',
  },
  {
    id: 'a6',
    route: '47B',
    priority: 'CRITICAL',
    actionType: 'ADD_BUSES',
    description: 'Deploy 11 additional Ordinary buses from Madhavaram depot on Route 47B (Madhavaram → Koyambedu). Reduces avg wait from 28 min to 12 min.',
    routeDescription: 'Madhavaram → Koyambedu',
    depot: 'Madhavaram',
    busesRequired: 11,
    waitBefore: 28,
    waitAfter: 12,
    impact: '+620 additional passengers served/hr',
  },
  {
    id: 'a7',
    route: '70',
    priority: 'MEDIUM',
    actionType: 'ADD_BUSES',
    description: 'Deploy 8 additional Ordinary buses from Villivakkam depot on Route 70 (Villivakkam → Anna Nagar). Reduces avg wait from 22 min to 9 min.',
    routeDescription: 'Villivakkam → Anna Nagar',
    depot: 'Villivakkam',
    busesRequired: 8,
    waitBefore: 22,
    waitAfter: 9,
    impact: '+480 additional passengers served/hr',
  },
  {
    id: 'a8',
    route: '87',
    priority: 'CRITICAL',
    actionType: 'ADD_BUSES',
    description: 'Deploy 15 additional Ordinary buses from Tambaram depot on Route 87 (Tambaram → Guindy). Reduces avg wait from 35 min to 11 min.',
    routeDescription: 'Tambaram → Guindy',
    depot: 'Tambaram',
    busesRequired: 15,
    waitBefore: 35,
    waitAfter: 11,
    impact: '+790 additional passengers served/hr',
  },
];
```

---

## 12. Environment Setup

```bash
npx create-next-app@latest u-bocc --typescript --tailwind --eslint --app
cd u-bocc
npm install react-map-gl mapbox-gl lucide-react
# Add your Mapbox token to .env.local:
# NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
npm run dev
```

If not using Mapbox (no token), use **Leaflet + react-leaflet** with CartoDB Dark Matter tiles (no token required):
```bash
npm install leaflet react-leaflet @types/leaflet
```
Tile URL: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`

---

## Summary of What Makes This Project Stand Out

1. **650+ animated bus markers** across the real map of Chennai, color-coded by status
2. **AI action recommendation panel** with approve/reject workflow — the core value prop
3. **Real-time KPI dashboard** updating every few seconds to simulate live ops
4. **Multi-layer map** (Routes, Hotspots, Depots, Traffic toggles)
5. **Rich bus detail popup** on click with occupancy bar, speed, ETA
6. **Disruption intelligence ticker** with contextual Chennai events (IPL, flooding, metro)
7. **Dark command-center aesthetic** — feels like a real ops center
8. **Quantified impact** on every action card (+X passengers/hr, wait time reduction)
