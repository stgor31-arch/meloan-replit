import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, PlusCircle, User, LogOut } from "lucide-react";
import { useStore } from "@/lib/store";

export function MobileLayout({ children, title, showBack = false }: { children: React.ReactNode, title?: string, showBack?: boolean }) {
  const [location] = useLocation();
  const isMaster = location.startsWith("/master");
  const { setCurrentUser } = useStore();

  return (
    <div className="min-h-screen bg-muted/30 flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen shadow-2xl relative flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <img src="/attached_assets/LOGO_MELOAN_1766736656113.png" alt="Meloan" className="h-8 w-auto" />
             {title && <h1 className="font-display font-semibold text-lg text-foreground">{title}</h1>}
          </div>
          {isMaster && (
             <div className="flex items-center gap-2">
                <Link href="/" onClick={() => setCurrentUser(null)}>
                  <LogOut className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
                </Link>
             </div>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 p-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </main>

        {/* Bottom Nav - Only for Master Dashboard Area */}
        {isMaster && (
          <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border p-2 max-w-md mx-auto">
            <div className="grid grid-cols-3 gap-1">
              <NavItem href="/master/dashboard" icon={LayoutDashboard} label="Loans" active={location === "/master/dashboard"} />
              <NavItem href="/master/create" icon={PlusCircle} label="New Loan" active={location === "/master/create"} />
              <NavItem href="/master/profile" icon={User} label="Profile" active={location === "/master/profile"} />
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}

function NavItem({ href, icon: Icon, label, active }: { href: string, icon: any, label: string, active: boolean }) {
  return (
    <Link href={href}>
      <div className={cn(
        "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 cursor-pointer",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
      )}>
        <Icon className={cn("h-6 w-6 mb-1", active && "fill-current")} strokeWidth={active ? 2.5 : 2} />
        <span className="text-[10px] font-medium">{label}</span>
      </div>
    </Link>
  );
}
