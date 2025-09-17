import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

interface PageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  activeTool?: string;
}

export const PageLayout = ({ title, description = "Powerful client-side developer utilities ✨", children, activeTool }: PageLayoutProps) => {
  return (
    <div className="flex min-h-screen">
      <div className="animate-slide-in-left">
        <Sidebar activeTool={activeTool} />
      </div>
      
      <main className="flex-1 flex flex-col animate-slide-in-right">
        <header className="border-b border-border/30 bg-gradient-card px-6 py-8 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-glass opacity-50"></div>
          <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2 tracking-tight">
                {title}
              </h1>
              <p className="text-muted-foreground text-lg font-medium">{description}</p>
            </div>
            <div className="bg-gradient-glass backdrop-blur-sm border border-border/20 rounded-xl p-2 shadow-glass dark:shadow-glass-dark">
              <ThemeToggle />
            </div>
          </div>
        </header>
        
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-card rounded-2xl border border-border/30 shadow-float dark:shadow-float-dark backdrop-blur-xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-glass opacity-20"></div>
              <div className="relative z-10">
                {children}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};