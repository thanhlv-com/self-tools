import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border bg-card/50 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">Developer Tools</h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">Personal collection of developer utilities</p>
        </header>
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
};