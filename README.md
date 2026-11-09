# FlowOps AI: Zero-Friction Agentic ERP Copilot & Role-Adaptive PWA

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Rithick-git/flowops-agentic-erp)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Rithick-git/flowops-agentic-erp)

> **"Eliminating ERP bloat with a role-adaptive Progressive Web App, zero-typing invoice/voice intake, live process-mining bottleneck radar, and sub-115ms deterministic safety guardrails."**

---

## 🌟 The 5 Core ERP Problems We Solved
1. **Information Overload & Poor UI/UX $\to$ Role-Adaptive Chameleon Workspace:** Instead of forcing every employee through 50 dense menu tabs, FlowOps dynamically morphs its entire UI based on the active persona (*Warehouse Deskless Worker*, *Procurement Officer*, or *CFO Executive*).
2. **Manual Data Entry Fatigue $\to$ Zero-Entry Multimodal Intake (OCR + Voice + Live Camera):** Users drop raw vendor invoices/POs, speak natural voice commands, or point their phone camera at physical pallet barcodes & QR codes with real-time `html5-qrcode` computer vision.
3. **Rigid & Fragmented Workflows $\to$ Live Process-Mining Bottleneck Radar:** Analyzes event logs across `Order -> Warehouse Pick -> QA -> Invoice -> Payment` to highlight hidden dwell-time bottlenecks and executes 1-click AI workflow remediations.
4. **Limited Mobile Accessibility $\to$ Offline-Ready Mobile-First PWA:** Installable directly from the browser with zero app-store friction, touch-first cards for floor staff, and Web Audio API scan confirmation chimes.
5. **Difficulty Extracting Insights $\to$ Natural Language BI & Grounded Guardrails:** Non-technical users ask plain-English questions to generate instant visual KPI breakdowns, while a deterministic **Pre-Commit Guardrail** verifies that every ERP write-action is 100% grounded in user input before touching the ledger.

---

## 🚀 Instant 1-Click Cloud Deployment

### 1. Deploy Frontend on Vercel
Click the button below to deploy the frontend PWA to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Rithick-git/flowops-agentic-erp)

* **Build Command:** `cd frontend && npm install && npm run build`
* **Output Directory:** `frontend/dist`
* **Environment Variable:** `VITE_API_URL` (Set to your deployed Render backend URL)

### 2. Deploy Backend on Render
Click the button below to deploy the Node.js Express ERP backend to Render:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Rithick-git/flowops-agentic-erp)

* Render automatically reads `render.yaml` and launches the backend service.

---

## 💻 Local Quickstart

```bash
# 1. Clone repository
git clone https://github.com/Rithick-git/flowops-agentic-erp.git
cd flowops-agentic-erp

# 2. Install all dependencies
npm run install:all

# 3. Launch both backend (port 4000) & PWA frontend (port 5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

