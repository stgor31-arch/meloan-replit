import { useEffect, useCallback, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string>("");
  const [botId, setBotId] = useState<string>("");

  useEffect(() => {
    if (user && !isLoading) {
      navigate("/master/dashboard");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    fetch("/api/telegram-bot-info")
      .then((r) => r.json())
      .then((data) => {
        setBotUsername(data.username);
        setBotId(data.botId);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      if (e.origin !== "https://oauth.telegram.org") return;

      try {
        const data = JSON.parse(e.data);
        if (!data?.id || !data?.hash) return;

        setTelegramLoading(true);
        setError(null);

        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Ошибка авторизации");
        }
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        navigate("/master/dashboard");
      } catch (err: any) {
        setError(err.message);
        setTelegramLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate]);

  const handleTelegramLogin = useCallback(() => {
    if (!botId) return;

    const origin = window.location.origin;
    const authUrl = `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${encodeURIComponent(origin)}&embed=0&request_access=write&return_to=${encodeURIComponent(origin + "/login")}`;

    const width = 550;
    const height = 470;
    const left = Math.max(0, (window.screen.width - width) / 2);
    const top = Math.max(0, (window.screen.height - height) / 2);

    window.open(
      authUrl,
      "telegram_auth",
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=no,resizable=no`
    );
  }, [botId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tgAuthResult = params.get("tgAuthResult");
    if (tgAuthResult) {
      try {
        const decoded = JSON.parse(atob(tgAuthResult));
        if (decoded?.id && decoded?.hash) {
          setTelegramLoading(true);
          setError(null);

          fetch("/api/auth/telegram", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(decoded),
          })
            .then(async (res) => {
              if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Ошибка авторизации");
              }
              await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
              navigate("/master/dashboard");
            })
            .catch((err: any) => {
              setError(err.message);
              setTelegramLoading(false);
            });

          window.history.replaceState({}, "", "/login");
        }
      } catch {
      }
    }
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-slate-50 to-blue-50"
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        <button
          onClick={() => navigate("/")}
          className="self-start flex items-center gap-1 text-slate-500 hover:text-slate-700 transition-colors -mb-2"
          data-testid="link-back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Назад</span>
        </button>

        <div className="flex flex-col items-center gap-3">
          <img
            src="/logo-shield.png"
            alt="Meloan"
            className="w-20 h-20"
            data-testid="img-logo"
          />
          <h1
            className="text-3xl font-bold"
            style={{ color: "#3B9FD9" }}
            data-testid="text-app-name"
          >
            Meloan
          </h1>
          <p className="text-slate-500 text-center text-sm" data-testid="text-login-subtitle">
            Войдите, чтобы создавать и управлять займами
          </p>
        </div>

        <div className="w-full flex flex-col items-center gap-4 mt-2">
          <Button
            className="w-full h-12 text-sm font-medium text-white"
            style={{ backgroundColor: "#54a9eb" }}
            onClick={handleTelegramLogin}
            disabled={!botId || telegramLoading}
            data-testid="button-telegram-login"
          >
            <Send className="w-5 h-5 mr-2" />
            Войти через Telegram
          </Button>

          {telegramLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              Вход через Telegram...
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 text-center" data-testid="text-error">
              {error}
            </p>
          )}

          <div className="w-full flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 uppercase">или</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <Button
            variant="outline"
            className="w-full h-12 text-sm font-medium border-slate-200 hover:bg-slate-50"
            onClick={() => {
              window.location.href = "/api/login";
            }}
            data-testid="button-replit-login"
          >
            Войти через Google / GitHub / Apple
          </Button>
        </div>

        <p className="text-xs text-slate-400 text-center mt-4 px-4" data-testid="text-privacy">
          Продолжая, вы соглашаетесь с условиями использования сервиса
        </p>
      </div>
    </motion.div>
  );
}
