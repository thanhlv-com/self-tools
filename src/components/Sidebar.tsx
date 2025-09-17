import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Code2, 
  FileText, 
  Hash, 
  Key, 
  Shuffle, 
  Type,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface Tool {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const tools: Tool[] = [
  {
    id: "json-viewer",
    name: "JSON Viewer",
    icon: Code2,
    description: "Format and view JSON data"
  },
  {
    id: "json-compare",
    name: "JSON Compare",
    icon: FileText,
    description: "Compare multiple JSON objects"
  },
  {
    id: "base64",
    name: "Base64 Encode/Decode",
    icon: Key,
    description: "Base64 encoding and decoding"
  },
  {
    id: "url-encode",
    name: "URL Encode/Decode",
    icon: Shuffle,
    description: "URL encoding and decoding"
  },
  {
    id: "hash",
    name: "Hash Generator",
    icon: Hash,
    description: "Generate MD5, SHA-256 hashes"
  },
  {
    id: "text-case",
    name: "Text Case Converter",
    icon: Type,
    description: "Convert text cases"
  }
];

interface SidebarProps {
  activeTool?: string;
  onToolSelect?: (toolId: string) => void;
}

export const Sidebar = ({ activeTool = "json-viewer", onToolSelect }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "bg-gradient-sidebar border-r border-sidebar-border/30 transition-all duration-500 backdrop-blur-xl shadow-float dark:shadow-float-dark relative overflow-hidden",
      collapsed ? "w-16" : "w-72"
    )}>
      <div className="absolute inset-0 bg-gradient-glass opacity-30"></div>
      <div className="flex items-center justify-between p-6 border-b border-sidebar-border/30 relative z-10">
        {!collapsed && (
          <div className="space-y-1">
            <h2 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent tracking-tight">Tools</h2>
            <p className="text-sm text-muted-foreground font-medium">Developer utilities</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent/80 hover:shadow-glow transition-all duration-300 backdrop-blur-sm border border-border/20 rounded-lg"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      <nav className="p-6 space-y-3 relative z-10">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          
          return (
            <Button
              key={tool.id}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/60 hover:shadow-md hover:scale-[1.02] transition-all duration-300 group backdrop-blur-sm border border-transparent hover:border-border/20 rounded-xl",
                collapsed ? "px-3 py-3" : "px-4 py-4",
                isActive && "bg-gradient-primary text-primary-foreground shadow-glow border-border/30 scale-[1.02]"
              )}
              onClick={() => onToolSelect?.(tool.id)}
            >
              <Icon className={cn(
                "h-5 w-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3", 
                !collapsed && "mr-4",
                isActive && "text-primary-foreground scale-110"
              )} />
              {!collapsed && (
                <div className="flex-1 text-left space-y-1">
                  <div className={cn(
                    "text-sm font-semibold transition-colors tracking-tight",
                    isActive ? "text-primary-foreground" : "text-sidebar-foreground"
                  )}>{tool.name}</div>
                  <div className={cn(
                    "text-xs transition-colors font-medium",
                    isActive ? "text-primary-foreground/90" : "text-muted-foreground"
                  )}>{tool.description}</div>
                </div>
              )}
            </Button>
          );
        })}
      </nav>
    </div>
  );
};