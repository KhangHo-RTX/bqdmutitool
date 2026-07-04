import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import { ToastContainer, useToast } from "./components/Toast";
import Home from "./pages/Home";
import AuthPage from "./pages/Auth";
import Launch from "./pages/Launch";
import Status from "./pages/Status";
import Account from "./pages/Account";
import { getSession, clearSession } from "./lib/auth";

export type Page = "home" | "auth" | "launch" | "status" | "account";

const PROTECTED: Page[] = ["launch", "status", "account"];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getSession());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingPage, setPendingPage] = useState<Page>("launch");
  const isMobile = useIsMobile();
  const { toasts, addToast, removeToast } = useToast();

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    addToast("Đăng nhập thành công! Chào mừng trở lại 👋");
    setPage(pendingPage ?? "launch");
  };

  const handleLogout = () => {
    clearSession();
    setIsLoggedIn(false);
    setPage("home");
    addToast("Đã đăng xuất thành công.");
  };

  const handleNavigate = (p: Page) => {
    if (PROTECTED.includes(p) && !getSession()) {
      setPendingPage(p);
      setPage("auth");
      return;
    }
    setPage(p);
  };

  const handleOpenLogin = () => {
    setPendingPage("launch");
    setPage("auth");
  };

  const showSidebar = page !== "auth";
  const sidebarPage: Page = page === "auth" ? "home" : page;

  const pageContent: Record<Page, React.ReactNode> = {
    home: (
      <Home
        isLoggedIn={isLoggedIn}
        onOpenLogin={handleOpenLogin}
        onNavigate={handleNavigate}
      />
    ),
    auth: (
      <AuthPage
        onSuccess={handleLoginSuccess}
        onBack={() => setPage("home")}
        initialMode="login"
      />
    ),
    launch: <Launch onNavigate={handleNavigate} />,
    status: <Status />,
    account: <Account onLogout={handleLogout} />,
  };

  return (
    <>
      <div className="cosmic-bg" />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          minHeight: "100vh",
        }}
      >
        {/* Sidebar */}
        {showSidebar && (
          <Sidebar
            currentPage={sidebarPage}
            onNavigate={handleNavigate}
            isOpen={isMobile ? sidebarOpen : true}
            onClose={() => setSidebarOpen(false)}
            isMobile={isMobile}
          />
        )}

        {/* Right column */}
        <div
          style={{
            flex: 1,
            marginLeft: showSidebar && !isMobile ? 240 : 0,
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
          }}
        >
          {/* Mobile top bar */}
          {showSidebar && isMobile && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 18px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(6,6,8,0.88)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                position: "sticky",
                top: 0,
                zIndex: 20,
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => setSidebarOpen(true)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "rgba(255,255,255,0.7)",
                  cursor: "pointer",
                }}
              >
                <Menu size={18} />
              </button>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                BQD MUI
              </span>
            </div>
          )}

          {/* Page content — flex:1 so footer sticks to bottom */}
          <main
            style={{
              flex: 1,
              padding:
                page === "auth"
                  ? "0"
                  : isMobile
                  ? "20px 16px"
                  : "32px 32px",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              >
                {pageContent[page]}
              </motion.div>
            </AnimatePresence>
          </main>

          {showSidebar && <Footer />}
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
