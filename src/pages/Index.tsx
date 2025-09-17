import { useState } from "react";
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

  return (
    <div className="flex min-h-screen bg-background">
      <div className="w-64 bg-sidebar border-r border-sidebar-border">
        <div className="p-4 border-b border-sidebar-border">
          <h2 className="text-lg font-semibold text-sidebar-foreground">Developer Tools</h2>
          <p className="text-xs text-muted-foreground">Personal utilities collection</p>
        </div>
        
        <nav className="p-4 space-y-2">
          {[
            { id: "json-viewer", name: "JSON Viewer", desc: "Format and view JSON" },
            { id: "json-compare", name: "JSON Compare", desc: "Compare JSON objects" },
            { id: "base64", name: "Base64 Tool", desc: "Encode/decode Base64" },
            { id: "url-encode", name: "URL Tool", desc: "Encode/decode URLs" },
            { id: "hash", name: "Hash Generator", desc: "Generate hashes" },
            { id: "text-case", name: "Text Cases", desc: "Convert text cases" }
          ].map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`w-full p-3 text-left rounded-lg transition-colors ${
                activeTool === tool.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <div className="font-medium text-sm">{tool.name}</div>
              <div className="text-xs text-muted-foreground">{tool.desc}</div>
            </button>
          ))}
        </nav>
      </div>
      
      <main className="flex-1 flex flex-col">
        <header className="border-b border-border bg-card/50 px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground">
            {[
              { id: "json-viewer", name: "JSON Viewer & Formatter" },
              { id: "json-compare", name: "JSON Comparison Tool" },
              { id: "base64", name: "Base64 Encoder/Decoder" },
              { id: "url-encode", name: "URL Encoder/Decoder" },
              { id: "hash", name: "Hash Generator" },
              { id: "text-case", name: "Text Case Converter" }
            ].find(tool => tool.id === activeTool)?.name || "Developer Tools"}
          </h1>
          <p className="text-sm text-muted-foreground">Client-side developer utilities</p>
        </header>
        <div className="flex-1 p-6">
          {renderTool()}
        </div>
      </main>
    </div>
  );
};

export default Index;
