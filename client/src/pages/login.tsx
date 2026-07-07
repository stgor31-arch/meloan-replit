import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !isLoading) {
      navigate("/master/dashboard");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (!err) return;

    window.history.replaceState({}, "", "/login");

    if (err.startsWith("yandex")) {
      setError("Не удалось войти через Яндекс. Попробуйте ещё раз.");
    } else {
      setError("Ошибка авторизации. Попробуйте ещё раз.");
    }
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

          {error && (
            <p className="text-sm text-red-500 text-center" data-testid="text-error">
              {error}
            </p>
          )}
        </div>

        <p className="text-xs text-slate-400 text-center mt-4 px-4" data-testid="text-privacy">
          Продолжая, вы соглашаетесь с условиями использования сервиса
        </p>
      </div>
    </motion.div>
  );
}
