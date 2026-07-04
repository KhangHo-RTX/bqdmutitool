import { motion } from "framer-motion";
import FAQ from "../components/FAQ";
import type { Page } from "../App";

interface HomeProps {
  isLoggedIn: boolean;
  onOpenLogin: () => void;
  onNavigate: (page: Page) => void;
}

export default function Home({ isLoggedIn, onOpenLogin, onNavigate }: HomeProps) {
  const handleStart = () => {
    if (isLoggedIn) {
      onNavigate("launch");
    } else {
      onOpenLogin();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 56,
        padding: "40px 0 48px",
      }}
    >
      {/* ── HERO ─────────────────────────────────────── */}
      <div style={{ width: "100%", maxWidth: 680, textAlign: "center" }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.45 }}
            style={{
              display: "inline-block",
              padding: "4px 14px",
              borderRadius: 99,
              background: "rgba(124,58,237,0.15)",
              border: "1px solid rgba(124,58,237,0.3)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: "#a78bfa",
              marginBottom: 24,
              textTransform: "uppercase",
            }}
          >
            Premium Dashboard
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.65 }}
            style={{
              fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
              fontWeight: 800,
              lineHeight: 1.08,
              margin: "0 0 20px",
              letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #a78bfa 0%, #60a5fa 50%, #c4b5fd 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            BQD MUI
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #f0abfc 0%, #a78bfa 50%, #60a5fa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Dashboard
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.55 }}
            style={{
              fontSize: "clamp(14px, 2vw, 17px)",
              color: "rgba(255,255,255,0.48)",
              lineHeight: 1.65,
              margin: "0 auto 36px",
              maxWidth: 460,
            }}
          >
            Quản lý tài khoản, theo dõi trạng thái và điều phối các tác vụ
            một cách thông minh và hiệu quả.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.5 }}
            style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}
          >
            <motion.button
              onClick={handleStart}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="btn-gradient"
              style={{
                padding: "14px 36px",
                borderRadius: 12,
                fontSize: 15,
                letterSpacing: "0.02em",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 0 30px rgba(124,58,237,0.4), 0 0 60px rgba(59,130,246,0.12)",
              }}
            >
              <motion.span
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                  backgroundSize: "200% 100%",
                  pointerEvents: "none",
                }}
              />
              {isLoggedIn ? "Vào Dashboard" : "Bắt đầu ngay"}
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.55 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 10,
            marginTop: 36,
          }}
        >
          {[
            { label: "Tài khoản", value: "3", desc: "Đang hoạt động" },
            { label: "Tiến độ", value: "75%", desc: "Hoàn thành" },
            { label: "Trạng thái", value: "LIVE", desc: "Hệ thống ổn định" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -3 }}
              className="glass"
              style={{ padding: "18px", textAlign: "center" }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  marginBottom: 4,
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: 2 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.32)" }}>{stat.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Gradient divider ─────────────────────────── */}
      <div
        style={{
          width: "100%",
          maxWidth: 680,
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(124,58,237,0.28), rgba(59,130,246,0.18), transparent)",
        }}
      />

      {/* ── FAQ ──────────────────────────────────────── */}
      <FAQ />
    </div>
  );
}
