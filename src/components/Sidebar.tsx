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
  ChevronRight,
  Sparkles,
  Zap,
  FileVideo,
  Shield
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
  },
  {
    id: "video-compressor",
    name: "Video Compressor",
    icon: FileVideo,
    description: "Reduce video file sizes"
  },
  {
    id: "jwt-tool",
    name: "JWT Toolkit",
    icon: Shield,
    description: "Complete JWT debugging & creation 📄✨"
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
      "relative overflow-hidden min-h-screen transition-all duration-700 ease-in-out",
      collapsed ? "min-w-[5rem] max-w-[5rem]" : "min-w-[18rem] max-w-[22rem] w-[20rem]"
    )}>
      {/* Animated background with multiple layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-purple-900/80 to-indigo-900/95 dark:from-slate-950/98 dark:via-purple-950/85 dark:to-indigo-950/98"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 via-transparent to-cyan-500/10"></div>
      <div className="absolute inset-0 backdrop-blur-xl"></div>
      
      {/* Animated sparkles */}
      <div className="absolute top-20 left-4 w-1 h-1 bg-pink-400 rounded-full animate-pulse opacity-60 float"></div>
      <div className="absolute top-32 right-6 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse opacity-70 animation-delay-1000 float"></div>
      <div className="absolute top-60 left-8 w-1 h-1 bg-purple-400 rounded-full animate-pulse opacity-50 animation-delay-2000 float"></div>
      <div className="absolute top-80 right-4 w-0.5 h-0.5 bg-yellow-400 rounded-full animate-pulse opacity-40 float"></div>
      <div className="absolute top-96 left-12 w-1 h-1 bg-green-400 rounded-full animate-pulse opacity-60 animation-delay-1000 float"></div>
      
      {/* Floating particles */}
      <div className="absolute top-40 left-2 w-px h-px bg-white rounded-full animate-ping opacity-30"></div>
      <div className="absolute top-72 right-2 w-px h-px bg-white rounded-full animate-ping opacity-20 animation-delay-2000"></div>
      
      {/* Glass effect border */}
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
      
      {/* Header section */}
      <div className="relative z-10 p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Sparkles className="h-6 w-6 text-pink-400 animate-pulse" />
                  <div className="absolute inset-0 h-6 w-6 text-pink-400 animate-ping opacity-20">
                    <Sparkles className="h-6 w-6" />
                  </div>
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
                  DevTools
                </h2>
              </div>
              <p className="text-sm text-slate-300/80 font-medium">
                ✨ Magical utilities
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="relative group flex-shrink-0 w-10 h-10 p-0 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {collapsed ? (
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-white transition-colors relative z-10" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-slate-300 group-hover:text-white transition-colors relative z-10" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="relative z-10 p-4 space-y-2">
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          
          return (
            <div
              key={tool.id}
              className="relative group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start relative overflow-hidden transition-all duration-500 group rounded-2xl min-h-[3.5rem] border backdrop-blur-sm",
                  collapsed ? "p-3" : "p-4",
                  isActive
                    ? "bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 border-pink-400/30 shadow-lg shadow-pink-500/20 scale-[1.02]"
                    : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10"
                )}
                onClick={() => onToolSelect?.(tool.id)}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-pink-400 to-cyan-400 rounded-r-full"></div>
                )}
                
                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Icon with enhanced effects */}
                <div className="relative flex-shrink-0">
                  <Icon className={cn(
                    "transition-all duration-500 group-hover:scale-110 relative z-10",
                    collapsed ? "h-6 w-6" : "h-5 w-5",
                    !collapsed && "mr-4",
                    isActive 
                      ? "text-pink-300 drop-shadow-lg" 
                      : "text-slate-300 group-hover:text-white group-hover:drop-shadow-lg"
                  )} />
                  {/* Icon glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-300">
                    <Icon className={cn(
                      "animate-pulse text-pink-400 blur-sm",
                      collapsed ? "h-6 w-6" : "h-5 w-5"
                    )} />
                  </div>
                </div>
                
                {/* Text content */}
                {!collapsed && (
                  <div className="flex-1 text-left space-y-1 min-w-0 relative z-10">
                    <div className={cn(
                      "text-sm font-semibold transition-colors tracking-tight truncate",
                      isActive ? "text-white" : "text-slate-200 group-hover:text-white"
                    )}>
                      {tool.name}
                    </div>
                    <div className={cn(
                      "text-xs transition-colors font-medium truncate leading-tight",
                      isActive ? "text-pink-200" : "text-slate-400 group-hover:text-slate-300"
                    )}>
                      {tool.description}
                    </div>
                  </div>
                )}
                
                {/* Active pulse effect */}
                {isActive && !collapsed && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Zap className="h-4 w-4 text-cyan-400 animate-pulse" />
                  </div>
                )}
              </Button>
            </div>
          );
        })}
      </nav>
      
      {/* Bottom magical decoration */}
      {!collapsed && (
        <div className="absolute bottom-6 left-6 right-6">
          <div className="h-px bg-gradient-to-r from-transparent via-pink-400/30 via-purple-400/30 via-cyan-400/30 to-transparent shimmer"></div>
          <div className="flex justify-center mt-3">
            <div className="flex items-center gap-1 text-xs text-slate-400/60 font-medium">
              <Sparkles className="h-3 w-3 text-pink-400/60 animate-pulse" />
              <span>Made with</span>
              <span className="text-pink-400/80">✨</span>
              <span>magic</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Ambient glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-cyan-500/5 blur-xl opacity-50 pointer-events-none"></div>
    </div>
  );
};