import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export const JsonViewer = () => {
  const [input, setInput] = useState("");
  const [formatted, setFormatted] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const { toast } = useToast();

  const formatJson = () => {
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);
      setFormatted(formatted);
      setIsValid(true);
    } catch (error) {
      setIsValid(false);
      toast({
        variant: "destructive",
        title: "Invalid JSON",
        description: "Please check your JSON syntax",
      });
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setFormatted(minified);
      setIsValid(true);
    } catch (error) {
      setIsValid(false);
      toast({
        variant: "destructive",
        title: "Invalid JSON",
        description: "Please check your JSON syntax",
      });
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(formatted);
    toast({
      title: "Copied!",
      description: "JSON copied to clipboard",
    });
  };

  const downloadJson = () => {
    const blob = new Blob([formatted], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatted.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setInput(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent tracking-tight">JSON Viewer & Formatter</h2>
        <p className="text-muted-foreground text-lg font-medium">Format, validate, and beautify JSON data with style ✨</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-gradient-card border border-border/30 shadow-glass dark:shadow-glass-dark backdrop-blur-sm relative overflow-hidden animate-fade-in">
          <div className="absolute inset-0 bg-gradient-glass opacity-20"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center justify-between text-lg font-bold">
              Input JSON
              <div className="flex gap-3">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("file-upload")?.click()}
                  className="backdrop-blur-sm border-border/30 hover:bg-accent/60 transition-all duration-300 hover:scale-105"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                {isValid !== null && (
                  <Badge 
                    variant={isValid ? "secondary" : "destructive"}
                    className={cn(
                      "backdrop-blur-sm font-semibold transition-all duration-300",
                      isValid ? "bg-success/20 text-success border-success/30" : "bg-destructive/20 text-destructive border-destructive/30"
                    )}
                  >
                    {isValid ? "✓ Valid" : "✗ Invalid"}
                  </Badge>
                )}
              </div>
            </CardTitle>
            <CardDescription className="text-base font-medium">Paste or upload your JSON data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='{"name": "example", "value": 123}'
              className="min-h-[350px] font-mono bg-background/50 backdrop-blur-sm border-border/30 rounded-xl resize-none transition-all duration-300 focus:bg-background/70 focus:shadow-glow"
            />
            <div className="flex gap-3">
              <Button 
                onClick={formatJson}
                className="bg-gradient-primary hover:shadow-glow transition-all duration-300 hover:scale-105 font-semibold"
              >
                Format JSON
              </Button>
              <Button 
                variant="outline" 
                onClick={minifyJson}
                className="backdrop-blur-sm border-border/30 hover:bg-accent/60 transition-all duration-300 hover:scale-105 font-semibold"
              >
                Minify JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border border-border/30 shadow-glass dark:shadow-glass-dark backdrop-blur-sm relative overflow-hidden animate-fade-in" style={{animationDelay: "0.2s"}}>
          <div className="absolute inset-0 bg-gradient-glass opacity-20"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center justify-between text-lg font-bold">
              Formatted Output
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  disabled={!formatted}
                  className="backdrop-blur-sm border-border/30 hover:bg-accent/60 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadJson}
                  disabled={!formatted}
                  className="backdrop-blur-sm border-border/30 hover:bg-accent/60 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardTitle>
            <CardDescription className="text-base font-medium">Formatted and validated JSON</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <Textarea
              value={formatted}
              readOnly
              className="min-h-[350px] font-mono bg-muted/50 backdrop-blur-sm border-border/30 rounded-xl resize-none transition-all duration-300"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};