import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "Tool này có an toàn cho tài khoản Discord không?",
    a: "Hệ thống sử dụng cơ chế bảo mật nghiêm ngặt và không lưu trữ Token của bạn lên database công khai, đảm bảo an toàn tuyệt đối.",
  },
  {
    q: "Làm sao để lấy Token Discord chuẩn xác?",
    a: "Bạn có thể đăng nhập Discord trên trình duyệt, mở Developer Tools (F12) -> Application -> Local Storage để lấy Token, hoặc sử dụng tiện ích mở rộng hỗ trợ.",
  },
  {
    q: "Có thể chạy nhiều tài khoản cùng lúc không?",
    a: "Hoàn toàn được! Bạn hãy vào mục 'Khởi chạy', chọn tab 'Nhiều tài khoản' và dán danh sách Token của bạn vào, hệ thống sẽ tự động phân luồng.",
  },
  {
    q: "Nếu tôi tắt trình duyệt thì nhiệm vụ có bị dừng không?",
    a: "Không. Khi trạng thái báo 'ĐANG CHẠY' ở mục Status, nhiệm vụ đã được đẩy lên server. Bạn có thể tắt trình duyệt và quay lại kiểm tra bất cứ lúc nào.",
  },
];

function FAQItem({ item, index }: { item: typeof FAQ_ITEMS[0]; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.4 }}
    >
      <div
        style={{
          background: open
            ? "rgba(124,58,237,0.07)"
            : "rgba(255,255,255,0.03)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: `1px solid ${open ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 14,
          overflow: "hidden",
          transition: "background 0.25s, border-color 0.25s",
          boxShadow: open ? "0 0 20px rgba(124,58,237,0.08)" : "none",
        }}
      >
        <button
          onClick={() => setOpen(!open)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            padding: "16px 20px",
            background: "none",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: open ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.75)",
              lineHeight: 1.4,
              transition: "color 0.2s",
            }}
          >
            {item.q}
          </span>
          <motion.span
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 8,
              background: open
                ? "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(59,130,246,0.2))"
                : "rgba(255,255,255,0.06)",
              border: `1px solid ${open ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.08)"}`,
              color: open ? "#a78bfa" : "rgba(255,255,255,0.4)",
              transition: "background 0.25s, border-color 0.25s",
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: "hidden" }}
            >
              <div
                style={{
                  padding: "0 20px 18px",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  paddingTop: 14,
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.55)",
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {item.a}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function FAQ() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.5 }}
      style={{ width: "100%", maxWidth: 680, margin: "0 auto" }}
    >
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <span
          style={{
            display: "inline-block",
            padding: "4px 14px",
            borderRadius: 99,
            background: "rgba(124,58,237,0.12)",
            border: "1px solid rgba(124,58,237,0.25)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: "#a78bfa",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          FAQ
        </span>
        <h2
          style={{
            fontSize: "clamp(18px, 3vw, 24px)",
            fontWeight: 700,
            color: "rgba(255,255,255,0.9)",
            margin: 0,
          }}
        >
          Câu hỏi thường gặp
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {FAQ_ITEMS.map((item, i) => (
          <FAQItem key={i} item={item} index={i} />
        ))}
      </div>
    </motion.div>
  );
}
