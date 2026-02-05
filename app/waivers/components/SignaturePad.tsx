'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Eraser, Undo2, Maximize2, Minimize2, X, Check } from 'lucide-react';

interface SignaturePadProps {
  onSignatureChange: (signatureData: string | null) => void;
  disabled?: boolean;
  label?: string;
  showFullscreenButton?: boolean;
}

export function SignaturePad({
  onSignatureChange,
  disabled = false,
  label = 'Sign Below',
  showFullscreenButton = true,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fullscreenCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenHistory, setFullscreenHistory] = useState<ImageData[]>([]);

  // Detect if device supports haptic feedback
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      const durations = { light: 10, medium: 25, heavy: 50 };
      navigator.vibrate(durations[type]);
    }
  }, []);

  // Initialize canvas
  const initCanvas = useCallback((canvas: HTMLCanvasElement | null, isFullscreenCanvas = false) => {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);

    // Set white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Set drawing style
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = isFullscreenCanvas ? 3 : 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Save initial state
    const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (isFullscreenCanvas) {
      setFullscreenHistory([initialState]);
    } else {
      setHistory([initialState]);
    }
  }, []);

  // Initialize main canvas
  useEffect(() => {
    initCanvas(canvasRef.current, false);
  }, [initCanvas]);

  // Initialize fullscreen canvas when opened
  useEffect(() => {
    if (isFullscreen) {
      // Small delay to ensure the modal is rendered
      setTimeout(() => {
        initCanvas(fullscreenCanvasRef.current, true);
      }, 50);
    }
  }, [isFullscreen, initCanvas]);

  const getCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    let clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent, isFullscreenCanvas = false) => {
    if (disabled) return;

    const canvas = isFullscreenCanvas ? fullscreenCanvasRef.current : canvasRef.current;
    if (!canvas) return;

    const coords = getCoordinates(e, canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    triggerHaptic('light');
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  }, [disabled, getCoordinates, triggerHaptic]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent, isFullscreenCanvas = false) => {
    if (!isDrawing || disabled) return;

    const canvas = isFullscreenCanvas ? fullscreenCanvasRef.current : canvasRef.current;
    if (!canvas) return;

    const coords = getCoordinates(e, canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  }, [isDrawing, disabled, getCoordinates]);

  const stopDrawing = useCallback((isFullscreenCanvas = false) => {
    if (!isDrawing) return;

    const canvas = isFullscreenCanvas ? fullscreenCanvasRef.current : canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    setIsDrawing(false);
    setHasSignature(true);

    // Save to history
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (isFullscreenCanvas) {
      setFullscreenHistory((prev) => [...prev, imageData]);
    } else {
      setHistory((prev) => [...prev, imageData]);
      // Export signature
      const dataUrl = canvas.toDataURL('image/png');
      onSignatureChange(dataUrl);
    }
  }, [isDrawing, onSignatureChange]);

  const handleClear = useCallback((isFullscreenCanvas = false) => {
    const canvas = isFullscreenCanvas ? fullscreenCanvasRef.current : canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width * dpr, rect.height * dpr);

    const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (isFullscreenCanvas) {
      setFullscreenHistory([initialState]);
    } else {
      setHasSignature(false);
      setHistory([initialState]);
      onSignatureChange(null);
    }

    triggerHaptic('medium');
  }, [onSignatureChange, triggerHaptic]);

  const handleUndo = useCallback((isFullscreenCanvas = false) => {
    const currentHistory = isFullscreenCanvas ? fullscreenHistory : history;
    if (currentHistory.length <= 1) return;

    const canvas = isFullscreenCanvas ? fullscreenCanvasRef.current : canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Remove last state
    const newHistory = currentHistory.slice(0, -1);
    if (isFullscreenCanvas) {
      setFullscreenHistory(newHistory);
    } else {
      setHistory(newHistory);
    }

    // Restore previous state
    const previousState = newHistory[newHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);

    // Check if we're back to empty state
    if (newHistory.length === 1) {
      if (!isFullscreenCanvas) {
        setHasSignature(false);
        onSignatureChange(null);
      }
    } else if (!isFullscreenCanvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSignatureChange(dataUrl);
    }

    triggerHaptic('light');
  }, [history, fullscreenHistory, onSignatureChange, triggerHaptic]);

  // Handle fullscreen confirm - transfer signature to main canvas
  const handleFullscreenConfirm = useCallback(() => {
    const fullscreenCanvas = fullscreenCanvasRef.current;
    const mainCanvas = canvasRef.current;
    if (!fullscreenCanvas || !mainCanvas) return;

    // Get the fullscreen signature as data URL
    const signatureDataUrl = fullscreenCanvas.toDataURL('image/png');

    // Draw it onto the main canvas
    const mainCtx = mainCanvas.getContext('2d');
    if (!mainCtx) return;

    const img = new Image();
    img.onload = () => {
      const rect = mainCanvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Clear and draw the signature scaled to fit
      mainCtx.fillStyle = '#ffffff';
      mainCtx.fillRect(0, 0, rect.width * dpr, rect.height * dpr);

      // Scale to fit
      const scale = Math.min(
        rect.width / fullscreenCanvas.getBoundingClientRect().width,
        rect.height / fullscreenCanvas.getBoundingClientRect().height
      );

      const scaledWidth = fullscreenCanvas.getBoundingClientRect().width * scale;
      const scaledHeight = fullscreenCanvas.getBoundingClientRect().height * scale;
      const offsetX = (rect.width - scaledWidth) / 2;
      const offsetY = (rect.height - scaledHeight) / 2;

      mainCtx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

      // Update state
      setHasSignature(true);
      const finalDataUrl = mainCanvas.toDataURL('image/png');
      onSignatureChange(finalDataUrl);
      setHistory((prev) => [...prev, mainCtx.getImageData(0, 0, mainCanvas.width, mainCanvas.height)]);
    };
    img.src = signatureDataUrl;

    triggerHaptic('heavy');
    setIsFullscreen(false);
  }, [onSignatureChange, triggerHaptic]);

  // Prevent scrolling on touch devices when drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventScroll = (e: TouchEvent) => {
      if (isDrawing) {
        e.preventDefault();
      }
    };

    canvas.addEventListener('touchmove', preventScroll, { passive: false });
    return () => {
      canvas.removeEventListener('touchmove', preventScroll);
    };
  }, [isDrawing]);

  // Prevent scrolling in fullscreen mode
  useEffect(() => {
    const canvas = fullscreenCanvasRef.current;
    if (!canvas || !isFullscreen) return;

    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener('touchmove', preventScroll, { passive: false });
    return () => {
      canvas.removeEventListener('touchmove', preventScroll);
    };
  }, [isFullscreen]);

  // Lock body scroll when fullscreen is open
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-300">
            {label}
          </label>
          <div className="flex items-center gap-2">
            {showFullscreenButton && (
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                disabled={disabled}
                className="flex items-center gap-1 px-2 py-1 text-xs text-cyan-400 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors md:hidden"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Full Screen
              </button>
            )}
            <button
              type="button"
              onClick={() => handleUndo(false)}
              disabled={disabled || history.length <= 1}
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Undo
            </button>
            <button
              type="button"
              onClick={() => handleClear(false)}
              disabled={disabled || !hasSignature}
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Eraser className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>

        <div
          className={`relative rounded-lg border-2 border-dashed ${
            disabled
              ? 'border-slate-700 bg-slate-800/50 cursor-not-allowed'
              : hasSignature
              ? 'border-cyan-500/50 bg-white'
              : 'border-slate-600 bg-white hover:border-slate-500'
          } transition-colors`}
        >
          <canvas
            ref={canvasRef}
            className={`w-full touch-none ${disabled ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
            style={{ height: '150px' }}
            onMouseDown={(e) => startDrawing(e, false)}
            onMouseMove={(e) => draw(e, false)}
            onMouseUp={() => stopDrawing(false)}
            onMouseLeave={() => stopDrawing(false)}
            onTouchStart={(e) => startDrawing(e, false)}
            onTouchMove={(e) => draw(e, false)}
            onTouchEnd={() => stopDrawing(false)}
          />
          {!hasSignature && !disabled && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-slate-400 text-sm">
                Draw your signature here
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500">
          Use your mouse or finger to sign above. Your signature will be saved as an image.
          {showFullscreenButton && <span className="md:hidden"> Tap &quot;Full Screen&quot; for easier signing on mobile.</span>}
        </p>
      </div>

      {/* Fullscreen Modal for Mobile */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800">
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
              Cancel
            </button>
            <span className="text-sm font-medium text-white">Sign with your finger</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleUndo(true)}
                disabled={fullscreenHistory.length <= 1}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
              >
                <Undo2 className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => handleClear(true)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <Eraser className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Canvas - takes up remaining space */}
          <div className="flex-1 relative bg-white">
            <canvas
              ref={fullscreenCanvasRef}
              className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
              onMouseDown={(e) => startDrawing(e, true)}
              onMouseMove={(e) => draw(e, true)}
              onMouseUp={() => stopDrawing(true)}
              onMouseLeave={() => stopDrawing(true)}
              onTouchStart={(e) => startDrawing(e, true)}
              onTouchMove={(e) => draw(e, true)}
              onTouchEnd={() => stopDrawing(true)}
            />
            {fullscreenHistory.length <= 1 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-slate-400">
                  <p className="text-lg">Sign here with your finger</p>
                  <p className="text-sm mt-1">Use the entire screen</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-700 bg-slate-800">
            <button
              type="button"
              onClick={handleFullscreenConfirm}
              disabled={fullscreenHistory.length <= 1}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium transition-colors"
            >
              <Check className="h-5 w-5" />
              Confirm Signature
            </button>
          </div>
        </div>
      )}
    </>
  );
}
