import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">JSON Viewer & Formatter</h2>
        <p className="text-muted-foreground">Format, validate, and beautify JSON data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Input JSON
              <div className="flex gap-2">
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
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                {isValid !== null && (
                  <Badge variant={isValid ? "secondary" : "destructive"}>
                    {isValid ? "Valid" : "Invalid"}
                  </Badge>
                )}
              </div>
            </CardTitle>
            <CardDescription>Paste or upload your JSON data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='{"name": "example", "value": 123}'
              className="min-h-[300px] font-mono"
            />
            <div className="flex gap-2">
              <Button onClick={formatJson}>Format JSON</Button>
              <Button variant="outline" onClick={minifyJson}>Minify JSON</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Formatted Output
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  disabled={!formatted}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadJson}
                  disabled={!formatted}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardTitle>
            <CardDescription>Formatted and validated JSON</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formatted}
              readOnly
              className="min-h-[300px] font-mono bg-muted"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};