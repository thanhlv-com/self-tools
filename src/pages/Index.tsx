import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";
import { JsonViewer } from "@/components/tools/JsonViewer";
import { JsonCompare } from "@/components/tools/JsonCompare";
import { Base64Tool } from "@/components/tools/Base64Tool";
import { UrlEncodeTool } from "@/components/tools/UrlEncodeTool";
import { HashGenerator } from "@/components/tools/HashGenerator";
import { TextCaseConverter } from "@/components/tools/TextCaseConverter";

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
      "text-case": "Text Case Converter"
    };
    return titles[activeTool as keyof typeof titles] || "Developer Tools";
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar activeTool={activeTool} onToolSelect={setActiveTool} />
      
      <main className="flex-1 flex flex-col">
        <header className="border-b border-border bg-gradient-card px-6 py-6 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              {getToolTitle()}
            </h1>
            <p className="text-muted-foreground">Powerful client-side developer utilities</p>
          </div>
        </header>
        
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-card rounded-xl border border-border/50 shadow-elegant backdrop-blur-sm p-6">
              {renderTool()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
