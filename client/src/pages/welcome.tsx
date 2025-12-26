import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore, translations } from "@/lib/store";
import { Globe } from "lucide-react";

export default function Welcome() {
  const { setCurrentUser, language, setLanguage } = useStore();
  const [, setLocation] = useLocation();
  const t = translations[language];

  const handleRoleSelect = (role: "master" | "borrower") => {
    setCurrentUser(role);
    if (role === "master") {
      setLocation("/master/dashboard");
    } else {
      setLocation("/borrower/login");
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "ru" ? "en" : "ru");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-green-50 p-4 relative">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={toggleLanguage} 
        className="absolute top-6 right-6 gap-2 rounded-full bg-white/50 backdrop-blur-md"
      >
        <Globe className="h-4 w-4" />
        <span className="uppercase">{language}</span>
      </Button>

      <Card className="w-full max-w-md border-none shadow-xl bg-white/80 backdrop-blur-xl overflow-hidden">
        <CardContent className="p-8 flex flex-col items-center text-center space-y-8">
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-24 h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center p-4 rotate-3">
              <img 
                src="/attached_assets/LOGO_MELOAN_1766736656113.png" 
                alt="Meloan" 
                className="w-full h-full object-contain" 
                onError={(e) => {
                    (e.target as any).src = "https://placehold.co/100x100?text=ML";
                }}
              />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">{t.meloan}</h1>
              <p className="text-muted-foreground mt-2 text-lg">{t.simple_lending}</p>
            </div>
          </motion.div>

          <div className="grid gap-4 w-full">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <Button 
                size="lg" 
                className="w-full h-14 text-lg font-medium bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-2xl"
                onClick={() => handleRoleSelect("master")}
              >
                {t.lender}
              </Button>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full h-14 text-lg font-medium border-2 hover:bg-accent rounded-2xl"
                onClick={() => handleRoleSelect("borrower")}
              >
                {t.borrower}
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
