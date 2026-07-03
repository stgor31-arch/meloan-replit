import { useEffect, useCallback, useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

async function processTelegramAuth(tgAuthResult: string): Promise<boolean> {
  try {
    const decoded = JSON.parse(atob(tgAuthResult));
    if (!decoded?.id || !decoded?.hash) return false;

    const res = await fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(decoded),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [botId, setBotId] = useState<string>("");
  const [providers, setProviders] = useState<{ yandex: boolean; vk: boolean }>({ yandex: false, vk: false });
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (user && !isLoading) {
      navigate("/master/dashboard");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    fetch("/api/telegram-bot-info")
      .then((r) => r.json())
      .then((data) => setBotId(data.botId))
      .catch(() => {});
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((data) => setProviders({ yandex: !!data.yandex, vk: !!data.vk }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (!err) return;

    window.history.replaceState({}, "", "/login");

    if (err.startsWith("yandex")) {
      setError("Не удалось войти через Яндекс. Попробуйте ещё раз.");
    } else if (err.startsWith("vk")) {
      setError("Не удалось войти через VK. Попробуйте ещё раз.");
    } else {
      setError("Ошибка авторизации. Попробуйте ещё раз.");
    }
  }, []);

  useEffect(() => {
    let tgAuthResult: string | null = null;

    const params = new URLSearchParams(window.location.search);
    tgAuthResult = params.get("tgAuthResult");

    if (!tgAuthResult && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      tgAuthResult = hashParams.get("tgAuthResult");
    }

    if (!tgAuthResult) return;

    window.history.replaceState({}, "", "/login");

    if (window.opener) {
      processTelegramAuth(tgAuthResult).then((ok) => {
        window.opener.postMessage(
          { type: "telegram_auth_done", success: ok },
          window.location.origin
        );
        window.close();
      });
    } else {
      setTelegramLoading(true);
      processTelegramAuth(tgAuthResult).then(async (ok) => {
        if (ok) {
          await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          navigate("/master/dashboard");
        } else {
          setError("Ошибка авторизации через Telegram");
          setTelegramLoading(false);
        }
      });
    }
  }, [navigate]);

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type !== "telegram_auth_done") return;

      if (e.data.success) {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        navigate("/master/dashboard");
      } else {
        setError("Ошибка авторизации через Telegram");
        setTelegramLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate]);

  const handleTelegramLogin = useCallback(() => {
    if (!botId) return;

    setTelegramLoading(true);
    setError(null);

    const origin = window.location.origin;
    const returnTo = origin + "/login";
    const authUrl = `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${encodeURIComponent(origin)}&embed=0&request_access=write&return_to=${encodeURIComponent(returnTo)}`;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = authUrl;
    } else {
      const width = 550;
      const height = 470;
      const left = Math.max(0, (window.screen.width - width) / 2);
      const top = Math.max(0, (window.screen.height - height) / 2);

      const popup = window.open(
        authUrl,
        "telegram_auth",
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=no,resizable=no`
      );

      if (pollTimer.current) clearInterval(pollTimer.current);
      pollTimer.current = setInterval(() => {
        if (popup && popup.closed) {
          if (pollTimer.current) clearInterval(pollTimer.current);
          setTelegramLoading(false);
        }
      }, 500);
    }
  }, [botId]);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

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
            {telegramLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Вход через Telegram...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Войти через Telegram
              </>
            )}
          </Button>

          {error && (
            <p className="text-sm text-red-500 text-center" data-testid="text-error">
              {error}
            </p>
          )}

          {(providers.yandex || providers.vk) && (
            <div className="w-full flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 uppercase">или</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          )}

          {providers.yandex && (
            <Button
              className="w-full h-12 text-sm font-medium text-white hover:opacity-90"
              style={{ backgroundColor: "#FC3F1D" }}
              onClick={() => {
                window.location.href = "/api/auth/yandex";
              }}
              data-testid="button-yandex-login"
            >
              <span className="w-5 h-5 mr-2 rounded-full bg-white text-[#FC3F1D] flex items-center justify-center font-bold text-sm leading-none">
                Я
              </span>
              Войти с Яндекс ID
            </Button>
          )}

          {providers.vk && (
            <Button
              className="w-full h-12 text-sm font-medium text-white hover:opacity-90"
              style={{ backgroundColor: "#0077FF" }}
              onClick={() => {
                window.location.href = "/api/auth/vk";
              }}
              data-testid="button-vk-login"
            >
              <span className="w-5 h-5 mr-2 rounded-md bg-white text-[#0077FF] flex items-center justify-center font-bold text-xs leading-none">
                VK
              </span>
              Войти через VK ID
            </Button>
          )}
        </div>

        <p className="text-xs text-slate-400 text-center mt-4 px-4" data-testid="text-privacy">
          Продолжая, вы соглашаетесь с условиями использования сервиса
        </p>
      </div>
    </motion.div>
  );
}
