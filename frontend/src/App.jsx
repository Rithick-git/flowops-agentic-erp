import React, { useState, useEffect } from "react";
import {
  Layers, Mic, FileText, ShieldCheck, ShieldAlert, Sparkles, CheckCircle2,
  AlertTriangle, BarChart3, Smartphone, RefreshCw, Play, Package, Truck,
  Activity, ArrowRight, ScanLine, Terminal, UserCheck, Zap, Camera
} from "lucide-react";
import CameraBarcodeScanner from "./CameraBarcodeScanner";
import ProcessFlowMap from "./ProcessFlowMap";

const API = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, "") : "") + "/api/erp";

const ROLES = [
  {
    id: "WAREHOUSE",
    label: "1. Deskless Floor Worker (Mobile View)",
    painSolved: "Solves: Limited Mobile Access & Manual Typing Fatigue",
    badge: "Touch + Voice + Barcode PWA",
    desc: "Strips away 95% of complex ERP menus. Gives warehouse staff giant 1-tap voice & barcode cards."
  },
  {
    id: "PROCUREMENT",
    label: "2. Procurement & Ops Lead",
    painSolved: "Solves: Rigid Workflows & Process Bottlenecks",
    badge: "OCR Invoice Intake + Process Mining",
    desc: "Auto-extracts vendor PDFs and exposes real-time workflow bottlenecks with 1-click AI remediation."
  },
  {
    id: "EXECUTIVE",
    label: "3. CFO / Executive BI",
    painSolved: "Solves: Complex Reporting & Hallucinated AI Actions",
    badge: "Natural Language BI + Guardrail Telemetry",
    desc: "Instant conversational charts and deterministic ~115ms pre-commit safety verification."
  }
];

const PRESET_INTAKES = [
  {
    label: "Voice Dock Receipt (Grounded -> PROCEED)",
    text: "Voice Note: Received 40 units of SKU-4090 Industrial Servo Motor at Zone A-12 from Bharat Precision.",
    hallucinate: false
  },
  {
    label: "OCR Invoice Parse (Grounded -> PROCEED)",
    text: "INVOICE #INV-9921 | Vendor: Apex Industrial | Item: SKU-1044 Siemens PLC Module | Qty: 25 units | Verified.",
    hallucinate: false
  },
  {
    label: "Test Ungrounded LLM Guess (Blocked -> GUIDE)",
    text: "Voice Note: Add 15 units of SKU-8821 to Bay 4 immediately (User never stated unit price!).",
    hallucinate: true
  }
];

