import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, User, Mail, Zap, CheckCircle } from "lucide-react";
import { login, setSession } from "../lib/auth";

interface AuthCardProps {
  onSuccess: () => void;
  initialMode?: "login" | "register";
}

function InputField({
  icon,
  type,
  placeholder,
  value,
  onChange,
  error,
  showToggle,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  showToggle?: boolean;
}) {
  const [show, setShow] = useState(false);
  const inputType = showToggle ? (show ? "text" : "password") : type;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: error ? "rgba(248,113,113,0.6)" : "rgba(255,255,255,0.3)",
            display: "flex",
          }}
        >
          {icon}
        </span>
        <input
          className="input-glass"
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            paddingLeft: 38,
            paddingRight: showToggle ? 42 : 14,
            borderColor: error ? "rgba(248,113,113,0.4)" : undefined,
            background: error ? "rgba(248,113,113,0.04)" : undefined,
            boxShadow: error ? "0 0 0 3px rgba(248,113,113,0.08)" : undefined,
          }}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.3)",
              cursor: "pointer",
              display: "flex",
              padding: 0,
              transition: "color 0.2s",
            }}
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            style={{ fontSize: 11, color: "#f87171", margin: 0, paddingLeft: 4 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AuthCard({ onSuccess, initialMode = "login" }: AuthCardProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);

  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [regUser, setRegUser] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  const switchMode = (m: "login" | "register") => {
    setMode(m);
    setLoginError("");
    setRegErrors({});
    setRegSuccess(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!loginUser.trim() || !loginPass) {
      setLoginError("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    setLoginLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    const ok = login(loginUser.trim(), loginPass);
    setLoginLoading(false);
    if (ok) {
      onSuccess();
    } else {
      setLoginError("Sai tên đăng nhập hoặc mật khẩu.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!regUser.trim()) errs.user = "Vui lòng nhập tên đăng nhập.";
    if (!regEmail.trim() || !regEmail.includes("@")) errs.email = "Email không hợp lệ.";
    if (regPass.length < 6) errs.pass = "Mật khẩu phải có ít nhất 6 ký tự.";
    if (regPass !== regConfirm) errs.confirm = "Mật khẩu xác nhận không khớp.";
    if (Object.keys(errs).length) { setRegErrors(errs); return; }
    setRegErrors({});
    setRegLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRegLoading(false);
    setRegSuccess(true);
    setSession(regUser.trim());
    await new Promise((r) => setTimeout(r, 800));
    onSuccess();
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 420,
        margin: "0 auto",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: "rgba(10,10,18,0.85)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 22,
          padding: "32px 28px",
          boxShadow: "0 0 60px rgba(124,58,237,0.12), 0 32px 80px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              background: "linear-gradient(135deg,#7c3aed,#3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 0 24px rgba(124,58,237,0.45)",
            }}
          >
            <Zap size={22} color="white" />
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              margin: "0 0 4px",
            }}
          >
            BQD MUI
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", margin: 0 }}>
            {mode === "login" ? "Chào mừng trở lại!" : "Tạo tài khoản mới"}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: 4,
            marginBottom: 24,
            position: "relative",
          }}
        >
          {(["login", "register"] as const).map((m) => {
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => switchMode(m)}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: 9,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  position: "relative",
                  zIndex: 1,
                  transition: "color 0.25s",
                  background: "transparent",
                  color: active ? "white" : "rgba(255,255,255,0.4)",
                }}
              >
                {active && (
                  <motion.div
                    layoutId="auth-tab"
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 9,
                      background: "linear-gradient(135deg,#7c3aed,#3b82f6)",
                      boxShadow: "0 0 14px rgba(124,58,237,0.4)",
                      zIndex: -1,
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                {m === "login" ? "Đăng nhập" : "Đăng ký"}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {mode === "login" ? (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              onSubmit={handleLogin}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <InputField
                icon={<User size={15} />}
                type="text"
                placeholder="Tên đăng nhập"
                value={loginUser}
                onChange={setLoginUser}
              />
              <InputField
                icon={<Lock size={15} />}
                type="password"
                placeholder="Mật khẩu"
                value={loginPass}
                onChange={setLoginPass}
                showToggle
              />

              <AnimatePresence>
                {loginError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      fontSize: 13,
                      color: "#f87171",
                      background: "rgba(248,113,113,0.08)",
                      border: "1px solid rgba(248,113,113,0.2)",
                      borderRadius: 8,
                      padding: "8px 12px",
                    }}
                  >
                    {loginError}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={loginLoading}
                whileHover={{ scale: loginLoading ? 1 : 1.02 }}
                whileTap={{ scale: loginLoading ? 1 : 0.98 }}
                className="btn-gradient"
                style={{
                  padding: "12px",
                  borderRadius: 10,
                  fontSize: 14,
                  marginTop: 4,
                  opacity: loginLoading ? 0.75 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {loginLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                      style={{
                        width: 16,
                        height: 16,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "white",
                        borderRadius: "50%",
                      }}
                    />
                    Đang xác thực...
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </motion.button>
            </motion.form>
          ) : (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              onSubmit={handleRegister}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <AnimatePresence>
                {regSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: "#4ade80",
                      background: "rgba(74,222,128,0.08)",
                      border: "1px solid rgba(74,222,128,0.2)",
                      borderRadius: 8,
                      padding: "10px 12px",
                    }}
                  >
                    <CheckCircle size={15} />
                    Tạo tài khoản thành công! Đang chuyển hướng...
                  </motion.div>
                )}
              </AnimatePresence>

              <InputField
                icon={<User size={15} />}
                type="text"
                placeholder="Tên đăng nhập"
                value={regUser}
                onChange={(v) => { setRegUser(v); setRegErrors((e) => ({ ...e, user: "" })); }}
                error={regErrors.user}
              />
              <InputField
                icon={<Mail size={15} />}
                type="email"
                placeholder="Email"
                value={regEmail}
                onChange={(v) => { setRegEmail(v); setRegErrors((e) => ({ ...e, email: "" })); }}
                error={regErrors.email}
              />
              <InputField
                icon={<Lock size={15} />}
                type="password"
                placeholder="Mật khẩu"
                value={regPass}
                onChange={(v) => { setRegPass(v); setRegErrors((e) => ({ ...e, pass: "", confirm: regConfirm && v !== regConfirm ? "Mật khẩu xác nhận không khớp." : "" })); }}
                error={regErrors.pass}
                showToggle
              />
              <InputField
                icon={<Lock size={15} />}
                type="password"
                placeholder="Xác nhận mật khẩu"
                value={regConfirm}
                onChange={(v) => { setRegConfirm(v); setRegErrors((e) => ({ ...e, confirm: v !== regPass ? "Mật khẩu xác nhận không khớp." : "" })); }}
                error={regErrors.confirm}
                showToggle
              />

              <motion.button
                type="submit"
                disabled={regLoading || regSuccess}
                whileHover={{ scale: regLoading || regSuccess ? 1 : 1.02 }}
                whileTap={{ scale: regLoading || regSuccess ? 1 : 0.98 }}
                className="btn-gradient"
                style={{
                  padding: "12px",
                  borderRadius: 10,
                  fontSize: 14,
                  marginTop: 4,
                  opacity: regLoading || regSuccess ? 0.75 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {regLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                      style={{
                        width: 16,
                        height: 16,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "white",
                        borderRadius: "50%",
                      }}
                    />
                    Đang tạo tài khoản...
                  </>
                ) : (
                  "Tạo tài khoản"
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
