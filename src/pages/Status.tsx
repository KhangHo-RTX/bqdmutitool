import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, Copy, Check, Users, CheckCircle2, Clock } from "lucide-react";

interface Account {
  id: string;
  discordId: string;
  displayName: string;
  username: string;
  progress: number;
  paused: boolean;
  startTime: string;
  token: string;
}

const INITIAL_ACCOUNTS: Account[] = [
  {
    id: "1",
    discordId: "1514899451016249467",
    displayName: "TylerGG",
    username: "tylers.g1",
    progress: 75,
    paused: false,
    startTime: "10:30 AM",
    token: "mfa.aBcDeFgHiJkLmNoPqRsTuVwXyZ",
  },
  {
    id: "2",
    discordId: "8827634510294875031",
    displayName: "Shadow_X",
    username: "shadow.x99",
    progress: 100,
    paused: true,
    startTime: "09:15 AM",
    token: "mfa.XyZaBcDeFgHiJkLmNoPqRsTuV",
  },
  {
    id: "3",
    discordId: "3392748561038492716",
    displayName: "NightOwl",
    username: "nightowl_",
    progress: 42,
    paused: false,
    startTime: "11:00 AM",
    token: "mfa.QrStUvWxYzAbCdEfGhIjKlMnOp",
  },
];

interface AccountBlockProps {
  account: Account;
  onTogglePause: (id: string) => void;
}

function AccountBlock({ account, onTogglePause }: AccountBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(account.token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass"
      style={{ padding: "20px 22px" }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: "var(--app-font-mono)",
            fontSize: 12,
            fontWeight: 600,
            color: "white",
            letterSpacing: "0.02em",
            wordBreak: "break-all",
          }}
        >
          {account.discordId}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 auto" }}>
          <div className="blink-dot" style={{ opacity: account.paused ? 0.25 : 1 }} />
          <span
            style={{
              padding: "3px 10px",
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              background: account.paused ? "rgba(245,158,11,0.15)" : "rgba(34,197,94,0.15)",
              color: account.paused ? "#fbbf24" : "#4ade80",
              border: `1px solid ${account.paused ? "rgba(245,158,11,0.3)" : "rgba(34,197,94,0.3)"}`,
              transition: "all 0.3s ease",
            }}
          >
            {account.paused ? "TẠM DỪNG" : "ĐANG CHẠY"}
          </span>
        </div>

        <button
          onClick={() => onTogglePause(account.id)}
          title={account.paused ? "Tiếp tục" : "Tạm dừng"}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "rgba(255,255,255,0.7)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.14)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
        >
          {account.paused ? <Play size={14} /> : <Pause size={14} />}
        </button>
      </div>

      {/* Body */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 2 }}>
          {account.displayName}
        </div>
        <div style={{ fontSize: 12, fontWeight: 300, color: "rgba(255,255,255,0.45)" }}>
          {account.username}
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Tiến độ</span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {account.progress}%
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${account.progress}%` }} />
        </div>
      </div>

      {/* Footer — 2 columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          paddingTop: 12,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Thời gian
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
            {account.startTime}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Token
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: "var(--app-font-mono)", fontSize: 12, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>
              ••••••
            </span>
            <button
              onClick={handleCopy}
              title="Sao chép token"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: copied ? "rgba(74,222,128,0.08)" : "none",
                border: copied ? "1px solid rgba(74,222,128,0.2)" : "1px solid transparent",
                cursor: "pointer",
                color: copied ? "#4ade80" : "rgba(255,255,255,0.4)",
                fontSize: 11,
                fontWeight: 500,
                padding: "2px 7px",
                borderRadius: 6,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { if (!copied) (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.8)"; }}
              onMouseLeave={(e) => { if (!copied) (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)"; }}
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} style={{ display: "flex" }}>
                    <Check size={13} />
                  </motion.span>
                ) : (
                  <motion.span key="copy" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} style={{ display: "flex" }}>
                    <Copy size={13} />
                  </motion.span>
                )}
              </AnimatePresence>
              {copied ? "Đã chép!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Status() {
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);

  const handleTogglePause = (id: string) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, paused: !a.paused } : a))
    );
  };

  const total = accounts.length;
  const running = accounts.filter((a) => !a.paused).length;
  const done = accounts.filter((a) => a.progress >= 100).length;
  const notDone = accounts.filter((a) => a.progress < 100).length;

  const stats = [
    { icon: Users, label: "Đang chạy", value: running, color: "#4ade80", bg: "rgba(34,197,94,0.10)", border: "rgba(34,197,94,0.2)" },
    { icon: CheckCircle2, label: "Tài khoản xong", value: `${done}/${total}`, color: "#60a5fa", bg: "rgba(59,130,246,0.10)", border: "rgba(59,130,246,0.2)" },
    { icon: Clock, label: "Chưa xong", value: notDone, color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.2)" },
  ];

  return (
    <div style={{ paddingBottom: 24 }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
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
          Status
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
          Theo dõi trạng thái tất cả tài khoản
        </p>
      </motion.div>

      {/* Stat cards — reactive to pause/resume */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -2 }}
              className="glass"
              style={{ padding: "16px 18px", borderColor: stat.border, background: stat.bg }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Icon size={16} color={stat.color} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{stat.label}</span>
              </div>
              <motion.div
                key={String(stat.value)}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ fontSize: 28, fontWeight: 800, color: stat.color, lineHeight: 1 }}
              >
                {stat.value}
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Account blocks */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {accounts.map((account, i) => (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
          >
            <AccountBlock account={account} onTogglePause={handleTogglePause} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
