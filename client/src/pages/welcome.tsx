import { MobileLayout } from "@/components/layout";
import { useStore, translations } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ShieldCheck, UserCircle2, LogOut, ChevronRight, X, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

interface StoryScreen {
  title: string;
  text: string;
  image: string;
}

interface Story {
  id: number;
  title: string;
  preview: string;
  gradient: string;
  gradientBg: string;
  screens: StoryScreen[];
}

const STORIES: Story[] = [
    {
        id: 1,
        title: "Установить",
        preview: "/stories/install-preview.png",
        gradient: "from-teal-400 to-cyan-500",
        gradientBg: "from-teal-500/90 to-cyan-600/90",
        screens: [
            { title: "📲 Сохраните на экран", text: "Meloan работает как полноценное приложение прямо с экрана вашего смартфона — без скачивания из App Store или Google Play. Быстрый доступ в одно касание!", image: "/stories/install-1.png" },
            { title: "🍎 iPhone (Safari)", text: "1. Откройте Meloan в Safari\n2. Нажмите кнопку «Поделиться» (квадрат со стрелкой вверх)\n3. Прокрутите вниз и выберите «На экран Домой»\n4. Нажмите «Добавить»", image: "/stories/install-2.png" },
            { title: "🤖 Android (Chrome)", text: "1. Откройте Meloan в Chrome\n2. Нажмите три точки (меню) в правом верхнем углу\n3. Выберите «Добавить на главный экран» или «Установить приложение»\n4. Подтвердите установку", image: "/stories/install-3.png" },
            { title: "🎉 Готово!", text: "Теперь Meloan всегда под рукой на главном экране. Вы будете получать push-уведомления о платежах и подтверждениях — ничего не пропустите!", image: "/stories/install-4.png" }
        ]
    },
    {
        id: 2,
        title: "Как это работает?",
        preview: "/stories/howto-preview.png",
        gradient: "from-blue-400 to-indigo-500",
        gradientBg: "from-blue-500/90 to-indigo-600/90",
        screens: [
            { title: "✨ Простая регистрация", text: "Войдите через Google, GitHub или Apple — и вы уже в системе. Никаких длинных анкет и ожидания подтверждения. Начните за 30 секунд!", image: "/stories/howto-1.png" },
            { title: "📊 Выбор условий", text: "Укажите сумму, срок и процентную ставку. Система автоматически рассчитает график платежей по формуле аннуитета — всё честно и прозрачно.", image: "/stories/howto-2.png" },
            { title: "✍️ Электронная расписка", text: "Заёмщик подписывает расписку прямо в приложении. Все условия фиксируются — сумма, ставка, срок, данные сторон.", image: "/stories/howto-3.png" },
            { title: "🤝 Сделка завершена", text: "После подписания обе стороны видят полный график платежей. Кредитор переводит средства, заёмщик отслеживает свои выплаты.", image: "/stories/howto-4.png" }
        ]
    },
    {
        id: 3,
        title: "Преимущества",
        preview: "/stories/benefits-preview.png",
        gradient: "from-green-400 to-emerald-500",
        gradientBg: "from-green-500/90 to-emerald-600/90",
        screens: [
            { title: "🔗 Без посредников", text: "Прямое взаимодействие между кредитором и заёмщиком. Никаких банков, комиссий и бюрократии. Вы сами устанавливаете условия.", image: "/stories/benefits-1.png" },
            { title: "📅 Гибкий график", text: "Возможность досрочного погашения с автоматическим пересчётом процентов. Переплатили — остаток уменьшится, а срок сократится.", image: "/stories/benefits-2.png" },
            { title: "📜 Юридическая чистота", text: "Автоматическая генерация расписок с указанием всех реквизитов. Каждая сделка задокументирована и доступна обеим сторонам.", image: "/stories/benefits-3.png" },
            { title: "💰 Выгодные условия", text: "Договаривайтесь напрямую — без скрытых комиссий и переплат. Помогите близким или заработайте на свободных средствах.", image: "/stories/benefits-4.png" }
        ]
    },
    {
        id: 4,
        title: "Безопасность",
        preview: "/stories/security-preview.png",
        gradient: "from-purple-400 to-violet-500",
        gradientBg: "from-purple-500/90 to-violet-600/90",
        screens: [
            { title: "🔒 Защита данных", text: "Ваши паспортные данные зашифрованы и доступны только участникам конкретной сделки. Мы не передаём информацию третьим лицам.", image: "/stories/security-1.png" },
            { title: "⭐ Рейтинг доверия", text: "После каждой сделки участники оценивают друг друга. Высокий рейтинг — знак надёжности и ответственности.", image: "/stories/security-2.png" },
            { title: "✅ Верификация", text: "Каждый кредитор проходит проверку личности через авторизацию. Данные паспорта фиксируются в профиле для безопасности сделок.", image: "/stories/security-3.png" }
        ]
    },
    {
        id: 5,
        title: "Прозрачность",
        preview: "/stories/transparency-preview.png",
        gradient: "from-orange-400 to-amber-500",
        gradientBg: "from-orange-500/90 to-amber-600/90",
        screens: [
            { title: "📋 История выплат", text: "Все платежи фиксируются в системе в режиме реального времени. Кредитор и заёмщик видят одну и ту же картину — никаких разногласий.", image: "/stories/transparency-1.png" },
            { title: "🧮 Честный расчёт", text: "Используем стандартную формулу аннуитета, как в банках. Разбивка на основной долг и проценты — полная прозрачность каждого платежа.", image: "/stories/transparency-2.png" },
            { title: "🔔 Уведомления", text: "Push-уведомления напомнят о предстоящем платеже за день. Кредитор получит сигнал о запросе, заёмщик — о подтверждении.", image: "/stories/transparency-3.png" }
        ]
    }
];

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { setCurrentUser, currentUserType, borrowerPhone, currentBorrowerLoanId } = useStore();
  const { user, isLoading, isAuthenticated } = useAuth();
  const t = translations;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentScreen, setCurrentScreen] = useState(0);

  useEffect(() => {
    if (currentUserType === "borrower" && (borrowerPhone || currentBorrowerLoanId)) {
      setLocation("/borrower/dashboard");
    }
  }, []);

  const handleLender = () => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    setCurrentUser("master");
    setLocation("/master/dashboard");
  };

  const handleBorrower = () => {
    setCurrentUser("borrower");
    setLocation("/borrower/login");
  };

  const openStory = (story: Story) => {
    setSelectedStory(story);
    setCurrentScreen(0);
  };

  const closeStory = () => {
    setSelectedStory(null);
  };

  return (
    <MobileLayout title="">
      <div className="flex flex-col space-y-8 pb-10">
        {isAuthenticated && user && (
          <div className="px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user.profileImageUrl && (
                <img src={user.profileImageUrl} alt="" className="w-10 h-10 rounded-full" />
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900" data-testid="text-username">
                  {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email || 'Пользователь'}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => { window.location.href = "/api/logout"; }}
              data-testid="button-logout"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
        )}

        <div className="relative pt-4">
            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto px-4 pb-4 no-scrollbar snap-x"
            >
                {STORIES.map((story) => (
                    <motion.div
                        key={story.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openStory(story)}
                        className="flex-shrink-0 snap-start cursor-pointer"
                        data-testid={`story-card-${story.id}`}
                    >
                        <div className={cn("w-[88px] h-[88px] rounded-full p-[3px] bg-gradient-to-br", story.gradient)}>
                            <div className="w-full h-full rounded-full border-[3px] border-white overflow-hidden">
                                <img
                                    src={story.preview}
                                    alt={story.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                        <p className="text-[11px] font-semibold leading-tight text-center mt-1.5 max-w-[88px] truncate">{story.title}</p>
                    </motion.div>
                ))}
            </div>
        </div>

        <div className="px-4 space-y-4">
            <div className="text-center space-y-1 mb-6">
                <h2 className="text-2xl font-display font-bold text-gray-900">Добро пожаловать</h2>
                <p className="text-muted-foreground text-sm">Выберите вашу роль в системе</p>
            </div>

            <Button
                onClick={handleLender}
                className="w-full h-20 rounded-3xl flex items-center justify-between px-6 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform group"
                data-testid="button-lender"
                disabled={isLoading}
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
                    </div>
                    <div className="text-left">
                        <span className="block text-xl font-semibold leading-tight">{t.lender}</span>
                        <span className="block text-[11px] text-white/70 mt-1">
                          {isAuthenticated ? "Создайте и управляйте займами" : "Войдите, чтобы создавать займы"}
                        </span>
                    </div>
                </div>
                <ChevronRight className="w-6 h-6 opacity-50 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
                variant="outline"
                onClick={handleBorrower}
                className="w-full h-20 rounded-3xl flex items-center justify-between px-6 border-2 hover:bg-gray-50 hover:scale-[1.02] transition-transform group"
                data-testid="button-borrower"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <UserCircle2 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-left">
                        <span className="block text-xl font-semibold leading-tight text-gray-900">{t.borrower}</span>
                        <span className="block text-[11px] text-muted-foreground mt-1">Подтвердите и отслеживайте свой заем</span>
                    </div>
                </div>
                <ChevronRight className="w-6 h-6 opacity-20 group-hover:translate-x-1 transition-transform" />
            </Button>
        </div>

        <div className="px-6 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
                Meloan — это безопасная платформа для частных займов. Мы помогаем структурировать отношения между кредитором и заемщиком.
            </p>
        </div>
      </div>

      <AnimatePresence>
        {selectedStory && (
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 100 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 100 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
            >
                <div className={cn("absolute inset-0 bg-gradient-to-b", selectedStory.gradientBg)} />
                <div className="absolute inset-0 bg-black/20" />

                <div className="relative z-10 flex flex-col h-full">
                    <div className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/50">
                                <img src={selectedStory.preview} alt="" className="w-full h-full object-cover" />
                            </div>
                            <span className="font-bold text-white text-sm">{selectedStory.title}</span>
                        </div>
                        <button
                            onClick={closeStory}
                            className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                            data-testid="button-close-story"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    <div className="px-4 flex gap-1 h-[3px]">
                        {selectedStory.screens.map((_, i) => (
                            <div key={i} className="flex-1 bg-white/30 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-white rounded-full"
                                    initial={{ width: "0%" }}
                                    animate={{ width: i <= currentScreen ? "100%" : "0%" }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 relative overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentScreen}
                                initial={{ x: 300, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -300, opacity: 0 }}
                                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                                className="absolute inset-0 flex flex-col"
                            >
                                <div className="flex-1 flex items-center justify-center p-6 pt-4">
                                    <motion.img
                                        src={selectedStory.screens[currentScreen].image}
                                        alt=""
                                        className="w-full max-w-[280px] max-h-[45vh] object-contain rounded-3xl shadow-2xl"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.1, duration: 0.4 }}
                                    />
                                </div>

                                <div className="px-6 pb-6 space-y-3">
                                    <motion.h2
                                        className="text-2xl font-display font-bold leading-tight text-white"
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.15 }}
                                    >
                                        {selectedStory.screens[currentScreen].title}
                                    </motion.h2>
                                    <motion.p
                                        className="text-[15px] text-white/85 leading-relaxed whitespace-pre-line"
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        {selectedStory.screens[currentScreen].text}
                                    </motion.p>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        <div className="absolute inset-0 flex z-20">
                            <div
                                className="w-1/3 h-full cursor-pointer"
                                onClick={() => setCurrentScreen(prev => Math.max(0, prev - 1))}
                            />
                            <div
                                className="w-2/3 h-full cursor-pointer"
                                onClick={() => {
                                    if (currentScreen < selectedStory.screens.length - 1) {
                                        setCurrentScreen(prev => prev + 1);
                                    } else {
                                        closeStory();
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div className="p-4 pb-6 flex justify-center">
                        <Button
                            onClick={closeStory}
                            className="rounded-2xl px-10 py-3 font-bold bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30"
                            data-testid="button-close-story-bottom"
                        >
                            Понятно
                        </Button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
