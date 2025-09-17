import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export const ThemeToggle = () => {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
        <div className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-9 w-9 p-0 hover:bg-accent hover:shadow-md transition-all duration-200"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-foreground transition-transform hover:scale-110" />
      ) : (
        <Moon className="h-4 w-4 text-foreground transition-transform hover:scale-110" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};