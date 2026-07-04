import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X } from "lucide-react";

interface ToastItem {
  id: string;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,
        right: 20,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              background: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: 10,
              backdropFilter: "blur(16px)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              minWidth: 180,
              maxWidth: 280,
            }}
          >
            <CheckCircle size={16} color="#34d399" />
            <span style={{ fontSize: 13, color: "#a7f3d0", flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => onRemove(toast.id)}
              style={{ background: "none", border: "none", color: "rgba(167,243,208,0.6)", cursor: "pointer", padding: 0, display: "flex" }}
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

let _addToast: ((msg: string) => void) | null = null;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    _addToast = addToast;
  }, [addToast]);

  return { toasts, addToast, removeToast };
}

export function showToast(message: string) {
  _addToast?.(message);
}
