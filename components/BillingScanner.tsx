"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  X,
  CameraOff,
  RefreshCw,
  Scan,
  Zap,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ScanEntry {
  id: number;
  barcode: string;
  productName: string | null;
  timestamp: number;
}

interface Props {
  onScan: (barcode: string) => { found: boolean; name: string | null };
  onClose: () => void;
  cartCount: number;
}

type ScannerStatus = "starting" | "active" | "error";

let scanIdCounter = 0;

export default function BillingScanner({ onScan, onClose, cartCount }: Props) {
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const instanceRef = useRef<any>(null);
  const startedRef = useRef(false);
  const transitioningRef = useRef(false);
  const cooldownMap = useRef<Map<string, number>>(new Map());

  const [status, setStatus] = useState<ScannerStatus>("starting");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [activeCamIndex, setActiveCamIndex] = useState(0);
  const [scanFeed, setScanFeed] = useState<ScanEntry[]>([]);
  const [flashState, setFlashState] = useState<"success" | "error" | null>(null);
  const [totalScans, setTotalScans] = useState(0);

  const COOLDOWN_MS = 3000;

  const stopScanner = async () => {
    if (instanceRef.current && startedRef.current) {
      try {
        await instanceRef.current.stop();
        startedRef.current = false;
      } catch (err) {
        console.error("Failed to stop scanner:", err);
      }
    }
  };

  const startScanner = useCallback(async (cameraId?: string) => {
    if (!instanceRef.current || transitioningRef.current) return;

    transitioningRef.current = true;
    setStatus("starting");

    try {
      await stopScanner();

      const config = cameraId
        ? { deviceId: { exact: cameraId } }
        : { facingMode: "environment" };

      await instanceRef.current.start(
        config,
        {
          fps: 30,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
          disableFlip: true,
        },
        (decodedText: string) => {
          const now = Date.now();
          const lastScan = cooldownMap.current.get(decodedText) ?? 0;
          if (now - lastScan < COOLDOWN_MS) return;
          cooldownMap.current.set(decodedText, now);

          const result = onScanRef.current(decodedText);

          setFlashState(result.found ? "success" : "error");
          setTimeout(() => setFlashState(null), 400);

          setTotalScans((p) => p + 1);
          setScanFeed((prev) => [
            {
              id: ++scanIdCounter,
              barcode: decodedText,
              productName: result.name,
              timestamp: now,
            },
            ...prev.slice(0, 4),
          ]);
        },
        () => {}
      );

      startedRef.current = true;
      setStatus("active");
    } catch (err: unknown) {
      console.error("Scanner start error:", err);
      setErrorMsg("Failed to start camera. Check permissions.");
      setStatus("error");
    } finally {
      transitioningRef.current = false;
    }
  }, []);

  useEffect(() => {
    import("html5-qrcode").then(async ({ Html5Qrcode }) => {
      const instance = new Html5Qrcode("billing-reader");
      instanceRef.current = instance;

      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices.map((d) => ({ id: d.id, label: d.label })));

          const backCamIndex = devices.findIndex(
            (d) =>
              d.label.toLowerCase().includes("back") ||
              d.label.toLowerCase().includes("rear")
          );

          const initialIndex = backCamIndex !== -1 ? backCamIndex : 0;
          setActiveCamIndex(initialIndex);
          startScanner(devices[initialIndex].id);
        } else {
          startScanner();
        }
      } catch {
        startScanner();
      }
    });

    return () => {
      if (instanceRef.current) {
        stopScanner().finally(() => {
          instanceRef.current?.clear?.();
        });
      }
    };
  }, [startScanner]);

  const switchCamera = () => {
    if (cameras.length < 2) return;
    const nextIndex = (activeCamIndex + 1) % cameras.length;
    setActiveCamIndex(nextIndex);
    startScanner(cameras[nextIndex].id);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full max-w-sm bg-gray-900 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500/20 rounded-xl flex items-center justify-center">
              <Scan size={18} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white leading-tight">
                POS Scanner
              </h3>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                Continuous mode &mdash; scan multiple items
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Scan counter badge */}
            {totalScans > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-1 rounded-lg"
              >
                <ShoppingCart size={10} />
                {cartCount}
              </motion.div>
            )}
            {cameras.length > 1 && (
              <button
                onClick={switchCamera}
                className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                aria-label="Switch camera"
              >
                <RefreshCw size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
              aria-label="Close scanner"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scanner area */}
        <div className="px-4">
          <div className="relative aspect-square w-full bg-black rounded-2xl overflow-hidden">
            {/* Flash overlay */}
            <AnimatePresence>
              {flashState && (
                <motion.div
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className={`absolute inset-0 z-40 pointer-events-none rounded-2xl ${
                    flashState === "success"
                      ? "bg-green-400/25"
                      : "bg-red-400/25"
                  }`}
                />
              )}
            </AnimatePresence>

            {status === "error" ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
                <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center">
                  <CameraOff size={28} className="text-red-400" />
                </div>
                <p className="text-sm text-red-400 font-medium">{errorMsg}</p>
                <button
                  onClick={() => startScanner()}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                {/* Loading state */}
                <AnimatePresence>
                  {status === "starting" && (
                    <motion.div
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-gray-950"
                    >
                      <div className="relative w-20 h-20">
                        <motion.div
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.2, 0, 0.2],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="absolute inset-0 rounded-full border border-indigo-500/30"
                        />
                        <motion.div
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.4, 0, 0.4],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.4,
                          }}
                          className="absolute inset-2 rounded-full border border-indigo-400/40"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-400"
                          />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Scan size={16} className="text-indigo-400/60" />
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium tracking-wide">
                        Starting camera...
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Camera feed */}
                <div
                  id="billing-reader"
                  className={`w-full h-full ${
                    status === "starting" ? "opacity-0" : "opacity-100"
                  } transition-opacity duration-500`}
                  style={{
                    transform: "rotate(0deg) scaleX(1) scaleY(1)",
                  }}
                />

                {/* Active scan overlay */}
                {status === "active" && (
                  <div className="absolute inset-0 pointer-events-none z-20">
                    {/* Vignette */}
                    <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]" />

                    {/* Finder frame */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-[60%] aspect-square">
                        {[
                          "top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-lg",
                          "top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-lg",
                          "bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-lg",
                          "bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-lg",
                        ].map((classes, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.3 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                              delay: 0.15 + i * 0.1,
                              duration: 0.4,
                              ease: "backOut",
                            }}
                            className={`absolute w-7 h-7 border-indigo-400 ${classes}`}
                          />
                        ))}

                        {/* Laser line */}
                        <motion.div
                          animate={{ y: ["0%", "900%", "0%"] }}
                          transition={{
                            duration: 2.8,
                            repeat: Infinity,
                            ease: [0.45, 0.05, 0.55, 0.95],
                          }}
                          className="absolute top-2 left-2 right-2 h-[2px]"
                        >
                          <div className="w-full h-full bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />
                          <div className="absolute -top-2 left-0 right-0 h-6 bg-gradient-to-b from-indigo-400/12 to-transparent" />
                        </motion.div>

                        <motion.div
                          animate={{ opacity: [0.3, 0.6, 0.3] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="absolute -inset-1 rounded-lg border border-indigo-400/10"
                        />
                      </div>
                    </div>

                    {/* Camera label */}
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white/60 text-[9px] font-medium px-2.5 py-1 rounded-full"
                      >
                        <Zap size={8} className="text-indigo-400" />
                        <span>
                          {cameras[activeCamIndex]?.label
                            .split("(")[0]
                            .trim() || "Camera"}
                        </span>
                      </motion.div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Scan feed — recent scans */}
        <div className="px-5 pt-3 pb-2">
          {scanFeed.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[10px] text-gray-600 font-medium uppercase tracking-wider mb-2">
                Recent scans
              </p>
              <AnimatePresence initial={false}>
                {scanFeed.slice(0, 3).map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs ${
                      entry.productName
                        ? "bg-green-500/10 text-green-300"
                        : "bg-red-500/10 text-red-300"
                    }`}
                  >
                    {entry.productName ? (
                      <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                    ) : (
                      <AlertCircle size={14} className="text-red-400 shrink-0" />
                    )}
                    <span className="truncate font-medium">
                      {entry.productName || "Not found"}
                    </span>
                    <span className="ml-auto text-[10px] opacity-50 font-mono shrink-0">
                      {entry.barcode.length > 10
                        ? `...${entry.barcode.slice(-8)}`
                        : entry.barcode}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
              <div className="w-8 h-8 bg-indigo-500/15 rounded-lg flex items-center justify-center shrink-0">
                <Zap size={14} className="text-indigo-400" />
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Align barcodes within the frame. Items are added to cart
                automatically.
              </p>
            </div>
          )}
        </div>

        {/* Done button */}
        <div className="px-5 pb-5 pt-2">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            <ShoppingCart size={16} />
            Done — {cartCount} item{cartCount !== 1 ? "s" : ""} in cart
          </button>
        </div>
      </motion.div>
    </div>
  );
}
