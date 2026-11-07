const initialErpState = {
  inventory: [
    { sku: "SKU-4090", name: "Industrial Servo Motor 5kW", stock: 14, reorderPoint: 20, unitCost: 420, location: "Zone A-12", status: "LOW_STOCK" },
    { sku: "SKU-8821", name: "Bosch Li-Ion Battery Pack 48V", stock: 128, reorderPoint: 40, unitCost: 310, location: "Bay 4", status: "OPTIMAL" },
    { sku: "SKU-1044", name: "PLC Controller Module Siemens-S7", stock: 6, reorderPoint: 15, unitCost: 890, location: "Zone C-02", status: "CRITICAL" },
    { sku: "SKU-5532", name: "Hydraulic Pressure Sensor Pro", stock: 64, reorderPoint: 25, unitCost: 115, location: "Zone B-08", status: "OPTIMAL" }
  ],
  purchaseOrders: [
    { id: "PO-2026-901", vendor: "Apex Industrial GmbH", sku: "SKU-1044", qty: 25, totalUsd: 22250, stage: "QA_HOLD", dwellHours: 54, expectedHours: 8, risk: "HIGH_BOTTLENECK" },
    { id: "PO-2026-902", vendor: "Bharat Precision Ltd", sku: "SKU-4090", qty: 30, totalUsd: 12600, stage: "APPROVAL_PENDING", dwellHours: 38, expectedHours: 6, risk: "THREE_WAY_MISMATCH" },
    { id: "PO-2026-903", vendor: "VoltCore Energy Systems", sku: "SKU-8821", qty: 50, totalUsd: 15500, stage: "IN_TRANSIT", dwellHours: 12, expectedHours: 24, risk: "NORMAL" }
  ],
  processMiningStages: [
    { id: "stage_req", name: "1. Requisition Created", avgHours: 1.2, benchmarkHours: 2.0, activeCount: 18, bottleneckScore: 0.4, status: "HEALTHY" },
    { id: "stage_po", name: "2. PO Approval & 3-Way Match", avgHours: 31.5, benchmarkHours: 6.0, activeCount: 11, bottleneckScore: 4.25, status: "CRITICAL_BOTTLENECK", rootCause: "Manual PDF invoice-to-PO line item verification across 3 legacy ERP screens." },
    { id: "stage_qa", name: "3. Warehouse Dock & QA Inspect", avgHours: 19.8, benchmarkHours: 5.0, activeCount: 7, bottleneckScore: 2.96, status: "WARNING_BOTTLENECK", rootCause: "Deskless floor workers batch-entering paper receiving slips at end of shift." },
    { id: "stage_ledger", name: "4. GL Posting & Vendor Payout", avgHours: 2.4, benchmarkHours: 4.0, activeCount: 14, bottleneckScore: 0.6, status: "HEALTHY" }
  ],
  auditLogs: [
    {
      id: "AUD-100",
      timestamp: new Date().toISOString(),
      actor: "System Init",
      action: "ERP_CORE_READY",
      verdict: "PROCEED",
      latencyMs: 98,
      confidence: 0.99,
      details: "Connected to Enterprise Ledger & Deterministic Guardrail Engine."
    }
  ]
};

module.exports = { initialErpState };
