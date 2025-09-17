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
      "bg-sidebar border-r border-sidebar-border transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">Tools</h2>
            <p className="text-xs text-muted-foreground">Developer utilities</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      <nav className="p-4 space-y-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          
          return (
            <Button
              key={tool.id}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
                collapsed ? "px-2" : "px-3",
                isActive && "bg-sidebar-accent"
              )}
              onClick={() => onToolSelect?.(tool.id)}
            >
              <Icon className={cn("h-4 w-4", !collapsed && "mr-3")} />
              {!collapsed && (
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{tool.name}</div>
                  <div className="text-xs text-muted-foreground">{tool.description}</div>
                </div>
              )}
            </Button>
          );
        })}
      </nav>
    </div>
  );
};