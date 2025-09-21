import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
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
  Image,
  Shield,
  Scissors,
  Images,
  Wand2,
  Search,
  ChevronDown,
  ChevronUp,
  Database,
  FileCode,
  Palette,
  Play,
  FileDiff
} from "lucide-react";

interface Tool {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  path: string;
}

interface ToolCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  tools: Tool[];
}

const toolCategories: ToolCategory[] = [
  {
    id: "encoding",
    name: "Encoding & Decoding",
    icon: Key,
    color: "from-blue-500 to-cyan-500",
    tools: [
      {
        id: "base64",
        name: "Base64 Encode/Decode",
        icon: Key,
        description: "Base64 encoding and decoding",
        path: "/base64"
      },
      {
        id: "url-encode",
        name: "URL Encode/Decode",
        icon: Shuffle,
        description: "URL encoding and decoding",
        path: "/url-encode"
      }
    ]
  },
  {
    id: "json",
    name: "JSON Tools",
    icon: Database,
    color: "from-green-500 to-emerald-500",
    tools: [
      {
        id: "json-viewer",
        name: "JSON Viewer",
        icon: Code2,
        description: "Format and view JSON data",
        path: "/json-viewer"
      },
      {
        id: "json-compare",
        name: "JSON Compare",
        icon: FileText,
        description: "Compare multiple JSON objects",
        path: "/json-compare"
      }
    ]
  },
  {
    id: "text",
    name: "Text Tools",
    icon: FileCode,
    color: "from-purple-500 to-violet-500",
    tools: [
      {
        id: "text-case",
        name: "Text Case Converter",
        icon: Type,
        description: "Convert text cases",
        path: "/text-case"
      },
      {
        id: "hash",
        name: "Hash Generator",
        icon: Hash,
        description: "Generate MD5, SHA-256 hashes",
        path: "/hash"
      },
      {
        id: "word-compare",
        name: "Word Compare",
        icon: FileDiff,
        description: "Compare multiple Word documents",
        path: "/word-compare"
      },
      {
        id: "text-compare",
        name: "Text Compare",
        icon: FileDiff,
        description: "Compare text documents line by line",
        path: "/text-compare"
      }
    ]
  },
  {
    id: "media",
    name: "Media Tools",
    icon: Play,
    color: "from-orange-500 to-red-500",
    tools: [
      {
        id: "image-compressor",
        name: "Image Compressor",
        icon: Image,
        description: "Compress images with quality control",
        path: "/image-compressor"
      },
      {
        id: "image-size-converter",
        name: "Image Size Converter",
        icon: Scissors,
        description: "Crop & resize to passport, visa formats",
        path: "/image-size-converter"
      },
      {
        id: "video-compressor",
        name: "Video Compressor",
        icon: FileVideo,
        description: "Reduce video file sizes",
        path: "/video-compressor"
      },
      {
        id: "photo-compare",
        name: "Photo Compare",
        icon: Images,
        description: "Compare images and detect differences",
        path: "/photo-compare"
      },
      {
        id: "video-compare",
        name: "Video Compare",
        icon: FileVideo,
        description: "Compare videos frame by frame",
        path: "/video-compare"
      },
      {
        id: "video-transform",
        name: "Video Transform",
        icon: Wand2,
        description: "Create technically different but visually similar videos",
        path: "/video-transform"
      }
    ]
  },
  {
    id: "security",
    name: "Security Tools",
    icon: Shield,
    color: "from-pink-500 to-rose-500",
    tools: [
      {
        id: "jwt-tool",
        name: "JWT Toolkit",
        icon: Shield,
        description: "Complete JWT debugging & creation 📄✨",
        path: "/jwt-tool"
      }
    ]
  }
];

interface SidebarProps {
  activeTool?: string;
  onToolSelect?: (toolId: string) => void;
}

