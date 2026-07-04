import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import AuthCard from "../components/AuthCard";

interface AuthPageProps {
  onSuccess: () => void;
  onBack: () => void;
  initialMode?: "login" | "register";
}

export default function AuthPage({ onSuccess, onBack, initialMode = "login" }: AuthPageProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        position: "relative",
      }}
    >
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        onClick={onBack}
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          display: "flex",
          alignItems: "center",
          gap: 7,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.10)",
          color: "rgba(255,255,255,0.6)",
          fontSize: 13,
          fontWeight: 500,
          padding: "8px 14px",
          borderRadius: 10,
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.background = "rgba(255,255,255,0.10)";
          el.style.color = "rgba(255,255,255,0.9)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.background = "rgba(255,255,255,0.05)";
          el.style.color = "rgba(255,255,255,0.6)";
        }}
      >
        <ArrowLeft size={15} />
        Trang chủ
      </motion.button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ width: "100%", maxWidth: 420 }}
      >
        <AuthCard onSuccess={onSuccess} initialMode={initialMode} />
      </motion.div>
    </div>
  );
}
