import { useEffect, useRef } from "react";
import { apiFetch } from "../api";
import { io } from "socket.io-client";

export function useProctoring({ attemptId, enableScreenShare = true }) {
  const isExamRunningRef = useRef(true);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!attemptId) return;
    socketRef.current = io(import.meta.env.VITE_API_BASE || "http://localhost:5000", {
      path: "/socket.io"
    });

    const handleVisibility = () => {
      if (document.hidden) {
        logEvent("TAB_SWITCH", { reason: "document_hidden" });
      }
    };

    const handleBlur = () => {
      logEvent("TAB_SWITCH", { reason: "window_blur" });
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logEvent("FULLSCREEN_EXIT", {});
        alert("You exited fullscreen. Please return or your test may be flagged.");
      }
    };

    const handleKeyDown = (e) => {
      const forbidden = [
        "F12",
        "F5",
        "PrintScreen"
      ];
      const combo = `${e.ctrlKey ? "Ctrl+" : ""}${e.shiftKey ? "Shift+" : ""}${e.key}`;
      const devToolCombos = ["Ctrl+Shift+I", "Ctrl+Shift+J", "Ctrl+Shift+C", "Ctrl+Shift+K"];

      if (forbidden.includes(e.key) || devToolCombos.includes(combo)) {
        e.preventDefault();
        logEvent("DEVTOOLS_ATTEMPT", { key: e.key, combo });
      }

      if (e.ctrlKey && ["c", "v", "p", "s"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        logEvent("FORBIDDEN_SHORTCUT", { combo });
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);

    // request fullscreen at start
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    async function startScreenShare() {
      if (!enableScreenShare || !navigator.mediaDevices?.getDisplayMedia) return;
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        // For simplicity we only capture screenshots periodically from the canvas or rely on backend
        // Here: just log that sharing started.
        logEvent("SCREEN_SHARE_STARTED", {});
      } catch (err) {
        console.warn("Screen share refused", err);
      }
    }
    startScreenShare();

    const screenshotInterval = setInterval(() => {
      if (!isExamRunningRef.current) return;
      // In a real app, capture canvas or screenshot. Here: fake URL.
      apiFetch("/proctor/screenshot", {
        method: "POST",
        body: JSON.stringify({
          attempt_id: attemptId,
          screenshot_url: "https://example.com/fake-screenshot.jpg"
        })
      }).catch(() => {});
    }, 60000); // 60s

    function logEvent(event_type, event_details) {
      apiFetch("/proctor/events", {
        method: "POST",
        body: JSON.stringify({
          attempt_id: attemptId,
          event_type,
          event_details
        })
      }).catch(() => {});
    }

    return () => {
      isExamRunningRef.current = false;
      clearInterval(screenshotInterval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [attemptId, enableScreenShare]);
}
