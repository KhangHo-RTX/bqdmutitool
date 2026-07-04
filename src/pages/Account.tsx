import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, LogOut, Monitor, Smartphone, Globe } from "lucide-react";
import { clearSession } from "../lib/auth";

interface AccountProps {
  onLogout: () => void;
}

const INITIAL_SESSIONS = [
  { id: "1", device: "Chrome / Windows 11", ip: "103.21.244.1", time: "Hôm nay, 10:30 AM", icon: Monitor },
  { id: "2", device: "Safari / iPhone 15", ip: "192.168.1.14", time: "Hôm qua, 8:15 PM", icon: Smartphone },
  { id: "3", device: "Firefox / Ubuntu", ip: "45.76.32.189", time: "2 ngày trước", icon: Globe },
];

function PasswordInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        className="input-glass"
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ paddingRight: 42 }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.35)",
          cursor: "pointer",
          display: "flex",
          padding: 0,
          transition: "color 0.2s",
        }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export default function Account({ onLogout }: AccountProps) {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    if (!oldPw || !newPw || !confirmPw) {
      setPwError("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    if (newPw.length < 6) {
      setPwError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setPwSuccess(true);
    setOldPw("");
    setNewPw("");
    setConfirmPw("");
    setTimeout(() => setPwSuccess(false), 3500);
  };

  const handleLogoutSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleLogoutAll = () => {
    clearSession();
    onLogout();
  };

  return (
    <div style={{ paddingBottom: 24, maxWidth: 640 }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            margin: "0 0 6px",
          }}
        >
          Tài khoản
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
          Bảo mật và quản lý phiên đăng nhập
        </p>
      </motion.div>

      {/* ── Đổi mật khẩu ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass"
        style={{ padding: "24px 26px", marginBottom: 16 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 9,
              background: "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(59,130,246,0.2))",
              border: "1px solid rgba(124,58,237,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Lock size={17} color="#a78bfa" />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "white", margin: 0 }}>Đổi mật khẩu</h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>Cập nhật mật khẩu của bạn</p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <PasswordInput placeholder="Mật khẩu hiện tại" value={oldPw} onChange={setOldPw} />
          <PasswordInput placeholder="Mật khẩu mới" value={newPw} onChange={setNewPw} />
          <PasswordInput placeholder="Xác nhận mật khẩu mới" value={confirmPw} onChange={setConfirmPw} />

          <AnimatePresence mode="wait">
            {pwError && (
              <motion.div
                key="err"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{
                  fontSize: 13, color: "#f87171",
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  borderRadius: 8, padding: "8px 12px",
                }}
              >
                {pwError}
              </motion.div>
            )}
            {pwSuccess && (
              <motion.div
                key="ok"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{
                  fontSize: 13, color: "#4ade80",
                  background: "rgba(74,222,128,0.08)",
                  border: "1px solid rgba(74,222,128,0.2)",
                  borderRadius: 8, padding: "8px 12px",
                }}
              >
                ✓ Mật khẩu đã được cập nhật thành công!
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-gradient"
            style={{ padding: "11px 24px", borderRadius: 10, fontSize: 14, width: "fit-content", marginTop: 4 }}
          >
            Cập nhật mật khẩu
          </motion.button>
        </form>
      </motion.div>

      {/* ── Quản lý phiên đăng nhập ───────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass"
        style={{ padding: "24px 26px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 9,
              background: "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(59,130,246,0.2))",
              border: "1px solid rgba(124,58,237,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Monitor size={17} color="#a78bfa" />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "white", margin: 0 }}>Quản lý phiên đăng nhập</h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>
              {sessions.length} phiên đang hoạt động
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          <AnimatePresence initial={false}>
            {sessions.map((session) => {
              const Icon = session.icon;
              return (
                <motion.div
                  key={session.id}
                  layout
                  initial={{ opacity: 0, height: 0, overflow: "hidden" }}
                  animate={{ opacity: 1, height: "auto", overflow: "visible" }}
                  exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 34, height: 34, borderRadius: 8,
                        background: "rgba(124,58,237,0.12)",
                        border: "1px solid rgba(124,58,237,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={15} color="#a78bfa" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.85)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {session.device}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                        {session.ip} · {session.time}
                      </div>
                    </div>
                    <button
                      onClick={() => handleLogoutSession(session.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "6px 12px", borderRadius: 8,
                        background: "rgba(248,113,113,0.08)",
                        border: "1px solid rgba(248,113,113,0.2)",
                        color: "#f87171", fontSize: 12, fontWeight: 500,
                        cursor: "pointer", transition: "all 0.2s ease",
                        flexShrink: 0, whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.18)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.08)"; }}
                    >
                      <LogOut size={12} />
                      Đăng xuất
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {sessions.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: "20px",
                textAlign: "center",
                color: "rgba(255,255,255,0.3)",
                fontSize: 13,
                background: "rgba(255,255,255,0.02)",
                borderRadius: 10,
                border: "1px dashed rgba(255,255,255,0.08)",
              }}
            >
              Tất cả phiên đã đăng xuất
            </motion.div>
          )}
        </div>

        <button
          onClick={handleLogoutAll}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 10,
            background: "rgba(248,113,113,0.10)",
            border: "1px solid rgba(248,113,113,0.25)",
            color: "#f87171", fontSize: 13, fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.18)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.10)"; }}
        >
          <LogOut size={15} />
          Đăng xuất tất cả thiết bị
        </button>
      </motion.div>
    </div>
  );
}
