import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, CheckCircle, AlertCircle, ArrowRight, RotateCcw } from "lucide-react";
import type { Page } from "../App";

interface LaunchProps {
  onNavigate: (page: Page) => void;
}

const STEPS = ["Cấu hình", "Xác thực", "Hoàn thành"];

const pageVariants = {
  initial: { opacity: 0, x: 32 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -32 },
};

export default function Launch({ onNavigate }: LaunchProps) {
  const [step, setStep] = useState(0);
  const [multiAccount, setMultiAccount] = useState(false);
  const [tokens, setTokens] = useState("");
  const [validating, setValidating] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  const handleValidate = async () => {
    if (!tokens.trim()) {
      setStep(1);
      setTokenError(true);
      setValidating(false);
      return;
    }
    setStep(1);
    setTokenError(false);
    setValidating(true);
    await new Promise((r) => setTimeout(r, 2000));
    setValidating(false);
    setStep(2);
  };

  const handleRetry = () => {
    setStep(0);
    setTokenError(false);
    setTokens("");
  };

  const handleReset = () => {
    setStep(0);
    setTokenError(false);
    setTokens("");
    setMultiAccount(false);
  };

  return (
    <div style={{ paddingBottom: 24, maxWidth: 600, margin: "0 auto" }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 26, fontWeight: 700,
            background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            margin: "0 0 6px",
          }}
        >
          Khởi chạy
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
          Thiết lập và xác thực token để bắt đầu
        </p>
      </motion.div>

      {/* ── Progress steps ──────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass"
        style={{ padding: "20px 24px", marginBottom: 24 }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <motion.div
                  animate={i === step ? { scale: 1.12 } : { scale: 1 }}
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700,
                    transition: "all 0.35s ease",
                    ...(i < step
                      ? { background: "linear-gradient(135deg,#7c3aed,#3b82f6)", color: "white", boxShadow: "0 0 12px rgba(124,58,237,0.5)" }
                      : i === step
                      ? { background: "linear-gradient(135deg,#7c3aed,#3b82f6)", color: "white", boxShadow: "0 0 22px rgba(124,58,237,0.65)" }
                      : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.1)" }),
                  }}
                >
                  {i < step ? <CheckCircle size={16} /> : i + 1}
                </motion.div>
                <span style={{ fontSize: 11, fontWeight: i === step ? 600 : 400, color: i <= step ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    flex: 1, height: 2, margin: "-20px 8px 0", borderRadius: 1,
                    background: i < step ? "linear-gradient(90deg,#7c3aed,#3b82f6)" : "rgba(255,255,255,0.08)",
                    transition: "background 0.5s ease",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Step content ────────────────────────────── */}
      <div style={{ overflow: "hidden" }}>
        <AnimatePresence mode="wait">

          {/* STEP 0 — Config */}
          {step === 0 && (
            <motion.div key="step0" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.28, ease: "easeInOut" }}>
              <div className="glass" style={{ padding: "28px" }}>
                <h3 style={{ fontSize: 17, fontWeight: 600, color: "white", margin: "0 0 20px" }}>
                  Cấu hình tài khoản
                </h3>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 10 }}>
                    Chế độ tài khoản
                  </label>
                  <div
                    style={{
                      display: "inline-flex",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10, padding: 4, gap: 4,
                    }}
                  >
                    {["1 tài khoản", "Nhiều tài khoản"].map((label, i) => {
                      const active = i === (multiAccount ? 1 : 0);
                      return (
                        <button
                          key={i}
                          onClick={() => setMultiAccount(i === 1)}
                          style={{
                            padding: "8px 16px", borderRadius: 7, border: "none",
                            cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400,
                            transition: "all 0.25s ease",
                            background: active ? "linear-gradient(135deg,#7c3aed,#3b82f6)" : "transparent",
                            color: active ? "white" : "rgba(255,255,255,0.45)",
                            boxShadow: active ? "0 0 12px rgba(124,58,237,0.4)" : "none",
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 10 }}>
                    {multiAccount ? "Danh sách Token (mỗi dòng 1 token)" : "Token"}
                  </label>
                  <textarea
                    className="input-glass"
                    rows={multiAccount ? 6 : 3}
                    placeholder={multiAccount ? "Token1\nToken2\nToken3..." : "Nhập token của bạn..."}
                    value={tokens}
                    onChange={(e) => setTokens(e.target.value)}
                    style={{ resize: "vertical", fontFamily: "var(--app-font-mono)", fontSize: 13 }}
                  />
                </div>

                <motion.button
                  onClick={handleValidate}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-gradient"
                  style={{ padding: "12px 28px", borderRadius: 10, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}
                >
                  Xác thực <ChevronRight size={16} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 1 — Validating / Error */}
          {step === 1 && (
            <motion.div key="step1" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.28, ease: "easeInOut" }}>
              <div className="glass" style={{ padding: "48px 28px", textAlign: "center" }}>
                {validating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      style={{
                        width: 56, height: 56,
                        border: "3px solid rgba(124,58,237,0.2)",
                        borderTopColor: "#7c3aed",
                        borderRadius: "50%", margin: "0 auto 20px",
                      }}
                    />
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: "white", margin: "0 0 8px" }}>Đang xác thực...</h3>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>Vui lòng chờ trong giây lát</p>
                  </>
                ) : tokenError ? (
                  <>
                    <motion.div
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{
                        width: 60, height: 60, borderRadius: "50%",
                        background: "rgba(248,113,113,0.1)",
                        border: "2px solid rgba(248,113,113,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 20px",
                      }}
                    >
                      <AlertCircle size={28} color="#f87171" />
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        fontSize: 14, color: "#f87171",
                        background: "rgba(248,113,113,0.08)",
                        border: "1px solid rgba(248,113,113,0.2)",
                        borderRadius: 10, padding: "12px 16px",
                        margin: "0 0 20px",
                        lineHeight: 1.5,
                      }}
                    >
                      Token không hợp lệ, vui lòng kiểm tra và nhập lại
                    </motion.p>
                    <button
                      onClick={handleRetry}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "10px 24px", borderRadius: 10,
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 500,
                        cursor: "pointer", transition: "all 0.2s", margin: "0 auto",
                      }}
                    >
                      <RotateCcw size={14} /> Nhập lại Token
                    </button>
                  </>
                ) : null}
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Success */}
          {step === 2 && (
            <motion.div key="step2" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.28, ease: "easeInOut" }}>
              <div className="glass" style={{ padding: "48px 28px", textAlign: "center" }}>
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 20 }}
                  style={{
                    width: 68, height: 68, borderRadius: "50%",
                    background: "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(59,130,246,0.15))",
                    border: "2px solid rgba(124,58,237,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 20px",
                    boxShadow: "0 0 28px rgba(124,58,237,0.35)",
                  }}
                >
                  <CheckCircle size={32} color="#a78bfa" />
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  style={{ fontSize: 20, fontWeight: 700, color: "white", margin: "0 0 12px" }}
                >
                  Xác thực thành công!
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, margin: "0 auto 28px", maxWidth: 360 }}
                >
                  Đã nhận nhiệm vụ cho tài khoản này vui lòng chuyển hướng sang mục status để xem trạng thái
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}
                >
                  <motion.button
                    onClick={() => onNavigate("status")}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn-gradient"
                    style={{ padding: "12px 28px", borderRadius: 10, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}
                  >
                    Xem Status <ArrowRight size={16} />
                  </motion.button>
                  <button
                    onClick={handleReset}
                    style={{
                      padding: "12px 20px", borderRadius: 10,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "rgba(255,255,255,0.6)", fontSize: 14,
                      cursor: "pointer", transition: "all 0.2s",
                      display: "flex", alignItems: "center", gap: 7,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.10)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
                  >
                    <RotateCcw size={14} /> Thêm tài khoản
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
