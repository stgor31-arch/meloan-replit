import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";

export default function Welcome() {
  const { setCurrentUser } = useStore();
  const [, setLocation] = useLocation();

  const handleRoleSelect = (role: "master" | "borrower") => {
    setCurrentUser(role);
    if (role === "master") {
      setLocation("/master/dashboard");
    } else {
      // For demo purposes, we'll redirect to the dashboard directly if they choose borrower
      // In real flow, they would come via invite link
      setLocation("/borrower/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-green-50 p-4">
      <Card className="w-full max-w-md border-none shadow-xl bg-white/80 backdrop-blur-xl overflow-hidden">
        <CardContent className="p-8 flex flex-col items-center text-center space-y-8">
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-24 h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center p-4 rotate-3">
              <img src="/attached_assets/LOGO_MELOAN_1766736656113.png" alt="Meloan" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">meloan</h1>
              <p className="text-muted-foreground mt-2 text-lg">Private lending made simple.</p>
            </div>
          </motion.div>

          <div className="grid gap-4 w-full">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Button 
                size="lg" 
                className="w-full h-14 text-lg font-medium bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-2xl"
                onClick={() => handleRoleSelect("master")}
              >
                I am a Lender (Master)
              </Button>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full h-14 text-lg font-medium border-2 hover:bg-accent rounded-2xl"
                onClick={() => handleRoleSelect("borrower")}
              >
                I am a Borrower
              </Button>
            </motion.div>
          </div>

          <p className="text-xs text-muted-foreground mt-8">
            Secure, transparent, and easy to use.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
