import { MobileLayout } from "@/components/layout";
import { useStore, translations } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ShieldCheck, UserCircle2, LogOut, ChevronRight, Info, X, Heart, MessageCircle } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Mock stories for the carousel
const STORIES = [
    { 
        id: 1, 
        title: "Как это работает?", 
        icon: <Info className="w-6 h-6" />, 
        color: "bg-blue-500",
        screens: [
            { title: "Простая регистрация", text: "Введите свой номер телефона и получите доступ к предложениям." },
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
    }
];

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { setCurrentUser, currentUserType } = useStore();
  const t = translations;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedStory, setSelectedStory] = useState<typeof STORIES[0] | null>(null);
  const [currentScreen, setCurrentScreen] = useState(0);

  const handleLender = () => {
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
        {/* Stories Carousel */}
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

        {/* Action Buttons */}
        <div className="px-4 space-y-4">
            <div className="text-center space-y-1 mb-6">
                <h2 className="text-2xl font-display font-bold text-gray-900">Добро пожаловать</h2>
                <p className="text-muted-foreground text-sm">Выберите вашу роль в системе</p>
            </div>

            <Button 
                onClick={handleLender}
                className="w-full h-20 rounded-3xl flex items-center justify-between px-6 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform group"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <span className="block text-xl font-semibold leading-tight">{t.lender}</span>
                        <span className="block text-[11px] text-white/70 mt-1">Создайте и управляйте займами</span>
                    </div>
                </div>
                <ChevronRight className="w-6 h-6 opacity-50 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button 
                variant="outline"
                onClick={handleBorrower}
                className="w-full h-20 rounded-3xl flex items-center justify-between px-6 border-2 hover:bg-gray-50 hover:scale-[1.02] transition-transform group"
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

      {/* Story Modal */}
      <AnimatePresence>
        {selectedStory && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 100 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 100 }}
                className="fixed inset-0 z-[100] bg-white flex flex-col"
            >
                {/* Header */}
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

                {/* Progress Bars */}
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

                {/* Content */}
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
                            <p className="text-xl text-muted-foreground leading-relaxed">
                                {selectedStory.screens[currentScreen].text}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    {/* Touch Areas for Navigation */}
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

                {/* Footer */}
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
