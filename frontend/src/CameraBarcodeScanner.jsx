import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X, RefreshCw, CheckCircle2, AlertCircle, Volume2, VolumeX, Sparkles } from "lucide-react";

export default function CameraBarcodeScanner({ isOpen, onClose, onScanSuccess }) {
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [lastScanned, setLastScanned] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const scannerRef = useRef(null);
  const readerElementId = "flowops-html5-camera-reader";

  // Synthesize a pleasant high-tech scan confirmation chime with Web Audio API
  const playScanBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.12); // A6
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.13);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    // Enumerate available video inputs
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera if found, otherwise first camera
          const backCam = devices.find((d) =>
            d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear") || d.label.toLowerCase().includes("environment")
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setErrorMsg("No camera devices detected. You can test with a sample barcode or connect a webcam.");
        }
      })
      .catch((err) => {
        setErrorMsg("Camera access permission denied or unavailable. " + (err.message || err));
      });

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && selectedCameraId) {
      startScanner(selectedCameraId);
    }
  }, [isOpen, selectedCameraId]);

  const startScanner = async (cameraId) => {
    try {
      setErrorMsg(null);
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      const html5QrCode = new Html5Qrcode(readerElementId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const edgeSize = Math.floor(minEdge * 0.75);
          return {
            width: Math.max(200, edgeSize),
            height: Math.max(160, Math.floor(edgeSize * 0.7))
          };
        },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        cameraId,
        config,
        (decodedText, decodedResult) => {
          handleDetectedCode(decodedText);
        },
        () => {
          // Frame-by-frame non-detection (quietly ignore)
        }
      );
      setIsScanning(true);
    } catch (err) {
      setIsScanning(false);
      setErrorMsg("Failed to initialize video stream: " + (err.message || err));
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        // Ignore stop error
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleDetectedCode = (codeText) => {
    playScanBeep();
    setLastScanned(codeText);

    // Call parent handler
    if (onScanSuccess) {
      onScanSuccess(codeText);
    }
  };

  const simulateQuickBarcode = (sampleCode) => {
    handleDetectedCode(sampleCode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Live Pallet Barcode & QR Scanner
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  html5-qrcode
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Point your webcam or phone camera at any physical barcode or shipping label
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute scan chime" : "Enable scan chime"}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-cyan-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
            </button>
            <button
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* SCANNER VIEWPORT */}
        <div className="relative bg-black flex flex-col items-center justify-center min-h-[300px] overflow-hidden">
          {/* HTML5 QRCODE RENDER TARGET */}
          <div id={readerElementId} className="w-full h-full max-h-[360px]" />

          {/* LASER SCAN OVERLAY ANIMATION */}
          {isScanning && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-[72%] h-[60%] border-2 border-dashed border-cyan-400/60 rounded-2xl relative overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.25)]">
                {/* Laser beam */}
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] animate-[scan_2s_ease-in-out_infinite]" />
                <div className="absolute top-2 left-2 text-[10px] font-mono text-cyan-400 font-bold bg-slate-950/80 px-2 py-0.5 rounded">
                  ALIGN BARCODE
                </div>
              </div>
            </div>
          )}

          {/* ERROR OR CAMERA ACCESS PROMPT */}
          {errorMsg && (
            <div className="absolute inset-0 bg-slate-950/90 p-5 flex flex-col items-center justify-center text-center gap-3">
              <AlertCircle className="h-10 w-10 text-amber-400" />
              <div>
                <p className="text-xs font-bold text-amber-200">Camera Notice</p>
                <p className="text-[11px] text-slate-400 max-w-xs mt-1">{errorMsg}</p>
              </div>
              <p className="text-[11px] text-cyan-400">
                You can still test 1-click simulated physical barcodes below:
              </p>
            </div>
          )}
        </div>

        {/* CONTROLS & CAMERA SELECTOR */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          {cameras.length > 1 && (
            <div className="flex items-center justify-between text-xs gap-2">
              <span className="text-slate-400 text-[11px] font-semibold shrink-0">Select Camera:</span>
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Camera ${c.id.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* LAST SCANNED RESULT PREVIEW */}
          {lastScanned ? (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <div className="text-[10px] uppercase font-bold text-emerald-300">Scanned Successfully</div>
                  <div className="text-xs font-mono text-white truncate">{lastScanned}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  stopScanner();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs shrink-0 hover:bg-emerald-400 transition"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              Scanning active: Detects Code 128, EAN, UPC, QR codes, and DataMatrix.
            </div>
          )}

          {/* QUICK SIMULATION CHIPS FOR TESTING WITHOUT PHYSICAL PRINTED BARCODES */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Quick Test Codes (No physical barcode handy):
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  simulateQuickBarcode(
                    "BARCODE_SCAN: Pallet #PL-904 | SKU-4090 Industrial Servo Motor | Qty: 20 units | Bin Zone A-12"
                  )
                }
                className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 hover:border-cyan-500 transition"
              >
                SKU-4090 Pallet Barcode
              </button>
              <button
                onClick={() =>
                  simulateQuickBarcode(
                    "BARCODE_SCAN: Box #BX-112 | SKU-1044 Siemens PLC Module | Qty: 15 units | Bin Zone C-02"
                  )
                }
                className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 hover:border-emerald-500 transition"
              >
                SKU-1044 QR Label
              </button>
              <button
                onClick={() =>
                  simulateQuickBarcode(
                    "BARCODE_SCAN: Drum #DR-88 | SKU-8821 Bosch Li-Ion Battery Pack | Qty: 30 units | Bin Bay 4"
                  )
                }
                className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-300 hover:border-amber-500 transition"
              >
                SKU-8821 Battery Crate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

