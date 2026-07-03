/**
 * BYPASS QUEST — AUTOMATION HUB
 * 
 * Kiến trúc: AppState pattern — quản lý trạng thái tập trung
 * Logic được tách biệt hoàn toàn khỏi UI rendering
 * 
 * Ba stage:
 *  1. WelcomeStage  — Màn hình chào mừng
 *  2. AuthStage     — Panel xác thực (Auth Core Panel)
 *  3. DashboardStage— Bảng điều khiển chính (Data Telemetry Matrix)
 */

import { useState, useEffect, useCallback, useRef } from "react";

// ============================================================
// TYPES — Định nghĩa kiểu dữ liệu
// ============================================================

type Stage = "welcome" | "auth" | "dashboard";
type TaskStatus = "active" | "paused" | "failed" | "queued";
type ToastType = "success" | "error" | "warning" | "info";
type NavSection = "overview" | "tasks" | "analytics" | "logs" | "settings";

interface Task {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  progress: number;         // 0-100
  successRate: number;      // 0-100
  lastRun: string;
  nextRun: string;
  executions: number;
  target: string;
}

interface StatCard {
  id: string;
  label: string;
  value: string | number;
  change: number;           // % thay đổi so với kỳ trước
  accent: string;
  icon: React.ReactNode;
  sparkline: number[];
}

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration: number;
  exiting?: boolean;
}

interface AppState {
  stage: Stage;
  isTransitioning: boolean;
  activeNav: NavSection;
  isLoading: boolean;
  userData: {
    username: string;
    role: string;
    avatar: string;
    sessionId: string;
  };
  tasks: Task[];
  stats: StatCard[];
  toasts: Toast[];
  searchQuery: string;
  filterStatus: TaskStatus | "all";
}

// ============================================================
// DỮ LIỆU MẪU — Tất cả nội dung được quản lý qua state
// ============================================================

const SAMPLE_TASKS: Task[] = [
  {
    id: "BQ-001",
    name: "Bypass Protocol Alpha",
    description: "Quy trình vượt tường lửa tầng 1",
    status: "active",
    progress: 87,
    successRate: 98.4,
    lastRun: "2 phút trước",
    nextRun: "13 phút nữa",
    executions: 14820,
    target: "gateway-node-07",
  },
  {
    id: "BQ-002",
    name: "Auth Token Rotator",
    description: "Tự động xoay vòng token xác thực",
    status: "active",
    progress: 100,
    successRate: 99.9,
    lastRun: "Vừa xong",
    nextRun: "5 phút nữa",
    executions: 56430,
    target: "auth-cluster-02",
  },
  {
    id: "BQ-003",
    name: "Session Harvester",
    description: "Thu thập và lưu trữ phiên làm việc",
    status: "paused",
    progress: 45,
    successRate: 91.2,
    lastRun: "1 giờ trước",
    nextRun: "Đã tạm dừng",
    executions: 3210,
    target: "session-pool-04",
  },
  {
    id: "BQ-004",
    name: "Rate Limit Evader",
    description: "Phân tán lưu lượng tránh giới hạn tốc độ",
    status: "active",
    progress: 62,
    successRate: 95.7,
    lastRun: "5 phút trước",
    nextRun: "8 phút nữa",
    executions: 29140,
    target: "proxy-mesh-11",
  },
  {
    id: "BQ-005",
    name: "Captcha Resolver",
    description: "Giải mã captcha tự động thông minh",
    status: "failed",
    progress: 0,
    successRate: 74.3,
    lastRun: "3 giờ trước",
    nextRun: "Cần khôi phục",
    executions: 8720,
    target: "solver-node-03",
  },
  {
    id: "BQ-006",
    name: "Data Exfiltrator",
    description: "Trích xuất dữ liệu theo lịch trình",
    status: "queued",
    progress: 0,
    successRate: 88.1,
    lastRun: "Chưa chạy",
    nextRun: "Đang xếp hàng",
    executions: 0,
    target: "export-node-01",
  },
  {
    id: "BQ-007",
    name: "Identity Cycler",
    description: "Xoay vòng danh tính và fingerprint",
    status: "active",
    progress: 31,
    successRate: 97.6,
    lastRun: "12 phút trước",
    nextRun: "3 phút nữa",
    executions: 41200,
    target: "identity-vault-06",
  },
  {
    id: "BQ-008",
    name: "Proxy Chain Builder",
    description: "Xây dựng chuỗi proxy đa lớp",
    status: "active",
    progress: 78,
    successRate: 93.8,
    lastRun: "1 phút trước",
    nextRun: "9 phút nữa",
    executions: 17650,
    target: "proxy-farm-09",
  },
];

// ============================================================
// LOGIC LAYER — Tách biệt hoàn toàn khỏi UI
// ============================================================

/**
 * Tạo ID duy nhất cho toast
 */
const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * Tính màu cho badge theo status
 */
const getStatusClass = (status: TaskStatus): string => {
  const map: Record<TaskStatus, string> = {
    active:  "badge-active",
    paused:  "badge-paused",
    failed:  "badge-failed",
    queued:  "badge-queued",
  };
  return map[status];
};

/**
 * Label tiếng Việt cho status
 */
const getStatusLabel = (status: TaskStatus): string => {
  const map: Record<TaskStatus, string> = {
    active:  "ĐANG CHẠY",
    paused:  "TẠM DỪNG",
    failed:  "LỖI",
    queued:  "XẾP HÀNG",
  };
  return map[status];
};

/**
 * Format số lớn thành dạng rút gọn (14820 → 14.8K)
 */
const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

// ============================================================
// ICONS — SVG inline (tránh dependency)
// ============================================================

const Icons = {
  Logo: () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M4 16C4 9.373 9.373 4 16 4s12 5.373 12 12-5.373 12-12 12S4 22.627 4 16z" stroke="url(#lg1)" strokeWidth="1.5" fill="rgba(139,92,246,0.08)"/>
      <path d="M10 16l4 4 8-8" stroke="url(#lg2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="16" cy="16" r="3" fill="url(#lg1)" opacity="0.6"/>
      <defs>
        <linearGradient id="lg1" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b5cf6"/>
          <stop offset="1" stopColor="#34d399"/>
        </linearGradient>
        <linearGradient id="lg2" x1="10" y1="12" x2="22" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a67fff"/>
          <stop offset="1" stopColor="#6ee7b7"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  Shield: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Activity: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  Cpu: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
      <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
      <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
      <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
      <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
    </svg>
  ),
  TrendUp: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  Settings: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Layers: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  BarChart: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Terminal: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
    </svg>
  ),
  Play: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  Pause: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
    </svg>
  ),
  RefreshCw: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  User: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Lock: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  ArrowRight: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Search: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  CheckCircle: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  AlertTriangle: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Info: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  LogOut: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Zap: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
};

// ============================================================
// TOAST COMPONENT
// ============================================================

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
  const props = { size: 16 };
  const styles: Record<ToastType, React.CSSProperties> = {
    success: { color: "var(--status-active)" },
    error:   { color: "var(--status-failed)" },
    warning: { color: "var(--status-paused)" },
    info:    { color: "var(--amethyst-400)" },
  };
  return (
    <span className="toast-icon" style={styles[type]}>
      {type === "success" && <Icons.CheckCircle {...props} />}
      {type === "error"   && <Icons.AlertTriangle {...props} />}
      {type === "warning" && <Icons.AlertTriangle {...props} />}
      {type === "info"    && <Icons.Info {...props} />}
    </span>
  );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({
  toast, onRemove,
}) => {
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), toast.duration);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div className={`toast toast-${toast.type} ${toast.exiting ? "toast-exit" : ""}`}>
      <ToastIcon type={toast.type} />
      <div>
        <div className="toast-title">{toast.title}</div>
        <div className="toast-message">{toast.message}</div>
      </div>
    </div>
  );
};

// ============================================================
// SPARKLINE (SVG mini chart)
// ============================================================

const Sparkline: React.FC<{ data: number[]; color?: string }> = ({
  data, color = "var(--amethyst-400)",
}) => {
  const W = 80, H = 32;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((v - min) / range) * (H - 4) - 2,
  }));

  const pathD = points.reduce(
    (acc, p, i) => acc + (i === 0 ? `M${p.x},${p.y}` : ` L${p.x},${p.y}`),
    ""
  );

  const areaD =
    pathD +
    ` L${points[points.length - 1].x},${H} L${points[0].x},${H} Z`;

  return (
    <svg width={W} height={H} className="sparkline" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`spark-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-${color.replace(/[^a-z0-9]/gi, "")})`} />
      <path d={pathD} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="3"
        fill={color}
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.3"
      />
    </svg>
  );
};

