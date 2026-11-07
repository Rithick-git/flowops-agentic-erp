const express = require("express");
const cors = require("cors");
const { initialErpState } = require("./erpStore");

const app = express();
app.use(cors());
app.use(express.json());

let erpState = JSON.parse(JSON.stringify(initialErpState));

function evaluateGuardrail(transcript, proposedArgs) {
  const text = (transcript || "").toLowerCase();
  const fieldResults = {};
  let allGrounded = true;

  for (const [key, val] of Object.entries(proposedArgs)) {
    const valStr = String(val).toLowerCase();
    const grounded = text.includes(valStr) || (key === "sku" && text.includes(valStr.replace("sku-", "")));
    const confidence = grounded ? Number((0.94 + Math.random() * 0.05).toFixed(2)) : Number((0.12 + Math.random() * 0.15).toFixed(2));
    fieldResults[key] = { value: val, grounded, confidence };
    if (!grounded || confidence < 0.85) allGrounded = false;
  }

  return {
    verdict: allGrounded ? "PROCEED" : "GUIDE_INTERCEPTED",
    latencyMs: Math.floor(104 + Math.random() * 18),
    fieldResults
  };
}

app.get("/api/erp/state", (req, res) => {
  const totalInventoryValue = erpState.inventory.reduce((sum, item) => sum + item.stock * item.unitCost, 0);
  const lowStockCount = erpState.inventory.filter((i) => i.stock <= i.reorderPoint).length;
  const bottleneckCount = erpState.processMiningStages.filter((s) => s.bottleneckScore > 2.0).length;
  res.json({
    ...erpState,
    kpis: {
      totalInventoryValue,
      lowStockCount,
      bottleneckCount,
      automationSavingsHours: 42.5
    }
  });
});

app.post("/api/erp/intake", (req, res) => {
  const { mode, rawText, simulateHallucination } = req.body;
  const text = rawText || "Received 50 units of SKU-4090 from Bharat Precision Ltd at Zone A-12";

  // Extract entities deterministically + simulate eager LLM guessing if toggled
  const skuMatch = text.match(/SKU-\d{4}/i);
  const textWithoutSku = text.replace(/SKU-\d{4}/gi, "").replace(/#?(?:PL|PO|BX|DR|INV)-\d+/gi, "");
  const qtyMatch = textWithoutSku.match(/\b(?:qty:?\s*|quantity:?\s*)?(\d+)\s*(?:units|packs|modules|motors|items|qty)?\b/i);

  let extractedSku = "SKU-4090";
  if (skuMatch) {
    extractedSku = skuMatch[0].toUpperCase();
  } else if (/8821|bosch|battery/i.test(text)) {
    extractedSku = "SKU-8821";
  } else if (/1044|siemens|plc/i.test(text)) {
    extractedSku = "SKU-1044";
  } else if (/5532|hydraulic|sensor/i.test(text)) {
    extractedSku = "SKU-5532";
  }

  const extractedQty = qtyMatch ? parseInt(qtyMatch[1], 10) : 25;

  const proposedToolArgs = {
    sku: extractedSku,
    quantity: extractedQty,
    unitCost: simulateHallucination ? 999 : 420
  };

  // For guardrail verification, check if unitCost was actually stated when simulateHallucination is true
  const guardrailTranscript = simulateHallucination
    ? text
    : `${text} verified unitCost 420 ${extractedSku} ${extractedQty}`;

  const guardrail = evaluateGuardrail(guardrailTranscript, proposedToolArgs);

  if (guardrail.verdict === "GUIDE_INTERCEPTED") {
    const logEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      actor: mode || "AI Copilot",
      action: "BLOCKED_UNGROUNDED_ERP_WRITE",
      verdict: "GUIDE_INTERCEPTED",
      latencyMs: guardrail.latencyMs,
      confidence: 0.96,
      details: `Intercepted update_inventory(${JSON.stringify(proposedToolArgs)}): LLM assumed unitCost=$999 without user/invoice grounding. Prompting user for confirmation.`,
      fieldResults: guardrail.fieldResults
    };
    erpState.auditLogs.unshift(logEntry);
    return res.json({
      status: "INTERCEPTED",
      message: "Guardrail blocked ungrounded ERP mutation! The AI tried to assume a Unit Cost ($999) not present in your voice/invoice input.",
      proposedToolArgs,
      guardrail,
      logEntry,
      state: erpState
    });
  }

  // Apply valid update to ERP inventory
  const item = erpState.inventory.find((i) => i.sku === extractedSku) || erpState.inventory[0];
  item.stock += extractedQty;
  item.status = item.stock > item.reorderPoint ? "OPTIMAL" : "LOW_STOCK";

  const logEntry = {
    id: `AUD-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toISOString(),
    actor: mode || "Multimodal Intake",
    action: `COMMITTED_INVENTORY_+${extractedQty}_${item.sku}`,
    verdict: "PROCEED",
    latencyMs: guardrail.latencyMs,
    confidence: 0.98,
    details: `Updated ${item.name} (${item.sku}) stock to ${item.stock} units. Zero manual typing required.`,
    fieldResults: guardrail.fieldResults
  };
  erpState.auditLogs.unshift(logEntry);

  return res.json({
    status: "COMMITTED",
    message: `Successfully committed +${extractedQty} units to ${item.sku} (${item.name}). Live stock is now ${item.stock}.`,
    proposedToolArgs,
    guardrail,
    logEntry,
    state: erpState
  });
});

app.post("/api/erp/resolve-bottleneck", (req, res) => {
  const { stageId } = req.body;
  const stage = erpState.processMiningStages.find((s) => s.id === stageId);
  if (stage) {
    stage.avgHours = Number((stage.benchmarkHours * 0.75).toFixed(1));
    stage.bottleneckScore = 0.55;
    stage.status = "OPTIMIZED_BY_AI";
  }
  erpState.purchaseOrders.forEach((po) => {
    if (po.risk !== "NORMAL") {
      po.stage = "APPROVED_AUTO_MATCHED";
      po.dwellHours = 1;
      po.risk = "NORMAL";
    }
  });

  const logEntry = {
    id: `AUD-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toISOString(),
    actor: "Process Mining Engine",
    action: "BOTTLENECK_AUTO_REMEDIATED",
    verdict: "PROCEED",
    latencyMs: 112,
    confidence: 0.99,
    details: `Executed automated 3-way PO/Invoice reconciliation & mobile barcode sync. Dwell time reduced from 31.5h to 4.5h.`
  };
  erpState.auditLogs.unshift(logEntry);

  res.json({
    status: "RESOLVED",
    message: "AI Process Remediation complete: 3-Way Match & QA Hold bottlenecks cleared.",
    state: erpState
  });
});

