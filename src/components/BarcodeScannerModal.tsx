import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  X,
  Camera,
  RotateCcw,
  Sparkles,
  Barcode as BarcodeIcon,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  VideoOff,
  SwitchCamera,
  Play,
  Square,
  Zap,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { PRESET_BARCODE_CATALOG } from '../data/initialData';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeDetected: (barcode: string) => void;
  mode: 'pos' | 'inventory';
  title?: string;
  subtitle?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onBarcodeDetected,
  mode,
  title,
  subtitle,
}) => {
  const [manualBarcode, setManualBarcode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [continuousScan, setContinuousScan] = useState(mode === 'pos');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'interactive-barcode-reader';
  const isOperatingRef = useRef(false);
  const activeScanningRef = useRef(false);
  const manualInputRef = useRef<HTMLInputElement>(null);

  const handleBarcodeFound = useCallback(
    (scannedCode: string) => {
      const cleanCode = scannedCode.trim();
      if (!cleanCode) return;

      sound.playScanSuccess();
      setLastScannedCode(cleanCode);
      onBarcodeDetected(cleanCode);

      if (!continuousScan) {
        setTimeout(() => {
          onClose();
        }, 350);
      }
    },
    [continuousScan, onBarcodeDetected, onClose]
  );

  // Force stop any underlying video tracks to release camera hardware instantly
  const releaseMediaTracks = useCallback(() => {
    try {
      const container = document.getElementById(scannerContainerId);
      if (container) {
        const videos = container.querySelectorAll('video');
        videos.forEach((video) => {
          const stream = (video as HTMLVideoElement).srcObject as MediaStream;
          if (stream && stream.getTracks) {
            stream.getTracks().forEach((track) => {
              track.stop();
            });
          }
        });
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const stopCamera = useCallback(async () => {
    if (isOperatingRef.current) return;
    isOperatingRef.current = true;

    try {
      if (html5QrCodeRef.current && (activeScanningRef.current || html5QrCodeRef.current.isScanning)) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }
    } catch (err) {
      console.warn('Stop scanner note:', err);
    } finally {
      releaseMediaTracks();
      activeScanningRef.current = false;
      setCameraActive(false);
      setIsStartingCamera(false);
      isOperatingRef.current = false;
    }
  }, [releaseMediaTracks]);

  const startCamera = useCallback(
    async (targetFacing: 'environment' | 'user' = facingMode) => {
      if (isOperatingRef.current) return;
      isOperatingRef.current = true;
      setIsStartingCamera(true);
      setCameraError(null);

      // Clean up previous camera session thoroughly first
      try {
        if (html5QrCodeRef.current && (activeScanningRef.current || html5QrCodeRef.current.isScanning)) {
          try {
            await html5QrCodeRef.current.stop();
            html5QrCodeRef.current.clear();
          } catch (stopErr) {
            // ignore
          }
        }
        releaseMediaTracks();
        activeScanningRef.current = false;
      } catch {
        // ignore
      }

      // Check if container DOM exists
      const containerElem = document.getElementById(scannerContainerId);
      if (!containerElem) {
        isOperatingRef.current = false;
        setIsStartingCamera(false);
        return;
      }

      try {
        // Create new instance with hardware BarcodeDetector acceleration
        if (!html5QrCodeRef.current) {
          html5QrCodeRef.current = new Html5Qrcode(scannerContainerId, {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.QR_CODE,
            ],
            verbose: false,
            experimentalFeatures: {
              // Uses native browser BarcodeDetector API for 0ms lag when available
              useBarCodeDetectorIfSupported: true,
            },
          });
        }

        // Optimized scan parameters for smooth, lag-free performance:
        // 1. fps: 7 -> reduced from 20 to prevent CPU heating and UI stutter
        // 2. qrbox: 250x150 -> only decode central region for 4x speedup
        // 3. 720p resolution limit -> prevents 4K lag on modern phones
        const scanConfig = {
          fps: 7,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.333,
          videoConstraints: {
            facingMode: targetFacing,
            width: { ideal: 1280, max: 1280 },
            height: { ideal: 720, max: 720 },
          },
        };

        const onScanSuccess = (decodedText: string) => {
          handleBarcodeFound(decodedText);
        };
        const onScanFailure = () => {
          // silent pass
        };

        let started = false;

        // Attempt 1: Target facing mode (environment for rear camera, user for webcam)
        try {
          await html5QrCodeRef.current.start(
            { facingMode: targetFacing },
            scanConfig,
            onScanSuccess,
            onScanFailure
          );
          started = true;
          setFacingMode(targetFacing);
        } catch (firstErr) {
          console.warn(`Camera start failed with facingMode ${targetFacing}, trying opposite...`, firstErr);
        }

        // Attempt 2: If environment failed (e.g. laptop webcam), try opposite facingMode
        if (!started) {
          const alternateFacing = targetFacing === 'environment' ? 'user' : 'environment';
          try {
            await html5QrCodeRef.current.start(
              { facingMode: alternateFacing },
              {
                ...scanConfig,
                videoConstraints: {
                  facingMode: alternateFacing,
                  width: { ideal: 1280, max: 1280 },
                  height: { ideal: 720, max: 720 },
                },
              },
              onScanSuccess,
              onScanFailure
            );
            started = true;
            setFacingMode(alternateFacing);
          } catch (altErr) {
            console.warn('Alternate camera start failed, trying device list...', altErr);
          }
        }

        // Attempt 3: Query camera devices and take first available
        if (!started) {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            await html5QrCodeRef.current.start(
              devices[0].id,
              scanConfig,
              onScanSuccess,
              onScanFailure
            );
            started = true;
          }
        }

        if (started) {
          activeScanningRef.current = true;
          setCameraActive(true);
          setCameraError(null);
        } else {
          throw new Error('Tidak dapat menghubungkan video stream.');
        }
      } catch (err: any) {
        console.warn('Camera error handled:', err?.message || err);
        setCameraActive(false);
        activeScanningRef.current = false;
        setCameraError(
          'Kamera tidak dapat diakses atau izin belum diberikan. Gunakan input manual atau tombol simulasi di bawah.'
        );
        // Focus manual input automatically so user can scan or type immediately
        setTimeout(() => {
          manualInputRef.current?.focus();
        }, 200);
      } finally {
        isOperatingRef.current = false;
        setIsStartingCamera(false);
      }
    },
    [facingMode, handleBarcodeFound, releaseMediaTracks]
  );

  // Toggle camera switch (Front / Back)
  const handleToggleCameraFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    stopCamera().then(() => {
      startCamera(nextFacing);
    });
  };

  // When modal is opened/closed
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isOpen) {
      setLastScannedCode(null);
      setManualBarcode('');
      // Delay camera start slightly to allow the modal animation and DOM to settle cleanly
      timer = setTimeout(() => {
        startCamera('environment');
      }, 300);
    } else {
      stopCamera();
    }

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      handleBarcodeFound(manualBarcode.trim());
      setManualBarcode('');
    }
  };

  const handlePresetSelect = (barcode: string) => {
    handleBarcodeFound(barcode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between bg-teal-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-800 rounded-xl">
              <BarcodeIcon className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {title || (mode === 'pos' ? 'Scan Barcode Kasir POS' : 'Scan Barcode Sembako')}
              </h2>
              <p className="text-xs text-teal-200">
                {subtitle ||
                  (mode === 'pos'
                    ? 'Arahkan barcode ke garis pemindai untuk masuk keranjang'
                    : 'Pindai barcode untuk input cepat atau restock barang')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-teal-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          {/* Camera Viewfinder Box */}
          <div className="relative bg-black rounded-xl overflow-hidden min-h-[220px] max-h-[260px] flex items-center justify-center border-2 border-teal-500/30">
            {/* The native html5-qrcode container */}
            <div id={scannerContainerId} className="w-full h-full"></div>

            {/* Target Laser Overlay (Lightweight, hardware-accelerated) */}
            {cameraActive && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-[82%] max-w-[260px] h-[140px] border-2 border-emerald-400 rounded-lg relative flex items-center justify-center shadow-[0_0_12px_rgba(52,211,153,0.4)]">
                  {/* Corner accents */}
                  <span className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl-xs"></span>
                  <span className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr-xs"></span>
                  <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl-xs"></span>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br-xs"></span>

                  {/* Red laser guideline */}
                  <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_8px_#ef4444] animate-pulse"></div>

                  <span className="absolute bottom-2 text-[10px] font-semibold text-emerald-300 bg-black/70 px-2 py-0.5 rounded-full">
                    Arahkan Barcode ke Kotak Hijau
                  </span>
                </div>
              </div>
            )}

            {/* If Camera Not Active or Loading */}
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gray-950 text-white z-10">
                {isStartingCamera ? (
                  <div className="flex flex-col items-center gap-2">
                    <RotateCcw className="w-8 h-8 text-teal-400 animate-spin" />
                    <p className="text-xs font-semibold text-gray-200">Menghubungkan ke kamera...</p>
                    <p className="text-[11px] text-gray-400">Mengoptimalkan kecepatan pemindaian</p>
                  </div>
                ) : cameraError ? (
                  <div className="flex flex-col items-center max-w-sm">
                    <VideoOff className="w-8 h-8 text-rose-400 mb-1.5" />
                    <p className="text-xs font-bold text-rose-300">Kamera Tidak Tersedia</p>
                    <p className="text-[11px] text-gray-300 mt-1 leading-snug">{cameraError}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => startCamera('environment')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Coba Lagi
                      </button>
                      <button
                        type="button"
                        onClick={() => manualInputRef.current?.focus()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Input Manual Saja
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Camera className="w-8 h-8 text-gray-400 mb-1.5" />
                    <p className="text-xs font-semibold text-gray-200">Kamera Dinonaktifkan</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Klik tombol di bawah untuk mengaktifkan pemindaian barcode
                    </p>
                    <button
                      type="button"
                      onClick={() => startCamera('environment')}
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Nyalakan Kamera
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Camera Controls Toolbar */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2">
              {cameraActive ? (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Matikan Kamera</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isStartingCamera}
                  onClick={() => startCamera()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Nyalakan Kamera</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleToggleCameraFacing}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                title="Ganti kamera belakang/depan"
              >
                <SwitchCamera className="w-3.5 h-3.5 text-teal-700" />
                <span>{facingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'}</span>
              </button>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-gray-700">
              <input
                type="checkbox"
                checked={continuousScan}
                onChange={(e) => setContinuousScan(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded-sm border-gray-300 focus:ring-teal-500"
              />
              <span className="font-semibold text-xs">Scan Beruntun (POS Cepat)</span>
            </label>
          </div>

          {/* Last Scanned Code Feedback */}
          {lastScannedCode && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl p-3 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="text-[11px] font-semibold text-emerald-700">Berhasil Dipindai:</div>
                  <div className="font-mono text-sm font-black tracking-wider text-emerald-900">
                    {lastScannedCode}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold bg-emerald-200 text-emerald-900 px-2.5 py-1 rounded-full">
                Tercatat ✓
              </span>
            </div>
          )}

          {/* Manual Input or Barcode Scanner Gun Field */}
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-700">
                Input Kode Barcode Manual / Barcode Scanner Gun:
              </label>
              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                Support Scanner Laser USB/Bluetooth
              </span>
            </div>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <BarcodeIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={manualInputRef}
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Ketik angka barcode atau tembak barcode gun..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <button
                type="submit"
                disabled={!manualBarcode.trim()}
                className="px-4 py-2 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Scan
              </button>
            </form>
          </div>

          {/* Quick 1-Click Simulation Sembako Buttons */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Simulasi Cepat (Klik Barcode Sembako Instan):</span>
            </div>
            <p className="text-[11px] text-gray-500 mb-2.5">
              Klik nama barang untuk langsung mensimulasikan hasil scan barcode secara akurat:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_BARCODE_CATALOG.slice(0, 6).map((preset) => (
                <button
                  key={preset.barcode}
                  type="button"
                  onClick={() => handlePresetSelect(preset.barcode!)}
                  className="text-left p-2 rounded-lg border border-gray-200 bg-white hover:border-teal-500 hover:bg-teal-50/70 transition-all text-xs group cursor-pointer shadow-2xs"
                >
                  <div className="font-bold text-gray-800 truncate group-hover:text-teal-700">
                    {preset.name}
                  </div>
                  <div className="font-mono text-[10px] text-gray-500 truncate">
                    {preset.barcode}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Optimal pada kamera HP & scanner laser barcode kasir.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
