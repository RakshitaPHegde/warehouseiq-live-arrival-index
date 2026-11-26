# WarehouseIQ — Live Arrival Index

**Problem Statement 09:** *The Warehouse's Broken Number Ranges*  
**Problem Domain:** Balanced Searching and Ordered Indexing

WarehouseIQ is a real-time warehouse package tracking dashboard powered by an incremental **AVL Tree Interval Index**. Incoming package IDs arriving in arbitrary order are consolidated into sorted, non-overlapping consecutive intervals `[start, end]` without sorting all IDs on every arrival or allocating memory proportional to the largest ID.

## Core Capabilities




- **AVL Tree Interval Engine (`src/engine/avlIntervalTree.js`)**:
  - Incremental `O(log k)` insertion, predecessor/successor lookup, boundary extension, and bridge merging (`LL`, `RR`, `LR`, `RL` rotations).
  - Duplicate suppression without modifying existing intervals.
  - Supports arbitrarily large/sparse IDs (e.g., `10` and `1,000,000`) in `O(k)` space.
  - Pruned `O(log k + m)` range queries for missing package intervals.
- **7 Interactive Dashboard Sections**:
  1. **Dashboard** — Executive overview, KPI cards, live arrival control, interval density chart, and recent feed.
  2. **Live Package Arrivals** — Single IDs, batch sequences, configurable random arrival generator, and auto-stream simulator.
  3. **Arrival Intervals** — Visual horizontal range bars, gap indicators, and animated Before/After bridge merges.
  4. **Missing Packages** — Missing range finder across any `[Start, End]` boundary with one-click gap filling.
  5. **Range Search** — Point lookup and pruned AVL range search with node traversal telemetry.
  6. **Algorithm Visualization** — Interactive SVG AVL tree diagram (Before/After/Side-by-Side), step-by-step execution trace, complexity table, and built-in Test Cases 1–6 runner.
  7. **Reports** — Sorted intervals table, missing ranges summary, arrival history, and **Export CSV**.


## Running Locally in VS Code

1. Open the `WarehouseIQ` folder in VS Code (`File -> Open Folder...`).
2. Open the integrated terminal (`Ctrl + \``).
3. Install dependencies:
   ```bash
   npm install
   ```
   
4. Run unit tests:
   ```bash
   npm test
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
6. Open the local URL shown in the terminal (typically `http://localhost:5173`).

## Deploying to Vercel

1. Push the project folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com), click **Add New Project**, and import your repository.
3. Vercel automatically detects Vite:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Click **Deploy**.
