import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <header className="border-b border-border bg-card/50 px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground">Developer Tools</h1>
          <p className="text-sm text-muted-foreground">Personal collection of developer utilities</p>
        </header>
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  );
};