// ============================================================
// STAGE 1: WELCOME STAGE
// ============================================================

const WelcomeStage: React.FC<{ onEnter: () => void; visible: boolean }> = ({
  onEnter, visible,
}) => {
  const [tagVisible, setTagVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTagVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`stage-container ${visible ? "stage-enter" : "stage-exit"}`}
      style={{ zIndex: 10, flexDirection: "column", gap: "0" }}
    >
      {/* Các orb nền động */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Nội dung chính */}
      <div
        style={{
          textAlign: "center",
          position: "relative",
          zIndex: 2,
          maxWidth: "520px",
          padding: "0 24px",
        }}
      >
        {/* Logo */}
        <div
          className="logo-glow"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "80px",
            height: "80px",
            background: "rgba(139, 92, 246, 0.08)",
            border: "1px solid rgba(139, 92, 246, 0.25)",
            borderRadius: "24px",
            marginBottom: "28px",
          }}
        >
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <path
              d="M8 22C8 14.268 14.268 8 22 8s14 6.268 14 14-6.268 14-14 14S8 29.732 8 22z"
              stroke="url(#wlg1)"
              strokeWidth="1.5"
              fill="rgba(139,92,246,0.08)"
            />
            <path
              d="M15 22l5 5L29 15"
              stroke="url(#wlg2)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="22" cy="22" r="4" fill="url(#wlg1)" opacity="0.5" />
            <defs>
              <linearGradient id="wlg1" x1="8" y1="8" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8b5cf6" />
                <stop offset="1" stopColor="#34d399" />
              </linearGradient>
              <linearGradient id="wlg2" x1="15" y1="18" x2="29" y2="25" gradientUnits="userSpaceOnUse">
                <stop stopColor="#c3a8ff" />
                <stop offset="1" stopColor="#6ee7b7" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Tag */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "20px",
            opacity: tagVisible ? 1 : 0,
            transform: tagVisible ? "translateY(0)" : "translateY(8px)",
            transition: "all 0.5s var(--ease-premium)",
          }}
        >
          <span className="tag-amethyst">
            <Icons.Zap size={9} /> AUTOMATION HUB v2.4.1
          </span>
        </div>

        {/* Tiêu đề chính — Roboto Slab */}
        <h1
          className="font-title"
          style={{
            fontSize: "clamp(2.2rem, 5vw, 3.2rem)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: "16px",
            color: "var(--text-primary)",
          }}
        >
          Bypass{" "}
          <span className="gradient-text">Quest</span>
        </h1>

        {/* Mô tả */}
        <p
          style={{
            fontSize: "15px",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "40px",
            maxWidth: "380px",
            margin: "0 auto 40px",
          }}
        >
          Nền tảng điều khiển tự động hóa cao cấp — quản lý, giám sát và
          tối ưu hóa toàn bộ quy trình trong một giao diện thống nhất.
        </p>

        {/* Nút vào */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button className="btn-primary" onClick={onEnter} style={{ fontSize: "15px", padding: "14px 36px" }}>
            Start The Service
            <Icons.ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// STAGE 2: AUTH CORE PANEL
// ============================================================

// Helpers for localStorage account store
const ACCOUNTS_KEY = "bq_accounts";
type AccountStore = Record<string, string>; // username → btoa(password)

const getAccounts = (): AccountStore => {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "{}"); }
  catch { return {}; }
};
const saveAccount = (username: string, password: string) => {
  const accounts = getAccounts();
  accounts[username.toLowerCase()] = btoa(password);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};
const verifyAccount = (username: string, password: string): boolean => {
  const accounts = getAccounts();
  return accounts[username.toLowerCase()] === btoa(password);
};
const accountExists = (username: string): boolean =>
  username.toLowerCase() in getAccounts();

// Component này phải ở NGOÀI AuthStage để tránh bị unmount mỗi render (gây tắt bàn phím mobile)
const AuthInputField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  onClearError: () => void;
  onEnter: () => void;
  type?: string;
  placeholder?: string;
  rightEl?: React.ReactNode;
}> = ({ label, value, onChange, onClearError, onEnter, type = "text", placeholder, rightEl }) => (
  <div style={{ marginBottom: "14px", textAlign: "left" }}>
    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
      {label}
    </label>
    <div style={{ position: "relative" }}>
      <input
        className="input-glass"
        type={type}
        value={value}
        onChange={e => { onChange(e.target.value); onClearError(); }}
        placeholder={placeholder}
        onKeyDown={e => { if (e.key === "Enter") onEnter(); }}
        style={{ width: "100%", padding: rightEl ? "10px 40px 10px 14px" : "10px 14px", fontSize: "13px", boxSizing: "border-box" }}
        autoComplete={type === "password" ? "current-password" : "username"}
      />
      {rightEl && (
        <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}>
          {rightEl}
        </span>
      )}
    </div>
  </div>
);

