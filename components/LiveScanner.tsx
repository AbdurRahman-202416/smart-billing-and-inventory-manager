"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Scan, CameraOff, RefreshCw } from "lucide-react";
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

      // Use specific ID or preferred facing mode
      const config = cameraId ? { deviceId: { exact: cameraId } } : { facingMode: "environment" };

      await instanceRef.current.start(
        config,
        {
          fps: 30,
          qrbox: { width: 400, height: 400 }, // Bigger frame!
          aspectRatio: 1.0,
          disableFlip: true, // Fix movement inversion logic
        },
        (decodedText: string) => onScanRef.current(decodedText),
        () => {} // ignore misses
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
    let instance: any = null;

    import("html5-qrcode").then(async ({ Html5Qrcode }) => {
      instance = new Html5Qrcode("live-reader");
      instanceRef.current = instance;

      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices.map(d => ({ id: d.id, label: d.label })));
          
          // Try to find a back camera by default for better angle
          const backCamIndex = devices.findIndex(d => 
            d.label.toLowerCase().includes("back") || 
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("environment")
          );
          
          const initialIndex = backCamIndex !== -1 ? backCamIndex : 0;
          setActiveCamIndex(initialIndex);
          startScanner(devices[initialIndex].id);
        } else {
          startScanner(); // Fallback to facingMode
        }
      } catch (err) {
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

  const badge = {
    starting: "bg-gray-100 text-gray-500",
    active: "bg-green-100 text-green-700",
    error: "bg-red-100 text-red-500",
  }[status];

  const badgeLabel = {
    starting: "Starting…",
    active: "● Active",
    error: "Error",
  }[status];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <Scan size={18} className="text-indigo-500" />
        <h2 className="font-bold text-gray-700 text-sm">POS Scanner</h2>
        
        <div className="ml-auto flex items-center gap-2">
          {cameras.length > 1 && (
            <button 
              onClick={switchCamera}
              className="p-1.5 hover:bg-white rounded-lg border border-gray-200 text-gray-500 transition-all active:rotate-180 duration-500"
              title="Switch Camera View"
            >
              <RefreshCw size={14} />
            </button>
          )}
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${badge}`}>
            {badgeLabel}
          </span>
        </div>
      </div>

      {/* Body */}
      {status === "error" ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-2">
            <CameraOff size={24} className="text-red-400" />
          </div>
          <p className="text-xs font-bold text-red-500 uppercase tracking-widest">{errorMsg}</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-[11px] text-gray-400 hover:text-indigo-600 underline font-medium"
          >
            Allow Permissions & Reload
          </button>
        </div>
      ) : (
        <div className="relative p-3 bg-white">
          {status === "starting" && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/90 backdrop-blur-md rounded-2xl py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-100 border-t-indigo-600"></div>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tighter">Adjusting Optics...</p>
            </div>
          )}
          <div className="relative">
            <div
              id="live-reader"
              className={`w-full aspect-square rounded-2xl overflow-hidden bg-gray-50 ${
                status === "starting" ? "opacity-0" : "opacity-100"
              } transition-opacity duration-300`}
              style={{ transform: "rotate(0deg) scaleX(1) scaleY(1)" }}
            />
            
            {/* ── Scanning Overlay ────────────────────────────────────────── */}
            {status === "active" && (
              <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center p-8">
                {/* Darken peripheral area */}
                <div className="absolute inset-0 bg-black/20" />
                
                {/* Finder Box */}
                <div className="relative w-full aspect-square max-w-[400px] border-2 border-dashed border-white/30 bg-transparent overflow-hidden">
                  {/* Corners */}
                  <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-green-500 rounded-tl-xl shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
                  <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-green-500 rounded-tr-xl shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
                  <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-green-500 rounded-bl-xl shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-green-500 rounded-br-xl shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
                  
                  {/* ── Framer Motion Laser Line (100% Guaranteed to animate) ── */}
                  <motion.div 
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 w-full h-[3px] bg-red-600 shadow-[0_0_20px_rgba(239,68,68,1)] z-30"
                  />
                </div>

                {/* Status Indicator (Bottom) */}
                {cameras[activeCamIndex] && (
                  <div className="absolute bottom-6 bg-black/50 backdrop-blur-md text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest opacity-70">
                    {cameras[activeCamIndex].label.split('(')[0].trim() || 'Default Lens'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
