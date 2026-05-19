"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, AlertTriangle, X } from "lucide-react";
import clsx from "clsx";

export type ToastType = "success" | "error" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType, duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg: string, dur?: number) => addToast(msg, "success", dur),
    error: (msg: string, dur?: number) => addToast(msg, "error", dur),
    warning: (msg: string, dur?: number) => addToast(msg, "warning", dur),
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      {mounted && (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-auto max-w-xs pointer-events-none">
          <AnimatePresence mode="popLayout">
            {toasts.map((item) => (
              <ToastComponent
                key={item.id}
                item={item}
                onRemove={removeToast}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.toast;
}

function ToastComponent({
  item,
  onRemove,
}: {
  item: ToastItem;
  onRemove: (id: string) => void;
}) {
  const { id, message, type } = item;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
  };

  const borders = {
    success: "border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.07)]",
    error: "border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.07)]",
    warning: "border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.07)]",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.95, x: 20 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: 10, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={clsx(
        "pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-neutral-900/90 backdrop-blur-md border text-white/90 relative",
        borders[type],
      )}
    >
      {/* Dynamic Glowing Accent Background */}
      <div
        className={clsx(
          "absolute inset-0 opacity-5  pointer-events-none duration-300",
          {
            "bg-emerald-500": type === "success",
            "bg-rose-500": type === "error",
            "bg-amber-500": type === "warning",
          },
        )}
      />

      <div className="flex items-center justify-center pt-0.5">
        {icons[type]}
      </div>

      <div className="text-sm font-medium leading-relaxed">{message}</div>

      <button
        onClick={() => onRemove(id)}
        className="absolute top-4 right-4 text-white/30 hover:text-white/80 transition-colors p-0.5 rounded-lg hover:bg-white/5 active:scale-95 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