const AuthStage: React.FC<{
  onLogin: (username: string) => void;
  visible: boolean;
}> = ({ onLogin, visible }) => {
  const [mode, setMode]       = useState<"gate" | "login" | "register">("gate");
  const [tab, setTab]         = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError]     = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const resetForm = () => { setUsername(""); setPassword(""); setConfirm(""); setError(""); };

  const switchTab = (t: "login" | "register") => {
    setTab(t);
    setMode(t);
    resetForm();
  };

  const handleGate = () => {
    setMode("login");
    setTab("login");
    resetForm();
  };

  const handleLogin = async () => {
    if (!username.trim()) { setError("Vui lòng nhập tên đăng nhập."); return; }
    if (!password) { setError("Vui lòng nhập mật khẩu."); return; }
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setIsLoading(false);
    if (!accountExists(username)) { setError("Tài khoản không tồn tại. Hãy đăng ký trước."); return; }
    if (!verifyAccount(username, password)) { setError("Mật khẩu không chính xác."); return; }
    onLogin(username.trim());
  };

  const handleRegister = async () => {
    if (!username.trim()) { setError("Vui lòng nhập tên đăng nhập."); return; }
    if (username.trim().length < 3) { setError("Tên đăng nhập phải có ít nhất 3 ký tự."); return; }
    if (!password) { setError("Vui lòng nhập mật khẩu."); return; }
    if (password.length < 6) { setError("Mật khẩu phải có ít nhất 6 ký tự."); return; }
    if (password !== confirm) { setError("Mật khẩu xác nhận không khớp."); return; }
    if (accountExists(username)) { setError("Tên đăng nhập đã tồn tại. Hãy chọn tên khác."); return; }
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsLoading(false);
    saveAccount(username.trim(), password);
    onLogin(username.trim());
  };

  return (
    <div
      className={`stage-container ${visible ? "stage-enter" : "stage-exit"}`}
      style={{ zIndex: 10, padding: "24px" }}
    >
      <div className="orb orb-1" style={{ opacity: 0.08 }} />
      <div className="orb orb-2" style={{ opacity: 0.06 }} />

      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: mode === "gate" ? "44px 40px" : "36px 36px 32px",
          boxShadow: "var(--shadow-amethyst), var(--shadow-lg)",
          position: "relative",
          zIndex: 2,
          textAlign: mode === "gate" ? "center" : "left",
          transition: "padding 0.3s",
        }}
      >
        {/* Icon + title */}
        <div style={{ textAlign: "center", marginBottom: mode === "gate" ? "0" : "24px" }}>
          <div
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: "56px", height: "56px",
              background: "rgba(139,92,246,0.10)", border: "1px solid rgba(139,92,246,0.22)",
              borderRadius: "16px", marginBottom: "20px",
            }}
          >
            <span style={{ color: "var(--amethyst-400)" }}><Icons.Shield size={26} /></span>
          </div>
          <h2 className="font-title" style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
            {mode === "gate" ? "Auth Core Panel" : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
          </h2>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: mode === "gate" ? "32px" : "0" }}>
            {mode === "gate"
              ? (<>Hệ thống đã xác minh thiết bị của bạn.<br />Nhấn để tiếp cận Automation Hub.</>)
              : mode === "login"
              ? "Nhập thông tin tài khoản của bạn để tiếp tục."
              : "Tạo tài khoản mới để truy cập Automation Hub."
            }
          </p>
        </div>

        {/* Gate mode: single button */}
        {mode === "gate" && (
          <button className="btn-primary" onClick={handleGate} style={{ width: "100%", fontSize: "14px", padding: "14px" }}>
            Start The Service
            <Icons.ArrowRight size={15} />
          </button>
        )}

        {/* Login / Register form */}
        {mode !== "gate" && (
          <>
            {/* Tabs */}
            <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "3px", marginBottom: "22px", marginTop: "20px" }}>
              {(["login","register"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => switchTab(t)}
                  style={{
                    flex: 1, padding: "8px", fontSize: "12px", fontWeight: 600, border: "none", borderRadius: "8px", cursor: "pointer",
                    transition: "all 0.2s",
                    background: tab === t ? "rgba(139,92,246,0.20)" : "transparent",
                    color: tab === t ? "var(--amethyst-300)" : "var(--text-tertiary)",
                    boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
                  }}
                >
                  {t === "login" ? "Đăng nhập" : "Đăng ký"}
                </button>
              ))}
            </div>

            {/* Fields */}
            <AuthInputField
              label="Tên đăng nhập"
              value={username}
              onChange={setUsername}
              onClearError={() => setError("")}
              onEnter={mode === "login" ? handleLogin : handleRegister}
              placeholder="username"
            />
            <AuthInputField
              label="Mật khẩu"
              value={password}
              onChange={setPassword}
              onClearError={() => setError("")}
              onEnter={mode === "login" ? handleLogin : handleRegister}
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              rightEl={
                <span onClick={() => setShowPass(s => !s)} style={{ color: "var(--text-tertiary)", fontSize: "12px", userSelect: "none" }}>
                  {showPass ? "Ẩn" : "Hiện"}
                </span>
              }
            />
            {mode === "register" && (
              <AuthInputField
                label="Xác nhận mật khẩu"
                value={confirm}
                onChange={setConfirm}
                onClearError={() => setError("")}
                onEnter={handleRegister}
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
              />
            )}

            {/* Error */}
            {error && (
              <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "8px", padding: "10px 12px", marginBottom: "14px", fontSize: "12px", color: "var(--status-failed)", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ flexShrink: 0 }}>⚠</span> {error}
              </div>
            )}

            {/* Submit */}
            <button
              className="btn-primary"
              onClick={mode === "login" ? handleLogin : handleRegister}
              disabled={isLoading}
              style={{ width: "100%", fontSize: "13px", padding: "13px", opacity: isLoading ? 0.85 : 1, marginBottom: "16px" }}
            >
              {isLoading ? (
                <><div className="spinner" style={{ width: "15px", height: "15px" }} />{mode === "login" ? "Đang xác thực..." : "Đang tạo tài khoản..."}</>
              ) : (
                <>{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}<Icons.ArrowRight size={14} /></>
              )}
            </button>

            {/* Switch link */}
            <div style={{ textAlign: "center", fontSize: "12px", color: "var(--text-tertiary)" }}>
              {mode === "login" ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
              <button
                onClick={() => switchTab(mode === "login" ? "register" : "login")}
                style={{ background: "none", border: "none", color: "var(--amethyst-400)", cursor: "pointer", fontSize: "12px", fontWeight: 600, padding: 0 }}
              >
                {mode === "login" ? "Đăng ký ngay" : "Đăng nhập"}
              </button>
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px", color: "var(--text-tertiary)" }}>
          <Icons.Shield size={11} />
          Phiên làm việc được mã hóa end-to-end
        </div>
      </div>
    </div>
  );
};

// ============================================================
// HOOK — Phát hiện kích thước màn hình
// ============================================================

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );
  const [isTablet, setIsTablet] = useState(() =>
    typeof window !== "undefined"
      ? window.innerWidth > breakpoint && window.innerWidth <= 1024
      : false
  );

  useEffect(() => {
    const update = () => {
      setIsMobile(window.innerWidth <= breakpoint);
      setIsTablet(window.innerWidth > breakpoint && window.innerWidth <= 1024);
    };
    window.addEventListener("resize", update);
    update();
    return () => window.removeEventListener("resize", update);
  }, [breakpoint]);

  return { isMobile, isTablet };
}

// ============================================================
// STAGE 3: DASHBOARD — DATA TELEMETRY MATRIX
// ============================================================

// Hamburger icon
const HamburgerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <line x1="2" y1="4.5" x2="16" y2="4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="2" y1="9"   x2="16" y2="9"   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="2" y1="13.5" x2="16" y2="13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// X icon để đóng sidebar
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="14" y1="2" x2="2" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Sidebar component
const Sidebar: React.FC<{
  activeNav: NavSection;
  onNavChange: (nav: NavSection) => void;
  userData: AppState["userData"];
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  isTablet: boolean;
}> = ({ activeNav, onNavChange, userData, onLogout, isOpen, onClose, isMobile, isTablet }) => {
  const navItems: { id: NavSection; label: string; icon: React.ReactNode }[] = [
    { id: "overview",   label: "Tổng quan",       icon: <Icons.Layers size={15} /> },
    { id: "tasks",      label: "Quản lý Tasks",    icon: <Icons.Activity size={15} /> },
    { id: "analytics",  label: "Phân tích",        icon: <Icons.BarChart size={15} /> },
    { id: "logs",       label: "Nhật ký hệ thống", icon: <Icons.Terminal size={15} /> },
    { id: "settings",   label: "Cấu hình",         icon: <Icons.Settings size={15} /> },
  ];

  const handleNavClick = (id: NavSection) => {
    onNavChange(id);
    if (isMobile) onClose();
  };

  return (
    <>
      {/* Overlay backdrop — hiện khi sidebar mở trên mọi thiết bị */}
      <div
        className={`sidebar-overlay ${isOpen ? "active" : ""}`}
        onClick={onClose}
      />

      <aside
        className={`glass-sidebar ${isOpen ? "sidebar-open" : ""}`}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          padding: "20px 12px",
          zIndex: 200,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 10px 20px",
            borderBottom: "1px solid var(--border-subtle)",
            marginBottom: "8px",
            justifyContent: "flex-start",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "rgba(139, 92, 246, 0.10)",
              border: "1px solid rgba(139, 92, 246, 0.20)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icons.Logo />
          </div>
          <div className="sidebar-logo-text">
            <div
              className="font-title"
              style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}
            >
              Bypass Quest
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-tertiary)", letterSpacing: "0.05em" }}>
              AUTOMATION HUB
            </div>
          </div>
          {/* Nút đóng sidebar — hiện trên mọi thiết bị */}
          <button
            onClick={onClose}
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: "none",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
          {!isTablet && (
            <div
              className="sidebar-label-group"
              style={{ fontSize: "10px", color: "var(--text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "10px 14px 6px", fontWeight: 600 }}
            >
              Menu chính
            </div>
          )}
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeNav === item.id ? "active" : ""}`}
              onClick={() => handleNavClick(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="sidebar-text">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User info + logout */}
        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
              className="sidebar-user-info"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "10px",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--amethyst-500), var(--mint-400))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {userData.username.charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: "hidden", flex: 1 }}>
                <div className="truncate" style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {userData.username}
                </div>
                <div style={{ fontSize: "10px", color: "var(--amethyst-400)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {userData.role}
                </div>
              </div>
            </div>

          <button
            className="btn-ghost"
            onClick={onLogout}
            style={{
              fontSize: "12px",
              padding: "8px 14px",
              justifyContent: "flex-start",
              gap: "8px",
            }}
          >
            <Icons.LogOut size={13} />
            <span className="sidebar-logout-text">Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
};

// Stat Cards
const StatsSection: React.FC<{ stats: StatCard[] }> = ({ stats }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "16px",
      marginBottom: "24px",
    }}
  >
    {stats.map((stat) => (
      <div
        key={stat.id}
        className={`glass-card stat-card hover-lift ${stat.accent}`}
        style={{ padding: "20px 22px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "6px",
                fontWeight: 600,
              }}
            >
              {stat.label}
            </div>
            <div
              className="font-title count-animate"
              style={{
                fontSize: "26px",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1,
              }}
            >
              {stat.value}
            </div>
          </div>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--border-subtle)",
              color:
                stat.accent === "accent-amethyst"
                  ? "var(--amethyst-400)"
                  : stat.accent === "accent-mint"
                  ? "var(--mint-400)"
                  : stat.accent === "accent-amber"
                  ? "#f59e0b"
                  : "var(--status-queued)",
            }}
          >
            {stat.icon}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              color: stat.change >= 0 ? "var(--status-active)" : "var(--status-failed)",
            }}
          >
            <Icons.TrendUp size={11} />
            {stat.change >= 0 ? "+" : ""}
            {stat.change}% so với tháng trước
          </div>
          <Sparkline
            data={stat.sparkline}
            color={
              stat.accent === "accent-amethyst"
                ? "var(--amethyst-400)"
                : stat.accent === "accent-mint"
                ? "var(--mint-400)"
                : "#f59e0b"
            }
          />
        </div>
      </div>
    ))}
  </div>
);

// Task Row Component (Desktop)
const TaskRow: React.FC<{
  task: Task;
  onToggle: (id: string) => void;
  onRestart: (id: string) => void;
  columns: string;
}> = ({ task, onToggle, onRestart, columns }) => (
  <div className="table-row" style={{ gridTemplateColumns: columns }}>
    {/* ID + Tên */}
    <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span className="mono" style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
          {task.id}
        </span>
        <span className={`badge ${getStatusClass(task.status)}`}>
          {getStatusLabel(task.status)}
        </span>
      </div>
      <div className="truncate" style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
        {task.name}
      </div>
      <div className="truncate" style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
        {task.description}
      </div>
    </div>

    {/* Target */}
    <div className="truncate mono" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
      {task.target}
    </div>

    {/* Progress */}
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontSize: "11px", color: "var(--text-secondary)" }}>
        <span>Tiến độ</span>
        <span style={{ fontWeight: 600 }}>{task.progress}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${task.progress}%` }} />
      </div>
    </div>

    {/* Success Rate */}
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "15px", fontWeight: 700, color: task.successRate >= 95 ? "var(--status-active)" : task.successRate >= 80 ? "var(--status-paused)" : "var(--status-failed)" }}>
        {task.successRate}%
      </div>
      <div style={{ fontSize: "10px", color: "var(--text-tertiary)", marginTop: "2px" }}>
        {formatNumber(task.executions)} lần
      </div>
    </div>

    {/* Lần chạy */}
    <div>
      <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "3px" }}>{task.lastRun}</div>
      <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>Kế: {task.nextRun}</div>
    </div>

    {/* Actions */}
    <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
      <button
        className="btn-ghost"
        onClick={() => onToggle(task.id)}
        style={{ padding: "6px 12px", fontSize: "12px", color: task.status === "active" ? "var(--status-paused)" : "var(--status-active)", borderColor: task.status === "active" ? "rgba(245,158,11,0.3)" : "rgba(52,211,153,0.3)" }}
      >
        {task.status === "active" ? <Icons.Pause /> : <Icons.Play />}
        {task.status === "active" ? "Dừng" : "Chạy"}
      </button>
      {(task.status === "failed" || task.status === "paused") && (
        <button className="btn-ghost" onClick={() => onRestart(task.id)} style={{ padding: "6px 10px", fontSize: "12px" }}>
          <Icons.RefreshCw />
        </button>
      )}
    </div>
  </div>
);

