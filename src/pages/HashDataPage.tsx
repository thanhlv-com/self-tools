import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Copy, Upload, Hash, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { PageLayout } from "@/components/PageLayout";

const HashDataPage = () => {
  const [textInput, setTextInput] = useState("");
  const [textHash, setTextHash] = useState("");
  const [fileHash, setFileHash] = useState("");
  const [fileName, setFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // SHA256 hash function using Web Crypto API
  const generateSHA256 = async (data: string | ArrayBuffer): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = typeof data === 'string' ? encoder.encode(data) : data;
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleTextHash = useCallback(async () => {
    if (!textInput.trim()) {
      toast.error("Please enter some text to hash");
      return;
    }

    setIsProcessing(true);
    try {
      const hash = await generateSHA256(textInput);
      setTextHash(hash);
      toast.success("Text hashed successfully!");
    } catch (error) {
      toast.error("Failed to generate hash");
      console.error("Hash generation error:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [textInput]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setFileName(file.name);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hash = await generateSHA256(arrayBuffer);
      setFileHash(hash);
      toast.success(`File "${file.name}" hashed successfully!`);
    } catch (error) {
      toast.error("Failed to hash file");
      console.error("File hash error:", error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const copyToClipboard = async (text: string, type: string) => {
    if (!text) {
      toast.error(`No ${type} hash to copy`);
      return;
    }
    
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} hash copied to clipboard!`);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const downloadHash = (hash: string, prefix: string) => {
    if (!hash) {
      toast.error("No hash to download");
      return;
    }

    const element = document.createElement("a");
    const file = new Blob([hash], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${prefix}_sha256_hash.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Hash file downloaded!");
  };

  const clearAll = () => {
    setTextInput("");
    setTextHash("");
    setFileHash("");
    setFileName("");
    toast.success("All data cleared!");
  };

  return (
    <PageLayout
      title="Hash Data (SHA256)"
      description="Generate SHA256 hashes from text input or uploaded files"
      activeTool="hash-data"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Hash Data (SHA256)</h2>
          <p className="text-muted-foreground">Generate SHA256 hashes from text input or uploaded files. SHA256 is a cryptographic hash function that produces a unique 256-bit signature for any input.</p>
        </div>

          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Text Hash
              </TabsTrigger>
              <TabsTrigger value="file" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                File Hash
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Text Input
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="text-input">Enter text to hash:</Label>
                    <Textarea
                      id="text-input"
                      placeholder="Type or paste your text here..."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      className="min-h-32 resize-y"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleTextHash}
                      disabled={isProcessing || !textInput.trim()}
                      className="flex items-center gap-2"
                    >
                      <Hash className="h-4 w-4" />
                      {isProcessing ? "Generating..." : "Generate Hash"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={clearAll}
                      className="flex items-center gap-2"
                    >
                      Clear All
                    </Button>
                  </div>

                  {textHash && (
                    <div className="space-y-2">
                      <Label>SHA256 Hash:</Label>
                      <div className="flex gap-2">
                        <Input
                          value={textHash}
                          readOnly
                          className="font-mono text-sm bg-muted"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(textHash, "text")}
                          className="flex items-center gap-1"
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadHash(textHash, "text")}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="file" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    File Upload
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file-input">Select file to hash:</Label>
                    <Input
                      id="file-input"
                      type="file"
                      onChange={handleFileUpload}
                      disabled={isProcessing}
                      className="cursor-pointer"
                    />
                  </div>

                  {fileName && (
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Selected file: <span className="font-semibold">{fileName}</span>
                    </div>
                  )}

                  {fileHash && (
                    <div className="space-y-2">
                      <Label>SHA256 Hash:</Label>
                      <div className="flex gap-2">
                        <Input
                          value={fileHash}
                          readOnly
                          className="font-mono text-sm bg-muted"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(fileHash, "file")}
                          className="flex items-center gap-1"
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadHash(fileHash, fileName.split('.')[0] || "file")}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Hash className="h-4 w-4 animate-spin" />
                        Processing file...
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">About SHA256</h3>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <p>• SHA256 produces a unique 256-bit (64-character) hash for any input</p>
                  <p>• Even small changes in input result in completely different hashes</p>
                  <p>• Commonly used for file integrity verification and digital signatures</p>
                  <p>• Cryptographically secure and collision-resistant</p>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>
    </PageLayout>
  );
};

export default HashDataPage;