export const Sidebar = ({ activeTool, onToolSelect }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(toolCategories.map(cat => cat.id)) // Show all categories expanded by default
  );
  const location = useLocation();

  // Filter tools based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return toolCategories;
    }

    const query = searchQuery.toLowerCase();
    return toolCategories.map(category => ({
      ...category,
      tools: category.tools.filter(tool => 
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query)
      )
    })).filter(category => category.tools.length > 0);
  }, [searchQuery]);

  // Auto-expand categories when searching
  useMemo(() => {
    if (searchQuery.trim()) {
      setExpandedCategories(new Set(filteredCategories.map(cat => cat.id)));
    } else {
      // When search is cleared, restore default expanded state (all categories)
      setExpandedCategories(new Set(toolCategories.map(cat => cat.id)));
    }
  }, [searchQuery, filteredCategories]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

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
        <div className="flex items-center justify-between mb-4">
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

        {/* Search bar */}
        {!collapsed && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/20 text-slate-200 placeholder:text-slate-400 focus:border-pink-400/50 focus:ring-pink-400/20"
            />
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="relative z-10 p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-300px)]">
        {filteredCategories.map((category, categoryIndex) => {
          const CategoryIcon = category.icon;
          const isExpanded = expandedCategories.has(category.id);
          
          return (
            <div key={category.id} className="space-y-2">
              {/* Category Header */}
              {!collapsed && (
                <Button
                  variant="ghost"
                  onClick={() => toggleCategory(category.id)}
                  className="w-full justify-between p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-1.5 rounded-lg bg-gradient-to-r",
                      category.color,
                      "bg-opacity-20"
                    )}>
                      <CategoryIcon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-slate-200 group-hover:text-white">
                      {category.name}
                    </span>
                    <span className="text-xs text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">
                      {category.tools.length}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
                  )}
                </Button>
              )}

              {/* Category Tools */}
              {(isExpanded || collapsed) && (
                <div className="space-y-1 ml-2">
                  {category.tools.map((tool, toolIndex) => {
                    const Icon = tool.icon;
                    const isActive = activeTool === tool.id || location.pathname === tool.path;
                    
                    return (
                      <div
                        key={tool.id}
                        className="relative group"
                        style={{ animationDelay: `${(categoryIndex * 100) + (toolIndex * 50)}ms` }}
                      >
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start relative overflow-hidden transition-all duration-500 group rounded-xl min-h-[3rem] border backdrop-blur-sm",
                            collapsed ? "p-3" : "p-3",
                            isActive
                              ? "bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 border-pink-400/30 shadow-lg shadow-pink-500/20 scale-[1.02]"
                              : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10"
                          )}
                          asChild
                        >
                          <Link to={tool.path}>
                            {/* Active indicator */}
                            {isActive && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-pink-400 to-cyan-400 rounded-r-full"></div>
                            )}
                            
                            {/* Hover glow effect */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            {/* Icon with enhanced effects */}
                            <div className="relative flex-shrink-0">
                              <Icon className={cn(
                                "transition-all duration-500 group-hover:scale-110 relative z-10",
                                collapsed ? "h-5 w-5" : "h-4 w-4",
                                !collapsed && "mr-3",
                                isActive 
                                  ? "text-pink-300 drop-shadow-lg" 
                                  : "text-slate-300 group-hover:text-white group-hover:drop-shadow-lg"
                              )} />
                              {/* Icon glow */}
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-300">
                                <Icon className={cn(
                                  "animate-pulse text-pink-400 blur-sm",
                                  collapsed ? "h-5 w-5" : "h-4 w-4"
                                )} />
                              </div>
                            </div>
                            
                            {/* Text content */}
                            {!collapsed && (
                              <div className="flex-1 text-left space-y-0.5 min-w-0 relative z-10">
                                <div className={cn(
                                  "text-sm font-medium transition-colors tracking-tight truncate",
                                  isActive ? "text-white" : "text-slate-200 group-hover:text-white"
                                )}>
                                  {tool.name}
                                </div>
                                <div className={cn(
                                  "text-xs transition-colors font-normal truncate leading-tight",
                                  isActive ? "text-pink-200" : "text-slate-400 group-hover:text-slate-300"
                                )}>
                                  {tool.description}
                                </div>
                              </div>
                            )}
                            
                            {/* Active pulse effect */}
                            {isActive && !collapsed && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Zap className="h-3 w-3 text-cyan-400 animate-pulse" />
                              </div>
                            )}
                          </Link>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* No results message */}
        {searchQuery.trim() && filteredCategories.length === 0 && !collapsed && (
          <div className="text-center py-8">
            <Search className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No tools found</p>
            <p className="text-xs text-slate-500 mt-1">Try a different search term</p>
          </div>
        )}
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
