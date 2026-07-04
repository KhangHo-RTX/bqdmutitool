import { motion, AnimatePresence } from "framer-motion";
import { Home, Rocket, Activity, User, X, Zap, type LucideIcon } from "lucide-react";
import type { Page } from "../App";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const navItems: { id: Page; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Trang chủ", icon: Home },
  { id: "launch", label: "Khởi chạy", icon: Rocket },
  { id: "status", label: "Status", icon: Activity },
  { id: "account", label: "Tài khoản", icon: User },
];

export default function Sidebar({ currentPage, onNavigate, isOpen, onClose, isMobile }: SidebarProps) {
  const sidebarContent = (
    <div
      className="glass-strong flex flex-col h-full"
      style={{
        width: 240,
        minHeight: "100%",
        padding: "24px 12px",
        background: "rgba(10,10,16,0.85)",
        backdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 0,
      }}
    >
      <div className="flex items-center gap-2 px-3 mb-8">
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg,#7c3aed,#3b82f6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 12px rgba(124,58,237,0.5)",
          }}
        >
          <Zap size={16} color="white" />
        </div>
        <span
          style={{
            fontWeight: 700,
            fontSize: 16,
            background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          BQD MUI
        </span>
        {isMobile && (
          <button
            onClick={onClose}
            className="btn-glass ml-auto"
            style={{ padding: "4px", borderRadius: 8, display: "flex" }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const active = currentPage === item.id;
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              onClick={() => { onNavigate(item.id); if (isMobile) onClose(); }}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
                textAlign: "left",
                width: "100%",
                ...(active
                  ? {
                      background: "linear-gradient(135deg,rgba(124,58,237,0.25),rgba(59,130,246,0.15))",
                      borderColor: "rgba(124,58,237,0.4)",
                      boxShadow: "0 0 16px rgba(124,58,237,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
                    }
                  : {
                      background: "transparent",
                    }),
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  ...(active
                    ? {
                        background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }
                    : { color: "rgba(255,255,255,0.45)" }),
                }}
              >
                <Icon size={18} />
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  ...(active
                    ? {
                        background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }
                    : { color: "rgba(255,255,255,0.5)" }),
                }}
              >
                {item.label}
              </span>
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  style={{
                    marginLeft: "auto",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
                    boxShadow: "0 0 6px rgba(167,139,250,0.8)",
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div
          className="glass-sm"
          style={{ padding: "10px 12px" }}
        >
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>Version</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>BQD MUI v2.0</div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(4px)",
                zIndex: 40,
              }}
            />
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                height: "100vh",
                zIndex: 50,
              }}
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 30, width: 240 }}>
      {sidebarContent}
    </div>
  );
}
