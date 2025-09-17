import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { JsonViewer } from "@/components/tools/JsonViewer";
import { JsonCompare } from "@/components/tools/JsonCompare";
import { Base64Tool } from "@/components/tools/Base64Tool";
import { UrlEncodeTool } from "@/components/tools/UrlEncodeTool";
import { HashGenerator } from "@/components/tools/HashGenerator";
import { TextCaseConverter } from "@/components/tools/TextCaseConverter";
import { VideoCompressor } from "@/components/tools/VideoCompressor";
import { JwtTool } from "@/components/tools/JwtTool";

const Index = () => {
  const [activeTool, setActiveTool] = useState("json-viewer");

  const renderTool = () => {
    switch (activeTool) {
      case "json-viewer":
        return <JsonViewer />;
      case "json-compare":
        return <JsonCompare />;
      case "base64":
        return <Base64Tool />;
      case "url-encode":
        return <UrlEncodeTool />;
      case "hash":
        return <HashGenerator />;
      case "text-case":
        return <TextCaseConverter />;
      case "video-compressor":
        return <VideoCompressor />;
      case "jwt-tool":
        return <JwtTool />;
      default:
        return <JsonViewer />;
    }
  };

  const getToolTitle = () => {
    const titles = {
      "json-viewer": "JSON Viewer & Formatter",
      "json-compare": "JSON Comparison Tool", 
      "base64": "Base64 Encoder/Decoder",
      "url-encode": "URL Encoder/Decoder", 
      "hash": "Hash Generator",
      "text-case": "Text Case Converter",
      "video-compressor": "Video Compressor",
      "jwt-tool": "JWT Toolkit 📄✨"
    };
    return titles[activeTool as keyof typeof titles] || "Developer Tools";
  };

  return (
    <div className="flex min-h-screen">
      <div className="animate-slide-in-left">
        <Sidebar activeTool={activeTool} onToolSelect={setActiveTool} />
      </div>
      
      <main className="flex-1 flex flex-col animate-slide-in-right">
        <header className="border-b border-border/30 bg-gradient-card px-6 py-8 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-glass opacity-50"></div>
          <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2 tracking-tight">
                {getToolTitle()}
              </h1>
              <p className="text-muted-foreground text-lg font-medium">Powerful client-side developer utilities ✨</p>
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
                {renderTool()}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