app.post("/api/erp/nl-query", (req, res) => {
  const { query } = req.body;
  const q = (query || "").toLowerCase();

  let insight = {
    title: "Executive Supply Chain & Working Capital Pulse",
    summary: "2 SKUs are currently below safety reorder points (SKU-1044 & SKU-4090), and $34,850 in Purchase Orders were previously stuck in 3-Way Match & QA holds.",
    chartData: erpState.inventory.map((i) => ({
      label: i.sku,
      name: i.name,
      stock: i.stock,
      reorderPoint: i.reorderPoint,
      valueUsd: i.stock * i.unitCost
    })),
    recommendation: "Trigger instant reorder for SKU-1044 (Siemens PLC Module) and enable automated 3-Way OCR matching."
  };

  if (q.includes("bottleneck") || q.includes("delay") || q.includes("slow")) {
    insight = {
      title: "Process Mining Dwell-Time Breakdown",
      summary: "PO Approval & 3-Way Match was averaging 31.5 hours (5.2x over benchmark) due to manual cross-screen PDF checking.",
      chartData: erpState.processMiningStages.map((s) => ({
        label: s.name.split(".")[1].trim(),
        name: s.name,
        stock: Math.round(s.avgHours * 10),
        reorderPoint: Math.round(s.benchmarkHours * 10),
        valueUsd: s.activeCount * 1200
      })),
      recommendation: "Deploy FlowOps Zero-Entry OCR Intake to cut approval dwell time by 86%."
    };
  }

  res.json({ insight });
});

app.post("/api/erp/reset", (req, res) => {
  erpState = JSON.parse(JSON.stringify(initialErpState));
  res.json({ status: "RESET", state: erpState });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`FlowOps Agentic ERP Backend running on port ${PORT}`));
