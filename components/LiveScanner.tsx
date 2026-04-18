"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Scan, CameraOff, RefreshCw, Zap, Focus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onScan: (barcode: string) => void;
}

type ScannerStatus = "starting" | "active" | "error";

export default function LiveScanner({ onScan }: Props) {
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const instanceRef = useRef<any>(null);
  const startedRef = useRef(false);
  const transitioningRef = useRef(false);

  const [status, setStatus] = useState<ScannerStatus>("starting");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [activeCamIndex, setActiveCamIndex] = useState(0);
  const [scanPulse, setScanPulse] = useState(false);

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

      const config = cameraId ? { deviceId: { exact: cameraId } } : { facingMode: "environment" };

      await instanceRef.current.start(
        config,
        {
          fps: 30,
          qrbox: { width: 400, height: 400 },
          aspectRatio: 1.0,
          disableFlip: true,
        },
        (decodedText: string) => {
          // Flash the scan pulse animation
          setScanPulse(true);
          setTimeout(() => setScanPulse(false), 600);
          onScanRef.current(decodedText);
        },
        () => {}
      );

      startedRef.current = true;
      setStatus("active");
    } catch (err: unknown) {
      console.error("Scanner start error:", err);
      setErrorMsg("Camera access failed. Is it in use by another app?");
      setStatus("error");
    } finally {
      transitioningRef.current = false;
    }
  }, []);

  useEffect(() => {
    import("html5-qrcode").then(async ({ Html5Qrcode }) => {
      const instance = new Html5Qrcode("live-reader");
      instanceRef.current = instance;

      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices.map((d) => ({ id: d.id, label: d.label })));

          const backCamIndex = devices.findIndex(
            (d) =>
              d.label.toLowerCase().includes("back") ||
              d.label.toLowerCase().includes("rear") ||
              d.label.toLowerCase().includes("environment")
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
    <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-7 h-7 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <Scan size={14} className="text-indigo-400" />
          </div>
          <span className="text-sm font-medium text-gray-200">Scanner</span>
        </div>

        <div className="flex items-center gap-2">
          {cameras.length > 1 && (
            <button
              onClick={switchCamera}
              className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
              aria-label="Switch camera"
            >
              <RefreshCw size={14} />
            </button>
          )}

          {/* Status dot */}
          <div className="flex items-center gap-1.5">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                status === "active"
                  ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]"
                  : status === "error"
                  ? "bg-red-400"
                  : "bg-yellow-400 animate-pulse"
              }`}
            />
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
              {status === "active" ? "Live" : status === "error" ? "Error" : "Init"}
            </span>
          </div>
        </div>
      </div>

      {/* Scanner body */}
      {status === "error" ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
          <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center">
            <CameraOff size={24} className="text-red-400" />
          </div>
          <p className="text-xs text-red-400 font-medium">{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-gray-500 hover:text-indigo-400 underline underline-offset-2 transition-colors"
          >
            Allow permissions & reload
          </button>
        </div>
      ) : (
        <div className="relative">
          {/* Loading overlay */}
          <AnimatePresence>
            {status === "starting" && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-gray-900"
              >
                {/* Animated rings */}
                <div className="relative w-16 h-16">
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full border-2 border-indigo-500/30"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                    className="absolute inset-0 rounded-full border-2 border-indigo-400/40"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 font-medium tracking-wide">Initializing camera...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Camera feed */}
          <div
            id="live-reader"
            className={`w-full aspect-square bg-gray-950 ${
              status === "starting" ? "opacity-0" : "opacity-100"
            } transition-opacity duration-500`}
            style={{ transform: "rotate(0deg) scaleX(1) scaleY(1)" }}
          />

          {/* Scan overlay */}
          {status === "active" && (
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* Vignette edges */}
              <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.6)]" />

              {/* Center finder frame */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-[65%] aspect-square">
                  {/* Corner brackets — animated entrance */}
                  {[
                    "top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-xl",
                    "top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-xl",
                    "bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-xl",
                    "bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-xl",
                  ].map((classes, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + i * 0.08, duration: 0.3, ease: "backOut" }}
                      className={`absolute w-8 h-8 border-indigo-400 ${classes}`}
                    />
                  ))}

                  {/* Scanning laser beam */}
                  <motion.div
                    animate={{ y: ["0%", "900%", "0%"] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: [0.45, 0.05, 0.55, 0.95],
                    }}
                    className="absolute top-2 left-2 right-2 h-[2px]"
                  >
                    {/* Beam glow */}
                    <div className="w-full h-full bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />
                    {/* Beam shine spread */}
                    <div className="absolute -top-3 left-0 right-0 h-8 bg-gradient-to-b from-indigo-400/15 to-transparent" />
                  </motion.div>

                  {/* Scan success pulse */}
                  <AnimatePresence>
                    {scanPulse && (
                      <motion.div
                        initial={{ opacity: 0.8, scale: 0.95 }}
                        animate={{ opacity: 0, scale: 1.15 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 rounded-xl border-2 border-green-400 bg-green-400/10"
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Bottom info chip */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white/70 text-[9px] font-medium px-3 py-1.5 rounded-full"
                >
                  <Zap size={9} className="text-indigo-400" />
                  {cameras[activeCamIndex]
                    ? cameras[activeCamIndex].label.split("(")[0].trim() || "Camera"
                    : "Default camera"}
                </motion.div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