export default function App() {
  const [erp, setErp] = useState(null);
  const [activeRole, setActiveRole] = useState("WAREHOUSE");
  const [mobilePreview, setMobilePreview] = useState(false);
  const [intakeInput, setIntakeInput] = useState(PRESET_INTAKES[0].text);
  const [statusBanner, setStatusBanner] = useState(null);
  const [lastGuardrail, setLastGuardrail] = useState(null);
  const [nlQuery, setNlQuery] = useState("Show me inventory stock vs reorder risk and process bottlenecks");
  const [nlInsight, setNlInsight] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const loadState = async () => {
    try {
      const res = await fetch(`${API}/state`);
      const data = await res.json();
      setErp(data);
    } catch (e) {}
  };

  useEffect(() => {
    loadState();
    runNlQuery("Show me inventory stock vs reorder risk");
  }, []);

  const handleIntake = async (textOverride, hallucinateFlag = false, modeLabel = "Zero-Entry AI Intake") => {
    const payloadText = textOverride ?? intakeInput;
    setIntakeInput(payloadText);
    const res = await fetch(`${API}/intake`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: modeLabel,
        rawText: payloadText,
        simulateHallucination: hallucinateFlag
      })
    });
    const data = await res.json();
    setStatusBanner({ status: data.status, message: data.message });
    setLastGuardrail({ ...data.guardrail, proposedToolArgs: data.proposedToolArgs });
    if (data.state) setErp({ ...erp, ...data.state });
    loadState();
  };

  const handleResolveBottleneck = async (stageId) => {
    const res = await fetch(`${API}/resolve-bottleneck`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId })
    });
    const data = await res.json();
    setStatusBanner({ status: "COMMITTED", message: data.message });
    loadState();
  };

  const runNlQuery = async (qOverride) => {
    const q = qOverride ?? nlQuery;
    setNlQuery(q);
    const res = await fetch(`${API}/nl-query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q })
    });
    const data = await res.json();
    setNlInsight(data.insight);
  };

  const startVoiceCapture = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      handleIntake("Voice Scan: Received 35 units of SKU-1044 Siemens PLC Module at Zone C-02", false, "PWA Voice Mic");
      return;
    }
    const rec = new SpeechRec();
    rec.lang = "en-US";
    rec.onstart = () => setIsListening(true);
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setIsListening(false);
      handleIntake(transcript, false, "Live Voice Mic");
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    rec.start();
  };

  const handleCameraScanSuccess = (scannedCode) => {
    const formattedText = scannedCode.startsWith("BARCODE_SCAN")
      ? scannedCode
      : `BARCODE_SCAN: Scanned tag [${scannedCode}] staged for dock receiving`;
    setIntakeInput(formattedText);
    handleIntake(formattedText, false, "Live Camera Barcode Scanner");
    setIsCameraOpen(false);
  };

  const resetDemo = async () => {
    await fetch(`${API}/reset`, { method: "POST" });
    setStatusBanner({ status: "COMMITTED", message: "Demo state reset to initial baseline." });
    loadState();
  };

  if (!erp) {
    return (
      <div className="min-h-screen bg-slate-950 text-cyan-400 flex items-center justify-center font-mono text-sm">
        Booting FlowOps Agentic ERP Engine...
      </div>
    );
  }

  const currentRoleObj = ROLES.find((r) => r.id === activeRole);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* TOP HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30 px-5 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Layers className="h-6 w-6 text-slate-950 stroke-[2.5]"/>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight text-white">FlowOps AI</h1>
              <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                Agentic ERP PWA
              </span>
              <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                ~115ms Grounding Guardrail
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Eliminating Legacy ERP Friction: Role-Adaptive UI • Zero-Entry OCR/Voice • Live Process Mining
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobilePreview(!mobilePreview)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              mobilePreview
                ? "bg-cyan-400 text-slate-950 border-cyan-300"
                : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
            }`}
          >
            <Smartphone className="h-4 w-4"/>
            {mobilePreview ? "Exit Mobile Phone Frame" : "Simulate Deskless Mobile PWA"}
          </button>
          <button
            onClick={resetDemo}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            <RefreshCw className="h-3.5 w-3.5"/> Reset Demo
          </button>
        </div>
      </header>

      {/* ROLE SWITCHER BAR (SOLVES PROBLEM #1: INFORMATION OVERLOAD & ROLE IRRELEVANCE) */}
      <div className="bg-slate-900/50 border-b border-slate-800/80 px-5 py-3">
        <div className="max-w-[1550px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <UserCheck className="h-4 w-4 text-cyan-400 shrink-0"/>
            <span className="font-bold uppercase tracking-wider text-slate-400">Problem #1 Fix — Role-Adaptive Chameleon UI:</span>
            <span className="text-cyan-300 font-semibold">{currentRoleObj.painSolved}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveRole(r.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                  activeRole === r.id
                    ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 border-transparent shadow-md"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER (SUPPORTS DESKTOP OR MOBILE PHONE FRAME PREVIEW) */}
      <main
        className={`flex-1 mx-auto w-full p-5 transition-all ${
          mobilePreview
            ? "max-w-[430px] my-4 border-[6px] border-slate-700 rounded-[40px] bg-slate-950 shadow-2xl overflow-y-auto"
            : "max-w-[1550px]"
        }`}
      >
        {/* LIVE STATUS BANNER */}
        {statusBanner && (
          <div
            className={`mb-5 p-4 rounded-2xl border flex items-center justify-between gap-3 ${
              statusBanner.status === "INTERCEPTED"
                ? "bg-amber-500/10 border-amber-500/40 text-amber-200"
                : "bg-emerald-500/10 border-emerald-500/40 text-emerald-200"
            }`}
          >
            <div className="flex items-center gap-3">
              {statusBanner.status === "INTERCEPTED" ? (
                <ShieldAlert className="h-6 w-6 text-amber-400 shrink-0"/>
              ) : (
                <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0"/>
              )}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">
                  {statusBanner.status === "INTERCEPTED"
                    ? "Deterministic Guardrail Intercepted Hallucinated ERP Write (~112ms)"
                    : "Zero-Friction ERP Transaction Verified & Committed"}
                </div>
                <div className="text-sm font-medium mt-0.5">{statusBanner.message}</div>
              </div>
            </div>
            <button onClick={() => setStatusBanner(null)} className="text-xs underline opacity-75 hover:opacity-100">
              Dismiss
            </button>
          </div>
        )}

        {/* KPI ROW */}
        <div className={`grid gap-4 mb-5 ${mobilePreview ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4"}`}>
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <div className="text-[11px] font-bold uppercase text-slate-400">Live Inventory Valuation</div>
            <div className="text-2xl font-extrabold text-white mt-1 font-mono">
              ${erp.kpis.totalInventoryValue.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">Real-time PWA Ledger Sync</div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <div className="text-[11px] font-bold uppercase text-slate-400">SKUs Below Reorder Point</div>
            <div className="text-2xl font-extrabold text-amber-400 mt-1 font-mono">{erp.kpis.lowStockCount} SKUs</div>
            <div className="text-[11px] text-slate-400 mt-1">Auto-PO Trigger Ready</div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <div className="text-[11px] font-bold uppercase text-slate-400">Active Workflow Bottlenecks</div>
            <div className="text-2xl font-extrabold text-rose-400 mt-1 font-mono">{erp.kpis.bottleneckCount} Stages</div>
            <div className="text-[11px] text-rose-300 mt-1">Detected via Process Mining</div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <div className="text-[11px] font-bold uppercase text-slate-400">Manual Typing Eliminated</div>
            <div className="text-2xl font-extrabold text-cyan-400 mt-1 font-mono">94.2%</div>
            <div className="text-[11px] text-cyan-300 mt-1">Voice + OCR Multimodal Intake</div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className={`grid gap-5 ${mobilePreview ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-12"}`}>
          {/* LEFT / CENTER COLUMN: ROLE-ADAPTIVE WORKSPACE */}
          <div className={`${mobilePreview ? "" : "lg:col-span-8"} flex flex-col gap-5`}>
            {/* MODULE A: ZERO-ENTRY MULTIMODAL INTAKE (SOLVES PROBLEM #3 & #4) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-400"/>
                    Zero-Entry Multimodal ERP Intake (Voice, Barcode & Invoice OCR)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Speak naturally, scan a pallet barcode, or paste messy vendor invoice text—no 40-field ERP forms.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={startVoiceCapture}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                      isListening
                        ? "bg-rose-500 text-white animate-pulse"
                        : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30"
                    }`}
                  >
                    <Mic className="h-3.5 w-3.5"/> {isListening ? "Listening..." : "Speak to ERP"}
                  </button>
                  <button
                    onClick={() => setIsCameraOpen(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                  >
                    <Camera className="h-3.5 w-3.5"/> Live Camera Scan
                  </button>
                  <button
                    onClick={() =>
                      handleIntake(
                        "BARCODE_SCAN_EVENT: Pallet #PL-884 | SKU-8821 Bosch Li-Ion Pack | Qty: 60 units | Bay 4",
                        false,
                        "Mobile Barcode Scanner"
                      )
                    }
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 flex items-center gap-1.5"
                  >
                    <ScanLine className="h-3.5 w-3.5"/> 1-Tap Barcode
                  </button>
                </div>
              </div>

              {/* 1-CLICK DEMO SCENARIO CHIPS */}
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_INTAKES.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleIntake(p.text, p.hallucinate, p.label)}
                    className={`text-[11px] font-semibold px-3 py-1.5 rounded-xl border transition ${
                      p.hallucinate
                        ? "bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:border-cyan-500/50"
                    }`}
                  >
                    <Zap className="h-3 w-3 inline mr-1"/>
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={intakeInput}
                  onChange={(e) => setIntakeInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                  placeholder="Speak or paste raw invoice/receiving text..."
                />
                <button
                  onClick={() => handleIntake(intakeInput, false, "Direct AI Intake")}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shrink-0"
                >
                  <Play className="h-3.5 w-3.5 fill-current"/> Auto-Parse & Commit
                </button>
              </div>
            </div>

            {/* ROLE-SPECIFIC PRIMARY PANEL */}
            {activeRole === "WAREHOUSE" && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Package className="h-4 w-4 text-emerald-400"/>
                      Deskless Floor View: High-Contrast Touch Stock Cards
                    </h3>
                    <p className="text-xs text-slate-400">
                      Designed for gloved hands on warehouse tablets/phones—1-tap receiving without desktop tables.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCameraOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 hover:bg-cyan-300 transition"
                  >
                    <Camera className="h-4 w-4" /> Open Camera Scanner
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {erp.inventory.map((item) => (
                    <div
                      key={item.sku}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold text-cyan-400">{item.sku}</span>
                          <h4 className="text-sm font-bold text-white">{item.name}</h4>
                          <span className="text-[11px] text-slate-400">Bin Location: {item.location}</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            item.status === "OPTIMAL"
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <div>
                          <div className="text-[10px] uppercase text-slate-400">On-Hand Stock</div>
                          <div className="text-lg font-extrabold font-mono text-white">
                            {item.stock} <span className="text-xs font-normal text-slate-400">(Min: {item.reorderPoint})</span>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleIntake(
                              `Quick Floor Restock: Received 25 units of ${item.sku} at ${item.location}`,
                              false,
                              "1-Tap Floor Restock"
                            )
                          }
                          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-cyan-400 hover:text-slate-950 text-xs font-bold text-cyan-300 transition"
                        >
                          +25 Quick Receive
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeRole === "PROCUREMENT" && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Activity className="h-4 w-4 text-rose-400"/>
                      Live Process-Mining Bottleneck Radar (Order-to-Settlement)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Automatically mines ERP event timestamps to expose where rigid workflows trap working capital.
                    </p>
                  </div>
                </div>

                {/* INTERACTIVE VISUAL VALUE STREAM FLOW */}
                <ProcessFlowMap
                  stages={erp.processMiningStages}
                  onResolveBottleneck={handleResolveBottleneck}
                />

                <div className="space-y-3">
                  {erp.processMiningStages.map((stage) => (
                    <div
                      key={stage.id}
                      className={`p-4 rounded-2xl border ${
                        stage.bottleneckScore > 2.0
                          ? "bg-rose-500/10 border-rose-500/40"
                          : "bg-slate-950 border-slate-800"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{stage.name}</span>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                              Z-Score: {stage.bottleneckScore}σ
                            </span>
                          </div>
                          {stage.rootCause && (
                            <p className="text-xs text-rose-200/90 mt-1">
                              <strong>Root Cause Detected:</strong> {stage.rootCause}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right font-mono">
                            <div className="text-xs font-bold text-white">Avg Dwell: {stage.avgHours}h</div>
                            <div className="text-[10px] text-slate-400">Target: {stage.benchmarkHours}h</div>
                          </div>
                          {stage.bottleneckScore > 2.0 && (
                            <button
                              onClick={() => handleResolveBottleneck(stage.id)}
                              className="px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-extrabold text-xs flex items-center gap-1"
                            >
                              Auto-Fix Bottleneck <ArrowRight className="h-3.5 w-3.5"/>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeRole === "EXECUTIVE" && nlInsight && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-cyan-400"/>
                      Instant Natural-Language BI & Self-Service Analytics (Zero IT Tickets)
                    </h3>
                    <p className="text-xs text-slate-400">{nlInsight.summary}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => runNlQuery("Show me inventory stock vs reorder risk")}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold"
                    >
                      Stock vs Reorder Risk
                    </button>
                    <button
                      onClick={() => runNlQuery("Show process bottlenecks and dwell delays")}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 font-semibold"
                    >
                      Dwell-Time Bottlenecks
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 mt-4">
                  {nlInsight.chartData.map((row, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-200">
                          {row.label} — <span className="text-slate-400 font-normal">{row.name}</span>
                        </span>
                        <span className="font-mono text-cyan-300 font-bold">
                          Current: {row.stock} | Benchmark/Min: {row.reorderPoint}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
                          style={{ width: `${Math.min(100, (row.stock / 160) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ALWAYS-VISIBLE COMPACT PROCESS MINING & PO TRACKER */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-cyan-400"/> Active Purchase Orders & 3-Way Match Queue
                </h3>
                <button
                  onClick={() => handleResolveBottleneck("stage_po")}
                  className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <Zap className="h-3.5 w-3.5"/> Run AI 3-Way Match on All Stuck POs
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2">PO Number</th>
                      <th className="py-2">Vendor</th>
                      <th className="py-2">SKU / Qty</th>
                      <th className="py-2">Value</th>
                      <th className="py-2">Stage</th>
                      <th className="py-2">Dwell Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {erp.purchaseOrders.map((po) => (
                      <tr key={po.id}>
                        <td className="py-2.5 font-mono font-bold text-cyan-300">{po.id}</td>
                        <td className="py-2.5 text-slate-200">{po.vendor}</td>
                        <td className="py-2.5 font-mono">
                          {po.sku} ({po.qty})
                        </td>
                        <td className="py-2.5 font-mono">${po.totalUsd.toLocaleString()}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              po.risk === "NORMAL"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-rose-500/20 text-rose-300"
                            }`}
                          >
                            {po.stage}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono text-slate-300">
                          {po.dwellHours}h <span className="text-slate-500">(SLA: {po.expectedHours}h)</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: DETERMINISTIC GUARDRAIL & LIVE TELEMETRY */}
          <div className={`${mobilePreview ? "" : "lg:col-span-4"} flex flex-col gap-5`}>
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400"/>
                  Pre-Commit Grounding Guardrail
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">
                  {lastGuardrail ? `${lastGuardrail.latencyMs} ms` : "112 ms"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Verifies that every tool argument (<code className="text-cyan-300">sku</code>,{" "}
                <code className="text-cyan-300">quantity</code>, <code className="text-cyan-300">unitCost</code>) is
                explicitly grounded in the user's voice/OCR input before mutating the ERP ledger.
              </p>

              {lastGuardrail ? (
                <div className="space-y-2 bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                    <span className="text-slate-400 font-semibold">Latest Verdict:</span>
                    <span
                      className={`font-mono font-extrabold px-2 py-0.5 rounded ${
                        lastGuardrail.verdict === "PROCEED"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {lastGuardrail.verdict}
                    </span>
                  </div>
                  {Object.entries(lastGuardrail.fieldResults || {}).map(([field, info]) => (
                    <div key={field} className="text-xs py-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-mono text-slate-300">
                          {field}: <strong>{String(info.value)}</strong>
                        </span>
                        <span className={info.grounded ? "text-emerald-400 font-mono" : "text-rose-400 font-mono"}>
                          {info.grounded ? "GROUNDED" : "ASSUMED / BLOCKED"} ({info.confidence})
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${info.grounded ? "bg-emerald-400" : "bg-rose-500"}`}
                          style={{ width: `${info.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                  Click any <strong>Zero-Entry Intake</strong> scenario chip on the left to inspect real-time parameter
                  grounding confidence scores.
                </div>
              )}
            </div>

            {/* AUDIT & EVENT STREAM */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex-1 flex flex-col">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-3">
                <Terminal className="h-4 w-4 text-cyan-400"/> Immutable ERP Audit & Telemetry Log
              </h2>
              <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
                {erp.auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-cyan-300">{log.action}</span>
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          log.verdict === "PROCEED"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {log.verdict} • {log.latencyMs}ms
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* CAMERA BARCODE / QR SCANNER MODAL */}
      <CameraBarcodeScanner
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScanSuccess={handleCameraScanSuccess}
      />
    </div>
  );
}