// Task Card Component (Mobile) — hiển thị dạng thẻ thay vì bảng
const TaskCard: React.FC<{
  task: Task;
  onToggle: (id: string) => void;
  onRestart: (id: string) => void;
}> = ({ task, onToggle, onRestart }) => (
  <div
    className="task-card-mobile glass-card-sm"
    style={{ marginBottom: "8px", padding: "14px 16px" }}
  >
    {/* Header: ID + Badge + Actions */}
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px", gap: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <span className="mono" style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>{task.id}</span>
        <span className={`badge ${getStatusClass(task.status)}`}>{getStatusLabel(task.status)}</span>
      </div>
      <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
        <button
          className="btn-ghost"
          onClick={() => onToggle(task.id)}
          style={{ padding: "5px 10px", fontSize: "11px", color: task.status === "active" ? "var(--status-paused)" : "var(--status-active)", borderColor: task.status === "active" ? "rgba(245,158,11,0.3)" : "rgba(52,211,153,0.3)" }}
        >
          {task.status === "active" ? <Icons.Pause size={12} /> : <Icons.Play size={12} />}
        </button>
        {(task.status === "failed" || task.status === "paused") && (
          <button className="btn-ghost" onClick={() => onRestart(task.id)} style={{ padding: "5px 8px", fontSize: "11px" }}>
            <Icons.RefreshCw size={12} />
          </button>
        )}
      </div>
    </div>

    {/* Tên + Mô tả */}
    <div style={{ marginBottom: "12px" }}>
      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "3px" }}>{task.name}</div>
      <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{task.description}</div>
    </div>

    {/* Progress */}
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontSize: "11px", color: "var(--text-secondary)" }}>
        <span>Tiến độ</span>
        <span style={{ fontWeight: 600 }}>{task.progress}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${task.progress}%` }} />
      </div>
    </div>

    {/* Thống kê dòng dưới */}
    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
      <div>
        <div style={{ fontSize: "10px", color: "var(--text-tertiary)", marginBottom: "2px" }}>Thành công</div>
        <div style={{ fontSize: "13px", fontWeight: 700, color: task.successRate >= 95 ? "var(--status-active)" : task.successRate >= 80 ? "var(--status-paused)" : "var(--status-failed)" }}>
          {task.successRate}%
        </div>
      </div>
      <div>
        <div style={{ fontSize: "10px", color: "var(--text-tertiary)", marginBottom: "2px" }}>Thực thi</div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>{formatNumber(task.executions)}</div>
      </div>
      <div>
        <div style={{ fontSize: "10px", color: "var(--text-tertiary)", marginBottom: "2px" }}>Lần cuối</div>
        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{task.lastRun}</div>
      </div>
      <div>
        <div style={{ fontSize: "10px", color: "var(--text-tertiary)", marginBottom: "2px" }}>Target</div>
        <div className="mono" style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{task.target}</div>
      </div>
    </div>
  </div>
);

// ============================================================
// SECTION COMPONENTS — Nội dung từng mục sidebar
// ============================================================

// ── TỔNG QUAN ──────────────────────────────────────────────
const OverviewSection: React.FC<{ state: AppState; isMobile: boolean }> = ({ state, isMobile }) => {
  const active  = state.tasks.filter(t => t.status === "active").length;
  const failed  = state.tasks.filter(t => t.status === "failed").length;
  const paused  = state.tasks.filter(t => t.status === "paused").length;
  const queued  = state.tasks.filter(t => t.status === "queued").length;
  const avgSucc = (state.tasks.reduce((s, t) => s + t.successRate, 0) / state.tasks.length).toFixed(1);
  const totalEx = state.tasks.reduce((s, t) => s + t.executions, 0);

  const recentActivity = [
    { time: "Vừa xong",      text: "Auth Token Rotator hoàn thành chu kỳ #56430",     type: "success" },
    { time: "2 phút trước",  text: "Bypass Protocol Alpha tiến độ 87%",               type: "info" },
    { time: "5 phút trước",  text: "Rate Limit Evader kích hoạt lại sau giới hạn",    type: "warning" },
    { time: "12 phút trước", text: "Identity Cycler xoay vòng fingerprint mới",       type: "success" },
    { time: "1 giờ trước",   text: "Session Harvester bị tạm dừng thủ công",          type: "warning" },
    { time: "3 giờ trước",   text: "Captcha Resolver gặp lỗi — cần khôi phục",        type: "error" },
  ];

  const typeColor: Record<string, string> = {
    success: "var(--status-active)",
    info:    "var(--amethyst-400)",
    warning: "var(--status-paused)",
    error:   "var(--status-failed)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Stat cards nhỏ */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: "12px" }}>
        {[
          { label: "Đang chạy",  value: active, color: "var(--status-active)",  bg: "rgba(52,211,153,0.08)"  },
          { label: "Tạm dừng",   value: paused, color: "var(--status-paused)",  bg: "rgba(245,158,11,0.08)"  },
          { label: "Lỗi",        value: failed, color: "var(--status-failed)",  bg: "rgba(248,113,113,0.08)" },
          { label: "Xếp hàng",   value: queued, color: "var(--status-queued)",  bg: "rgba(96,165,250,0.08)"  },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: "16px 18px", background: s.bg, borderColor: s.color.replace(")", ",0.18)").replace("var(", "rgba(").replace("--status-active","52,211,153").replace("--status-paused","245,158,11").replace("--status-failed","248,113,113").replace("--status-queued","96,165,250") }}>
            <div style={{ fontSize: "28px", fontWeight: 700, color: s.color, fontFamily: "var(--app-font-serif)", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
        {/* Hiệu suất tổng */}
        <div className="glass-card" style={{ padding: "22px" }}>
          <h3 className="font-title" style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "18px" }}>Hiệu suất tổng thể</h3>
          {[
            { label: "Tỷ lệ thành công trung bình", value: avgSucc + "%", pct: parseFloat(avgSucc), color: "var(--mint-400)" },
            { label: "Tasks đang hoạt động",         value: `${active}/${state.tasks.length}`, pct: (active/state.tasks.length)*100, color: "var(--amethyst-400)" },
            { label: "Tổng lần thực thi",            value: formatNumber(totalEx), pct: 100, color: "var(--status-queued)" },
          ].map(m => (
            <div key={m.label} style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}>
                <span style={{ color: "var(--text-secondary)" }}>{m.label}</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{m.value}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.min(m.pct, 100)}%`, background: `linear-gradient(90deg, ${m.color}, ${m.color})` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Nhật ký hoạt động gần đây */}
        <div className="glass-card" style={{ padding: "22px" }}>
          <h3 className="font-title" style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "16px" }}>Hoạt động gần đây</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {recentActivity.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", padding: "10px 0", borderBottom: i < recentActivity.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: typeColor[item.type], marginTop: "5px", flexShrink: 0, boxShadow: item.type === "success" ? `0 0 6px ${typeColor[item.type]}` : "none" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12px", color: "var(--text-primary)", marginBottom: "2px", lineHeight: 1.4 }}>{item.text}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── PHÂN TÍCH ───────────────────────────────────────────────
