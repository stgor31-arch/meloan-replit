import { MobileLayout } from "@/components/layout";
import { useStore, translations } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ShieldCheck, UserCircle2, LogOut, ChevronRight, Info, X, Heart, MessageCircle, Loader2, Smartphone, Download } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

const STORIES = [
    { 
        id: 1, 
        title: "Как это работает?", 
        icon: <Info className="w-6 h-6" />, 
        color: "bg-blue-500",
        screens: [
            { title: "Простая регистрация", text: "Войдите через Google и получите доступ к предложениям." },
            { title: "Выбор условий", text: "Сравнивайте процентные ставки и сроки займов." },
            { title: "Быстрое получение", text: "Подпишите электронную расписку и получите средства." }
        ]
    },
    { 
        id: 2, 
        title: "Преимущества", 
        icon: <ShieldCheck className="w-6 h-6" />, 
        color: "bg-green-500",
        screens: [
            { title: "Без посредников", text: "Прямое взаимодействие между кредитором и заемщиком." },
            { title: "Гибкий график", text: "Возможность досрочного погашения с пересчетом процентов." },
            { title: "Юридическая чистота", text: "Автоматическая генерация расписок и договоров." }
        ]
    },
    { 
        id: 3, 
        title: "Безопасность", 
        icon: <UserCircle2 className="w-6 h-6" />, 
        color: "bg-purple-500",
        screens: [
            { title: "Защита данных", text: "Ваши паспортные данные зашифрованы и доступны только участникам сделки." },
            { title: "Рейтинг доверия", text: "Проверяйте историю и отзывы других пользователей." },
            { title: "Верификация", text: "Каждый участник проходит проверку личности." }
        ]
    },
    { 
        id: 4, 
        title: "Прозрачность", 
        icon: <Info className="w-6 h-6" />, 
        color: "bg-orange-500",
        screens: [
            { title: "История выплат", text: "Все платежи фиксируются в системе в режиме реального времени." },
            { title: "Честный расчет", text: "Использование стандартных формул аннуитета." },
            { title: "Уведомления", text: "Вы всегда будете знать о предстоящих и совершенных платежах." }
        ]
    },
    { 
        id: 5, 
        title: "Установить", 
        icon: <Download className="w-6 h-6" />, 
        color: "bg-teal-500",
        screens: [
            { title: "Сохраните на экран", text: "Meloan работает как полноценное приложение прямо с экрана вашего смартфона — без скачивания из App Store или Google Play." },
            { title: "iPhone (Safari)", text: "1. Откройте Meloan в Safari\n2. Нажмите кнопку «Поделиться» (квадрат со стрелкой вверх)\n3. Прокрутите вниз и выберите «На экран Домой»\n4. Нажмите «Добавить»" },
            { title: "Android (Chrome)", text: "1. Откройте Meloan в Chrome\n2. Нажмите три точки (меню) в правом верхнем углу\n3. Выберите «Добавить на главный экран» или «Установить приложение»\n4. Подтвердите установку" },
            { title: "Готово!", text: "Теперь Meloan всегда под рукой на главном экране. Вы будете получать push-уведомления о платежах и подтверждениях." }
        ]
    }
];

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { setCurrentUser, currentUserType, borrowerPhone, currentBorrowerLoanId } = useStore();
  const { user, isLoading, isAuthenticated } = useAuth();
  const t = translations;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedStory, setSelectedStory] = useState<typeof STORIES[0] | null>(null);
  const [currentScreen, setCurrentScreen] = useState(0);

  useEffect(() => {
    if (currentUserType === "borrower" && (borrowerPhone || currentBorrowerLoanId)) {
      setLocation("/borrower/dashboard");
    }
  }, []);

  const handleLender = () => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    setCurrentUser("master");
    setLocation("/master/dashboard");
  };

  const handleBorrower = () => {
    setCurrentUser("borrower");
    setLocation("/borrower/login");
  };

  const openStory = (story: typeof STORIES[0]) => {
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
                <p className="text-sm font-semibold text-gray-900">
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
                className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar snap-x"
            >
                {STORIES.map((story) => (
                    <motion.div 
                        key={story.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openStory(story)}
                        className="flex-shrink-0 w-28 h-40 rounded-2xl p-3 flex flex-col justify-between snap-start shadow-sm border border-border bg-white cursor-pointer"
                    >
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", story.color)}>
                            {story.icon}
                        </div>
                        <p className="text-xs font-bold leading-tight">{story.title}</p>
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
                className="fixed inset-0 z-[100] bg-white flex flex-col"
            >
                <div className="p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", selectedStory.color)}>
                            {selectedStory.icon}
                        </div>
                        <span className="font-bold">{selectedStory.title}</span>
                    </div>
                    <button onClick={closeStory} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="px-6 flex gap-1 h-1">
                    {selectedStory.screens.map((_, i) => (
                        <div key={i} className="flex-1 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div 
                                className={cn("h-full", selectedStory.color)}
                                initial={{ width: "0%" }}
                                animate={{ width: i <= currentScreen ? "100%" : "0%" }}
                            />
                        </div>
                    ))}
                </div>

                <div className="flex-1 relative overflow-hidden flex">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={currentScreen}
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            className="absolute inset-0 p-10 flex flex-col justify-center text-center space-y-6"
                        >
                            <h2 className="text-4xl font-display font-bold leading-tight">
                                {selectedStory.screens[currentScreen].title}
                            </h2>
                            <p className="text-xl text-muted-foreground leading-relaxed whitespace-pre-line text-left">
                                {selectedStory.screens[currentScreen].text}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    <div className="absolute inset-0 flex">
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

                <div className="p-8 border-t flex justify-between items-center">
                    <div className="flex gap-6">
                        <button className="flex items-center gap-2 text-muted-foreground hover:text-red-500 transition-colors">
                            <Heart className="w-6 h-6" />
                            <span className="text-sm font-bold">24</span>
                        </button>
                        <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                            <MessageCircle className="w-6 h-6" />
                            <span className="text-sm font-bold">12</span>
                        </button>
                    </div>
                    <Button onClick={closeStory} className="rounded-2xl px-8 font-bold">
                        Понятно
                    </Button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
