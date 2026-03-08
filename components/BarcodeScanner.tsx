"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, CameraOff, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

type ScannerStatus = "starting" | "active" | "error";

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const instanceRef = useRef<any>(null);
  const startedRef = useRef(false);
  const scannedRef = useRef(false);
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

      const config = cameraId ? { deviceId: { exact: cameraId } } : { facingMode: "environment" };

      await instanceRef.current.start(
        config,
        {
          fps: 30,
          qrbox: { width: 320, height: 320 },
          aspectRatio: 1.0,
          disableFlip: true,
        },
        async (decodedText: string) => {
          if (scannedRef.current || transitioningRef.current) return;
          scannedRef.current = true;
          transitioningRef.current = true;
          
          try {
            await stopScanner();
            onScanRef.current(decodedText);
          } finally {
            transitioningRef.current = false;
          }
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
    let instance: any = null;

    import("html5-qrcode").then(async ({ Html5Qrcode }) => {
      // Use a unique ID for the scanner instance in the modal
      instance = new Html5Qrcode("modal-reader");
      instanceRef.current = instance;

      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices.map(d => ({ id: d.id, label: d.label })));
          
          const backCamIndex = devices.findIndex(d => 
            d.label.toLowerCase().includes("back") || 
            d.label.toLowerCase().includes("rear")
          );
          
          const initialIndex = backCamIndex !== -1 ? backCamIndex : 0;
          setActiveCamIndex(initialIndex);
          startScanner(devices[initialIndex].id);
        } else {
          startScanner();
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Background blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-950/60 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-black text-gray-900 leading-tight">Fast Scanner</h3>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mt-0.5">Inventory Hub</p>
          </div>
          <div className="flex items-center gap-3">
            {cameras.length > 1 && (
              <button 
                onClick={switchCamera}
                className="p-2 hover:bg-gray-100 rounded-xl border border-gray-100 text-gray-500 transition-all"
              >
                <RefreshCw size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl border border-gray-100 text-gray-500 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scanner Area */}
        <div className="p-6">
          <div className="relative aspect-square w-full bg-gray-900 rounded-[2rem] overflow-hidden shadow-inner">
            {status === "error" ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
                <CameraOff size={48} className="text-red-400 opacity-50" />
                <p className="text-sm font-bold text-red-500 uppercase tracking-tighter">{errorMsg}</p>
                <button 
                  onClick={() => startScanner()}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Retry Camera
                </button>
              </div>
            ) : (
              <>
                {status === "starting" && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-gray-950">
                    <div className="h-12 w-12 animate-spin rounded-full border-[4px] border-white/10 border-t-indigo-500"></div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Engaging Lens...</p>
                  </div>
                )}
                
                <div 
                  id="modal-reader" 
                  className="w-full h-full"
                  style={{ transform: "rotate(0deg) scaleX(1) scaleY(1)" }}
                />

                {/* Overlays */}
                {status === "active" && (
                  <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" />
                    
                    {/* Finder Box */}
                    <div className="relative w-72 h-72 border-2 border-white/20 bg-transparent overflow-hidden rounded-3xl">
                      {/* Corners */}
                      <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-green-500 rounded-tl-2xl shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
                      <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-green-500 rounded-tr-2xl shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
                      <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-green-500 rounded-bl-2xl shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
                      <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-green-500 rounded-br-2xl shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
                      
                      {/* Laser */}
                      <motion.div 
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 w-full h-[3px] bg-red-600 shadow-[0_0_20px_red] z-30"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="mt-8 space-y-4">
             <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center gap-4">
               <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-200">
                  <RefreshCw size={20} className="animate-spin-slow" />
               </div>
               <p className="text-xs font-semibold text-indigo-900 leading-relaxed">
                 Align the barcode within the green target frame for instant product fetching.
               </p>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