const AnalyticsSection: React.FC<{ state: AppState; isMobile: boolean }> = ({ state, isMobile }) => {
  // Dữ liệu giả lập cho biểu đồ
  const hours = ["00","02","04","06","08","10","12","14","16","18","20","22"];
  const successData = [94,92,96,91,88,95,97,96,94,98,95,93];
  const execData    = [120,98,140,210,380,520,610,580,490,630,570,410];

  const maxExec = Math.max(...execData);
  const W = 100, H = 60;
  const toPoint = (data: number[], max: number) =>
    data.map((v, i) => ({ x: (i / (data.length - 1)) * W, y: H - (v / max) * (H - 6) - 3 }));

  const buildPath = (pts: {x:number;y:number}[]) =>
    pts.reduce((acc, p, i) => acc + (i === 0 ? `M${p.x},${p.y}` : ` L${p.x},${p.y}`), "");

  const succPts = toPoint(successData, 100);
  const execPts = toPoint(execData, maxExec);

  const taskPerf = state.tasks.map(t => ({
    name: t.name.length > 22 ? t.name.substring(0, 22) + "…" : t.name,
    rate: t.successRate,
    execs: t.executions,
  })).sort((a, b) => b.rate - a.rate);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
        {/* Biểu đồ tỷ lệ thành công theo giờ */}
        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ marginBottom: "14px" }}>
            <h3 className="font-title" style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Tỷ lệ thành công / 24h</h3>
            <p style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "3px" }}>Trung bình: {(successData.reduce((a,b)=>a+b,0)/successData.length).toFixed(1)}%</p>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "120px" }}>
            <defs>
              <linearGradient id="succGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--mint-400)" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="var(--mint-400)" stopOpacity="0.02"/>
              </linearGradient>
            </defs>
            <path d={buildPath(succPts) + ` L${succPts[succPts.length-1].x},${H} L0,${H} Z`} fill="url(#succGrad)"/>
            <path d={buildPath(succPts)} stroke="var(--mint-400)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            {succPts.map((p, i) => i % 3 === 0 && (
              <g key={i}>
                <line x1={p.x} y1={H} x2={p.x} y2={H-2} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
                <text x={p.x} y={H+8} textAnchor="middle" fontSize="3.5" fill="rgba(255,255,255,0.3)">{hours[i]}</text>
              </g>
            ))}
          </svg>
        </div>

        {/* Biểu đồ lượng thực thi theo giờ */}
        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ marginBottom: "14px" }}>
            <h3 className="font-title" style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Lượng thực thi / 24h</h3>
            <p style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "3px" }}>Đỉnh: {maxExec.toLocaleString()} lần/giờ</p>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "120px" }}>
            <defs>
              <linearGradient id="execGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--amethyst-400)" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="var(--amethyst-400)" stopOpacity="0.02"/>
              </linearGradient>
            </defs>
            <path d={buildPath(execPts) + ` L${execPts[execPts.length-1].x},${H} L0,${H} Z`} fill="url(#execGrad)"/>
            <path d={buildPath(execPts)} stroke="var(--amethyst-400)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            {execPts.map((p, i) => i % 3 === 0 && (
              <g key={i}>
                <line x1={p.x} y1={H} x2={p.x} y2={H-2} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
                <text x={p.x} y={H+8} textAnchor="middle" fontSize="3.5" fill="rgba(255,255,255,0.3)">{hours[i]}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Bảng xếp hạng hiệu suất task */}
      <div className="glass-card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
          <h3 className="font-title" style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Xếp hạng hiệu suất Task</h3>
          <p style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "3px" }}>Sắp xếp theo tỷ lệ thành công giảm dần</p>
        </div>
        {taskPerf.map((t, i) => (
          <div key={t.name} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 20px", borderBottom: i < taskPerf.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: i < 3 ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: i < 3 ? "var(--amethyst-300)" : "var(--text-tertiary)", flexShrink: 0 }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
              <div className="progress-bar" style={{ height: "3px" }}>
                <div className="progress-fill" style={{ width: `${t.rate}%`, background: t.rate >= 95 ? "linear-gradient(90deg,var(--mint-400),var(--mint-300))" : t.rate >= 80 ? "linear-gradient(90deg,#f59e0b,#fbbf24)" : "linear-gradient(90deg,var(--status-failed),#fca5a5)" }} />
              </div>
            </div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: t.rate >= 95 ? "var(--status-active)" : t.rate >= 80 ? "var(--status-paused)" : "var(--status-failed)", flexShrink: 0 }}>{t.rate}%</div>
            <div style={{ fontSize: "11px", color: "var(--text-tertiary)", flexShrink: 0, minWidth: "60px", textAlign: "right" }}>{formatNumber(t.execs)} lần</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── NHẬT KÝ HỆ THỐNG ───────────────────────────────────────
const MOCK_LOGS = [
  { ts: "11:34:22", level: "INFO",  source: "auth-token-rotator",     msg: "Token rotation cycle completed. Next: 5m" },
  { ts: "11:34:09", level: "INFO",  source: "bypass-alpha",           msg: "Progress checkpoint reached: 87/100 nodes processed" },
  { ts: "11:33:51", level: "WARN",  source: "rate-limit-evader",      msg: "Rate limit threshold 80% reached on proxy-mesh-11. Throttling." },
  { ts: "11:33:14", level: "INFO",  source: "proxy-chain-builder",    msg: "Chain rebuilt: 9 hops, latency avg 142ms" },
  { ts: "11:32:47", level: "INFO",  source: "identity-cycler",        msg: "Fingerprint rotated: UA=Chrome/124 OS=Win11 Resolution=1920x1080" },
  { ts: "11:31:05", level: "ERROR", source: "captcha-resolver",       msg: "Solver timeout after 30s. Retry limit exceeded. Task halted." },
  { ts: "11:29:33", level: "WARN",  source: "session-harvester",      msg: "Session pool below threshold: 12/50 active. Auto-pause triggered." },
  { ts: "11:28:10", level: "INFO",  source: "data-exfiltrator",       msg: "Task queued. Awaiting dependency: session-pool-04 ready state." },
  { ts: "11:26:44", level: "INFO",  source: "bypass-alpha",           msg: "Gateway handshake successful: gateway-node-07 responded in 88ms" },
  { ts: "11:25:20", level: "WARN",  source: "proxy-chain-builder",    msg: "Node proxy-farm-09 hop #3 latency spike: 820ms. Rerouting." },
  { ts: "11:24:01", level: "INFO",  source: "auth-token-rotator",     msg: "Token rotation cycle completed. Refreshed 128 tokens." },
  { ts: "11:22:39", level: "ERROR", source: "captcha-resolver",       msg: "External solver API returned 503. Falling back to local model." },
  { ts: "11:21:15", level: "INFO",  source: "system",                 msg: "Health check passed. All monitored services nominal." },
  { ts: "11:19:52", level: "INFO",  source: "rate-limit-evader",      msg: "Distribution strategy updated: Round-robin across 11 proxies." },
  { ts: "11:18:04", level: "WARN",  source: "identity-cycler",        msg: "Canvas fingerprint mismatch detected. Re-seeding entropy pool." },
  { ts: "11:15:33", level: "INFO",  source: "bypass-alpha",           msg: "Batch processed: 240 requests / 2min. Success rate 98.7%" },
  { ts: "11:12:17", level: "INFO",  source: "system",                 msg: "Scheduled maintenance window skipped. Uptime maintained." },
  { ts: "11:08:45", level: "ERROR", source: "captcha-resolver",       msg: "Vision model confidence below 0.6. Manual review flag raised." },
];

const LogsSection: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
  const [filter, setFilter] = useState<"ALL"|"INFO"|"WARN"|"ERROR">("ALL");
  const levelColor: Record<string, string> = { INFO: "var(--status-queued)", WARN: "var(--status-paused)", ERROR: "var(--status-failed)" };
  const levelBg:    Record<string, string> = { INFO: "rgba(96,165,250,0.10)", WARN: "rgba(245,158,11,0.10)", ERROR: "rgba(248,113,113,0.10)" };

  const filtered = MOCK_LOGS.filter(l => filter === "ALL" || l.level === filter);

  return (
    <div className="glass-card" style={{ overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h3 className="font-title" style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Nhật ký hệ thống</h3>
          <p style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "2px" }}>{filtered.length} bản ghi{filter !== "ALL" ? ` — lọc: ${filter}` : ""}</p>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {(["ALL","INFO","WARN","ERROR"] as const).map(lv => (
            <button key={lv} onClick={() => setFilter(lv)} style={{ padding: "5px 10px", fontSize: "11px", fontWeight: 600, border: "1px solid", borderRadius: "6px", cursor: "pointer", transition: "all var(--transition-fast)", background: filter === lv ? (lv === "ALL" ? "rgba(139,92,246,0.15)" : levelBg[lv]) : "transparent", borderColor: filter === lv ? (lv === "ALL" ? "rgba(139,92,246,0.35)" : levelColor[lv].replace(")", ",0.35)").replace("var(","rgba(").replace("--status-queued","96,165,250").replace("--status-paused","245,158,11").replace("--status-failed","248,113,113")) : "var(--border-subtle)", color: filter === lv ? (lv === "ALL" ? "var(--amethyst-300)" : levelColor[lv]) : "var(--text-tertiary)" }}>
              {lv}
            </button>
          ))}
        </div>
      </div>

      {/* Log entries */}
      <div style={{ maxHeight: isMobile ? "400px" : "520px", overflowY: "auto" }}>
        {filtered.map((log, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "10px 20px", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--app-font-mono)", fontSize: "12px", transition: "background var(--transition-fast)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.025)") }
            onMouseLeave={e => (e.currentTarget.style.background = "transparent") }
          >
            <span style={{ color: "var(--text-tertiary)", flexShrink: 0, fontSize: "11px" }}>{log.ts}</span>
            <span style={{ padding: "1px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em", background: levelBg[log.level], color: levelColor[log.level], flexShrink: 0, alignSelf: "center" }}>{log.level}</span>
            <span style={{ color: "var(--amethyst-300)", flexShrink: 0, fontSize: "11px" }}>[{log.source}]</span>
            <span style={{ color: "var(--text-secondary)", flex: 1, lineHeight: 1.5 }}>{log.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── CẤU HÌNH ───────────────────────────────────────────────
const SettingsSection: React.FC = () => {
  const [settings, setSettings] = useState({
    autoRestart:   true,
    notifications: true,
    darkMode:      true,
    rateLimit:     "500",
    retryCount:    "3",
    timeout:       "30",
    proxyRotation: "round-robin",
    logLevel:      "INFO",
  });

  const toggle = (key: keyof typeof settings) =>
    setSettings(s => ({ ...s, [key]: !s[key as keyof typeof settings] }));

  const ToggleSwitch: React.FC<{ on: boolean; onToggle: () => void }> = ({ on, onToggle }) => (
    <button onClick={onToggle} style={{ width: "40px", height: "22px", borderRadius: "11px", background: on ? "var(--amethyst-500)" : "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", position: "relative", transition: "background 0.25s", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: "3px", left: on ? "21px" : "3px", width: "16px", height: "16px", borderRadius: "50%", background: "#fff", transition: "left 0.25s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
    </button>
  );

  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="glass-card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
        <h3 className="font-title" style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{title}</h3>
      </div>
      <div style={{ padding: "4px 0" }}>{children}</div>
    </div>
  );

  const Row: React.FC<{ label: string; desc?: string; children: React.ReactNode }> = ({ label, desc, children }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)" }}
      style2={{ lastChild: { borderBottom: "none" } } as never}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{label}</div>
        {desc && <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "2px" }}>{desc}</div>}
      </div>
      {children}
    </div>
  );

  const SelectInput: React.FC<{ value: string; options: string[]; onChange: (v: string) => void }> = ({ value, options, onChange }) => (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-default)", borderRadius: "8px", color: "var(--text-primary)", padding: "7px 10px", fontSize: "12px", cursor: "pointer", outline: "none" }}>
      {options.map(o => <option key={o} value={o} style={{ background: "#141720" }}>{o}</option>)}
    </select>
  );

  const NumberInput: React.FC<{ value: string; onChange: (v: string) => void; suffix?: string }> = ({ value, onChange, suffix }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <input type="number" value={value} onChange={e => onChange(e.target.value)} className="input-glass" style={{ width: "80px", padding: "7px 10px", fontSize: "12px", textAlign: "center" }} />
      {suffix && <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{suffix}</span>}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "680px" }}>
      <Section title="Hành vi hệ thống">
        <Row label="Tự động khởi động lại" desc="Tự khởi động task khi gặp lỗi có thể phục hồi">
          <ToggleSwitch on={settings.autoRestart as unknown as boolean} onToggle={() => toggle("autoRestart")} />
        </Row>
        <Row label="Thông báo sự kiện" desc="Hiển thị toast khi có thay đổi trạng thái task">
          <ToggleSwitch on={settings.notifications as unknown as boolean} onToggle={() => toggle("notifications")} />
        </Row>
        <Row label="Số lần thử lại tối đa" desc="Số lần retry trước khi đánh dấu task thất bại">
          <NumberInput value={settings.retryCount} onChange={v => setSettings(s => ({...s, retryCount: v}))} suffix="lần" />
        </Row>
        <Row label="Timeout kết nối" desc="Thời gian chờ tối đa mỗi request">
          <NumberInput value={settings.timeout} onChange={v => setSettings(s => ({...s, timeout: v}))} suffix="giây" />
        </Row>
      </Section>

      <Section title="Giới hạn lưu lượng">
        <Row label="Rate limit" desc="Số request tối đa mỗi phút toàn hệ thống">
          <NumberInput value={settings.rateLimit} onChange={v => setSettings(s => ({...s, rateLimit: v}))} suffix="req/min" />
        </Row>
        <Row label="Chiến lược xoay proxy" desc="Thuật toán phân phối lưu lượng qua proxy pool">
          <SelectInput value={settings.proxyRotation} options={["round-robin", "random", "least-conn", "sticky"]} onChange={v => setSettings(s => ({...s, proxyRotation: v}))} />
        </Row>
      </Section>

      <Section title="Ghi nhật ký">
        <Row label="Mức độ log" desc="Chỉ ghi nhật ký từ mức này trở lên">
          <SelectInput value={settings.logLevel} options={["DEBUG","INFO","WARN","ERROR"]} onChange={v => setSettings(s => ({...s, logLevel: v}))} />
        </Row>
      </Section>

      <button className="btn-primary" style={{ width: "fit-content", padding: "10px 28px" }}>
        Lưu cấu hình
      </button>
    </div>
  );
};

