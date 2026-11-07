import React from "react";
import { Zap, AlertTriangle, CheckCircle2, Clock, ArrowRight, ShieldCheck } from "lucide-react";

export default function ProcessFlowMap({ stages, onResolveBottleneck }) {
  const getStageColor = (stage) => {
    if (stage.status === "OPTIMIZED_BY_AI") {
      return {
        bg: "bg-emerald-950/60",
        border: "border-emerald-400",
        glow: "shadow-[0_0_20px_rgba(52,211,153,0.3)]",
        badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        pulse: false
      };
    }
    if (stage.bottleneckScore > 3.0) {
      return {
        bg: "bg-rose-950/70",
        border: "border-rose-500",
        glow: "shadow-[0_0_25px_rgba(244,63,94,0.4)]",
        badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
        pulse: true
      };
    }
    if (stage.bottleneckScore > 2.0) {
      return {
        bg: "bg-amber-950/60",
        border: "border-amber-500",
        glow: "shadow-[0_0_15px_rgba(245,158,11,0.25)]",
        badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        pulse: true
      };
    }
    return {
      bg: "bg-slate-900/90",
      border: "border-slate-800",
      glow: "shadow-none",
      badge: "bg-slate-800 text-slate-300 border-slate-700",
      pulse: false
    };
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-4 overflow-hidden relative">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold block">
            VISUAL PROCESS MINING RADAR
          </span>
          <h4 className="text-xs font-extrabold text-white">End-to-End Enterprise Value Stream Flow</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping"></span>
            Critical Bottleneck Detected
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Target SLA Met
          </span>
        </div>
      </div>

      {/* HORIZONTAL WORKFLOW GRAPH (RESPONSIVE DESKTOP/MOBILE) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative z-10">
        {stages.map((stage, idx) => {
          const styling = getStageColor(stage);
          const isBottleneck = stage.bottleneckScore > 2.0;

          return (
            <div key={stage.id} className="relative flex flex-col">
              {/* STAGE CARD */}
              <div
                className={`flex-1 rounded-2xl border p-3.5 transition-all duration-300 flex flex-col justify-between ${styling.bg} ${styling.border} ${styling.glow} ${
                  styling.pulse ? "animate-[pulse_3s_ease-in-out_infinite]" : ""
                }`}
              >
                <div>
                  {/* STEP NUMBER & BADGE */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400">STAGE 0{idx + 1}</span>
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${styling.badge}`}>
                      {stage.status === "OPTIMIZED_BY_AI" ? "AI OPTIMIZED" : `${stage.bottleneckScore}σ`}
                    </span>
                  </div>

                  {/* STAGE NAME */}
                  <h5 className="text-xs font-bold text-white leading-snug mb-1">
                    {stage.name.replace(/^\d+\.\s*/, "")}
                  </h5>

                  {/* DWELL METRICS */}
                  <div className="bg-slate-950/70 rounded-xl p-2 my-2 border border-slate-800/60 font-mono text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Avg Dwell:</span>
                      <span className={isBottleneck ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                        {stage.avgHours}h
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>Target SLA:</span>
                      <span>{stage.benchmarkHours}h</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>In-Flight Queue:</span>
                      <span className="text-cyan-300 font-semibold">{stage.activeCount} orders</span>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTON IF BOTTLENECK */}
                {isBottleneck ? (
                  <button
                    onClick={() => onResolveBottleneck(stage.id)}
                    className="w-full mt-2 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-extrabold text-[11px] flex items-center justify-center gap-1 shadow-md transition"
                  >
                    <Zap className="h-3 w-3 fill-current" />
                    Auto-Remediate Flow
                  </button>
                ) : (
                  <div className="mt-2 text-center text-[10px] font-mono text-emerald-400/90 py-1 flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Flow Normalized
                  </div>
                )}
              </div>

              {/* CONNECTOR ARROW (VISIBLE ON DESKTOP BETWEEN NODES) */}
              {idx < stages.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 h-6 w-6 rounded-full bg-slate-900 border border-slate-700 items-center justify-center text-slate-400 shadow-md">
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