// Dashboard tổng thể
const DashboardStage: React.FC<{
  state: AppState;
  visible: boolean;
  onNavChange: (nav: NavSection) => void;
  onToggleTask: (id: string) => void;
  onRestartTask: (id: string) => void;
  onLogout: () => void;
  onSearchChange: (q: string) => void;
  onFilterChange: (f: TaskStatus | "all") => void;
}> = ({
  state,
  visible,
  onNavChange,
  onToggleTask,
  onRestartTask,
  onLogout,
  onSearchChange,
  onFilterChange,
}) => {
  const TABLE_COLUMNS = "2.2fr 1fr 1.4fr 0.8fr 1fr 1fr";
  const { isMobile, isTablet } = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const sidebarWidth = 0;

  // Lọc tasks theo search + filter
  const filteredTasks = state.tasks.filter((t) => {
    const matchSearch =
      !state.searchQuery ||
      t.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      t.target.toLowerCase().includes(state.searchQuery.toLowerCase());
    const matchFilter =
      state.filterStatus === "all" || t.status === state.filterStatus;
    return matchSearch && matchFilter;
  });

  const filterButtons: { value: TaskStatus | "all"; label: string }[] = [
    { value: "all",    label: "Tất cả" },
    { value: "active", label: "Chạy" },
    { value: "paused", label: "Dừng" },
    { value: "failed", label: "Lỗi" },
    { value: "queued", label: "Hàng" },
  ];

  return (
    <div
      className={`stage-container ${visible ? "stage-enter" : "stage-exit"}`}
      style={{ zIndex: 10, alignItems: "flex-start", justifyContent: "flex-start", overflow: "hidden" }}
    >
      {/* Sidebar */}
      <Sidebar
        activeNav={state.activeNav}
        onNavChange={onNavChange}
        userData={state.userData}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
        isTablet={isTablet}
      />

      {/* Main content */}
      <main
        className="main-content-responsive"
        style={{
          marginLeft: `${sidebarWidth}px`,
          flex: 1,
          overflowY: "auto",
          height: "100vh",
          padding: isMobile ? "16px" : "28px 28px 28px 32px",
          transition: "margin-left 0.3s var(--ease-premium)",
        }}
      >
        {/* Header */}
        <div
          className="dashboard-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
            gap: "12px",
          }}
        >
          {/* Hamburger + Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            {/* Nút hamburger — chỉ hiện trên mobile */}
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Mở menu"
            >
              <HamburgerIcon />
            </button>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px", flexWrap: "wrap" }}>
                <h1
                  className="font-title"
                  style={{
                    fontSize: isMobile ? "17px" : "22px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.01em",
                    whiteSpace: "nowrap",
                  }}
                >
                  Data Telemetry Matrix
                </h1>
                <span className="tag-amethyst">LIVE</span>
              </div>
              {!isMobile && (
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Chào mừng trở lại,{" "}
                  <span style={{ color: "var(--amethyst-300)", fontWeight: 600 }}>
                    {state.userData.username}
                  </span>{" "}
                  — Hệ thống đang hoạt động bình thường.
                </p>
              )}
            </div>
          </div>

          {/* Status badge */}
          <div
            className="dashboard-header-right"
            style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}
          >
            <div
              className="glass-card-sm"
              style={{
                padding: isMobile ? "7px 10px" : "8px 14px",
                fontSize: "12px",
                color: "var(--status-active)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--status-active)",
                  boxShadow: "0 0 8px var(--status-active)",
                  animation: "pulseDot 2s ease-in-out infinite",
                  flexShrink: 0,
                }}
              />
              {isMobile ? "Online" : "Hệ thống hoạt động"}
            </div>
          </div>
        </div>

        {/* ── Section nội dung theo nav ── */}
        {state.activeNav === "overview" && (
          <OverviewSection state={state} isMobile={isMobile} />
        )}
        {state.activeNav === "analytics" && (
          <AnalyticsSection state={state} isMobile={isMobile} />
        )}
        {state.activeNav === "logs" && (
          <LogsSection isMobile={isMobile} />
        )}
        {state.activeNav === "settings" && (
          <SettingsSection />
        )}
        {state.activeNav === "tasks" && (<>

        {/* Stat Cards */}
        <div
          className="stats-grid"
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "repeat(2, 1fr)"
              : "repeat(auto-fit, minmax(200px, 1fr))",
            gap: isMobile ? "10px" : "16px",
            marginBottom: "20px",
          }}
        >
          {state.stats.map((stat) => (
            <div
              key={stat.id}
              className={`glass-card stat-card hover-lift ${stat.accent}`}
              style={{ padding: isMobile ? "14px 16px" : "20px 22px" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px", fontWeight: 600 }}>
                    {stat.label}
                  </div>
                  <div
                    className="font-title stat-value count-animate"
                    style={{ fontSize: isMobile ? "20px" : "26px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}
                  >
                    {stat.value}
                  </div>
                </div>
                <div
                  style={{
                    width: "34px", height: "34px", borderRadius: "10px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)",
                    color: stat.accent === "accent-amethyst" ? "var(--amethyst-400)" : stat.accent === "accent-mint" ? "var(--mint-400)" : stat.accent === "accent-amber" ? "#f59e0b" : "var(--status-queued)",
                    flexShrink: 0,
                  }}
                >
                  {stat.icon}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: stat.change >= 0 ? "var(--status-active)" : "var(--status-failed)" }}>
                  <Icons.TrendUp size={11} />
                  {stat.change >= 0 ? "+" : ""}{stat.change}%
                </div>
                {!isMobile && (
                  <div className="sparkline-wrapper">
                    <Sparkline data={stat.sparkline} color={stat.accent === "accent-amethyst" ? "var(--amethyst-400)" : stat.accent === "accent-mint" ? "var(--mint-400)" : "#f59e0b"} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Task Table / Card list */}
        <div className="glass-card" style={{ overflow: "hidden" }}>
          {/* Toolbar: title + search + filter */}
          <div
            className="table-toolbar"
            style={{
              padding: isMobile ? "14px 14px" : "18px 20px",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: isMobile ? "flex-start" : "center",
              gap: "10px",
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <div style={{ flex: "0 0 auto" }}>
              <h2 className="font-title" style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>
                Automation Tasks
              </h2>
              <p style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                {filteredTasks.length} / {state.tasks.length} nhiệm vụ
              </p>
            </div>

            <div
              className="table-toolbar-right"
              style={{ flex: 1, display: "flex", gap: "8px", alignItems: "center", justifyContent: isMobile ? "flex-start" : "flex-end", flexDirection: isMobile ? "column" : "row", width: isMobile ? "100%" : "auto" }}
            >
              {/* Search */}
              <div className="search-input-wrap" style={{ position: "relative", width: isMobile ? "100%" : "auto" }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }}>
                  <Icons.Search />
                </span>
                <input
                  className="input-glass"
                  type="search"
                  placeholder="Tìm task, ID, target..."
                  value={state.searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  style={{ paddingLeft: "36px", width: isMobile ? "100%" : "220px", padding: "8px 12px 8px 36px", fontSize: "12px" }}
                />
              </div>

              {/* Filter buttons */}
              <div
                className="filter-buttons"
                style={{ display: "flex", gap: "4px", overflowX: isMobile ? "auto" : "visible", width: isMobile ? "100%" : "auto", flexWrap: isMobile ? "nowrap" : "wrap" }}
              >
                {filterButtons.map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => onFilterChange(btn.value)}
                    style={{
                      padding: "7px 10px",
                      fontSize: "11px",
                      fontWeight: 600,
                      border: "1px solid",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      background: state.filterStatus === btn.value ? "rgba(139,92,246,0.15)" : "transparent",
                      borderColor: state.filterStatus === btn.value ? "rgba(139,92,246,0.35)" : "var(--border-subtle)",
                      color: state.filterStatus === btn.value ? "var(--amethyst-300)" : "var(--text-tertiary)",
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop: column headers */}
          {!isMobile && (
            <div
              className="table-col-header"
              style={{
                display: "grid",
                gridTemplateColumns: TABLE_COLUMNS,
                padding: "10px 20px",
                borderBottom: "1px solid var(--border-subtle)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
                gap: "12px",
              }}
            >
              <span>Task / Mô tả</span>
              <span>Target Node</span>
              <span>Tiến độ</span>
              <span style={{ textAlign: "center" }}>Tỷ lệ thành công</span>
              <span>Thời gian</span>
              <span style={{ textAlign: "right" }}>Hành động</span>
            </div>
          )}

          {/* Task list: Desktop rows / Mobile cards */}
          <div style={{ padding: isMobile ? "10px" : "0" }}>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) =>
                isMobile ? (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={onToggleTask}
                    onRestart={onRestartTask}
                  />
                ) : (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={onToggleTask}
                    onRestart={onRestartTask}
                    columns={TABLE_COLUMNS}
                  />
                )
              )
            ) : (
              <div style={{ padding: "48px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "13px" }}>
                <Icons.Search size={24} />
                <div style={{ marginTop: "12px" }}>Không tìm thấy task nào</div>
              </div>
            )}
          </div>
        </div>

        </>)}

        {/* Bottom spacer */}
        <div style={{ height: "32px" }} />
      </main>
    </div>
  );
};

// ============================================================
// ROOT APP — AppState Management
// ============================================================

export default function App() {
  // ──────────────────────────────
  // AppState — Trạng thái toàn cục
  // ──────────────────────────────
  const [state, setState] = useState<AppState>({
    stage: "welcome",
    isTransitioning: false,
    activeNav: "tasks",
    isLoading: false,
    userData: {
      username: "operator",
      role: "ADMIN",
      avatar: "",
      sessionId: generateId(),
    },
    tasks: SAMPLE_TASKS,
    stats: [],
    toasts: [],
    searchQuery: "",
    filterStatus: "all",
  });

  // Ref để tránh stale closure trong toast timeout
  const stateRef = useRef(state);
  stateRef.current = state;

  // ──────────────────────────────
  // Tính toán stats từ tasks
  // ──────────────────────────────
  const computeStats = useCallback((tasks: Task[]): StatCard[] => {
    const activeTasks   = tasks.filter((t) => t.status === "active").length;
    const failedTasks   = tasks.filter((t) => t.status === "failed").length;
    const avgSuccess    = tasks.reduce((s, t) => s + t.successRate, 0) / tasks.length;
    const totalExec     = tasks.reduce((s, t) => s + t.executions, 0);

    return [
      {
        id: "total",
        label: "Tổng nhiệm vụ",
        value: tasks.length,
        change: 12.5,
        accent: "accent-amethyst",
        icon: <Icons.Layers size={16} />,
        sparkline: [4, 6, 5, 8, 7, 8, tasks.length],
      },
      {
        id: "active",
        label: "Đang hoạt động",
        value: `${activeTasks} / ${tasks.length}`,
        change: 8.3,
        accent: "accent-mint",
        icon: <Icons.Activity size={16} />,
        sparkline: [2, 3, 4, 3, 5, 4, activeTasks],
      },
      {
        id: "success",
        label: "Tỷ lệ thành công",
        value: `${avgSuccess.toFixed(1)}%`,
        change: -1.2,
        accent: "accent-amber",
        icon: <Icons.TrendUp size={16} />,
        sparkline: [92, 94, 91, 95, 93, 96, Math.round(avgSuccess)],
      },
      {
        id: "executions",
        label: "Tổng lần thực thi",
        value: formatNumber(totalExec),
        change: 24.7,
        accent: "accent-blue",
        icon: <Icons.Cpu size={16} />,
        sparkline: [1200, 1800, 2200, 2100, 2800, 3200, totalExec / 10000],
      },
    ];
  }, []);

  // Cập nhật stats khi tasks thay đổi
  useEffect(() => {
    setState((prev) => ({ ...prev, stats: computeStats(prev.tasks) }));
  }, [computeStats]);

  // ──────────────────────────────
  // Toast System
  // ──────────────────────────────
  const addToast = useCallback(
    (type: ToastType, title: string, message: string, duration = 4000) => {
      const id = generateId();
      setState((prev) => ({
        ...prev,
        toasts: [...prev.toasts, { id, type, title, message, duration }],
      }));
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      toasts: prev.toasts.filter((t) => t.id !== id),
    }));
  }, []);

  // ──────────────────────────────
  // Stage Transitions
  // ──────────────────────────────
  const transitionTo = useCallback((nextStage: Stage, delay = 0) => {
    setState((prev) => ({ ...prev, isTransitioning: true }));
    setTimeout(() => {
      setState((prev) => ({ ...prev, stage: nextStage, isTransitioning: false }));
    }, delay || 500);
  }, []);

  // ──────────────────────────────
  // Handlers
  // ──────────────────────────────
  const handleEnterHub = useCallback(() => {
    transitionTo("auth");
  }, [transitionTo]);

  const handleLogin = useCallback(
    (username: string) => {
      setState((prev) => ({
        ...prev,
        userData: { ...prev.userData, username, sessionId: generateId() },
      }));
      transitionTo("dashboard", 300);
      setTimeout(() => {
        addToast("success", "Xác thực thành công", `Chào mừng ${username} — Phiên làm việc đã được thiết lập.`);
      }, 800);
      setTimeout(() => {
        addToast("info", "Hệ thống sẵn sàng", "3 tasks đang chạy, 1 task gặp lỗi cần xử lý.", 5000);
      }, 2000);
    },
    [transitionTo, addToast]
  );

  const handleLogout = useCallback(() => {
    addToast("info", "Đã đăng xuất", "Phiên làm việc đã kết thúc an toàn.");
    transitionTo("welcome");
  }, [transitionTo, addToast]);

  const handleNavChange = useCallback((nav: NavSection) => {
    setState((prev) => ({ ...prev, activeNav: nav }));
  }, []);

  const handleToggleTask = useCallback(
    (id: string) => {
      setState((prev) => {
        const updatedTasks = prev.tasks.map((t) => {
          if (t.id !== id) return t;
          const newStatus: TaskStatus =
            t.status === "active"
              ? "paused"
              : t.status === "paused" || t.status === "queued"
              ? "active"
              : t.status;
          return { ...t, status: newStatus };
        });
        return { ...prev, tasks: updatedTasks, stats: computeStats(updatedTasks) };
      });

      const task = stateRef.current.tasks.find((t) => t.id === id);
      if (task) {
        if (task.status === "active") {
          addToast("warning", "Task đã dừng", `${task.name} đã được tạm dừng.`);
        } else {
          addToast("success", "Task đang chạy", `${task.name} đã được kích hoạt.`);
        }
      }
    },
    [addToast, computeStats]
  );

  const handleRestartTask = useCallback(
    (id: string) => {
      setState((prev) => {
        const updatedTasks = prev.tasks.map((t) =>
          t.id === id ? { ...t, status: "active" as TaskStatus, progress: 0 } : t
        );
        return { ...prev, tasks: updatedTasks, stats: computeStats(updatedTasks) };
      });

      const task = stateRef.current.tasks.find((t) => t.id === id);
      if (task) {
        addToast("success", "Task đã khởi động lại", `${task.name} đang được khởi tạo lại.`);
      }
    },
    [addToast, computeStats]
  );

  const handleSearchChange = useCallback((q: string) => {
    setState((prev) => ({ ...prev, searchQuery: q }));
  }, []);

  const handleFilterChange = useCallback((f: TaskStatus | "all") => {
    setState((prev) => ({ ...prev, filterStatus: f }));
  }, []);

  // ──────────────────────────────
  // Simulated live updates
  // ──────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        const updatedTasks = prev.tasks.map((t) => {
          if (t.status !== "active") return t;
          const delta = Math.floor(Math.random() * 4) - 1; // -1 đến +3
          const newProgress = Math.min(100, Math.max(0, t.progress + delta));
          // Reset về 0 khi đạt 100%
          return {
            ...t,
            progress: newProgress >= 100 ? 0 : newProgress,
            executions: newProgress >= 100 ? t.executions + 1 : t.executions,
          };
        });
        return { ...prev, tasks: updatedTasks, stats: computeStats(updatedTasks) };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [computeStats]);

  // ──────────────────────────────
  // Render
  // ──────────────────────────────
  return (
    <>
      {/* Nền toàn trang */}
      <div className="bg-mesh" />
      <div className="bg-grid" />

      {/* Stage 1: Welcome */}
      <WelcomeStage
        onEnter={handleEnterHub}
        visible={state.stage === "welcome" && !state.isTransitioning}
      />

      {/* Stage 2: Auth */}
      {(state.stage === "auth" || (state.isTransitioning && state.stage === "dashboard")) && (
        <AuthStage
          onLogin={handleLogin}
          visible={state.stage === "auth" && !state.isTransitioning}
        />
      )}

      {/* Stage 3: Dashboard */}
      {(state.stage === "dashboard" || (state.isTransitioning && state.stage === "welcome")) && (
        <DashboardStage
          state={state}
          visible={state.stage === "dashboard" && !state.isTransitioning}
          onNavChange={handleNavChange}
          onToggleTask={handleToggleTask}
          onRestartTask={handleRestartTask}
          onLogout={handleLogout}
          onSearchChange={handleSearchChange}
          onFilterChange={handleFilterChange}
        />
      )}

      {/* Toast Container */}
      <div className="toast-container">
        {state.toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </>
  );
}
