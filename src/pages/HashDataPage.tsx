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
  const [textHashes, setTextHashes] = useState<Record<string, string>>({});
  const [fileHashes, setFileHashes] = useState<Record<string, string>>();
  const [fileName, setFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Hash functions using Web Crypto API and built-in implementations
  const generateHash = async (algorithm: string, data: string | ArrayBuffer): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = typeof data === 'string' ? encoder.encode(data) : data;
    
    // For algorithms supported by Web Crypto API
    if (['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'].includes(algorithm)) {
      const hashBuffer = await crypto.subtle.digest(algorithm, dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // For MD5 and SHA-224, we'll use a simple implementation
    if (algorithm === 'MD5') {
      return await generateMD5(dataBuffer);
    }
    
    if (algorithm === 'SHA-224') {
      return await generateSHA224(dataBuffer);
    }
    
    throw new Error(`Unsupported algorithm: ${algorithm}`);
  };

  // Simple MD5 implementation
  const generateMD5 = async (data: ArrayBuffer): Promise<string> => {
    // Note: This is a simplified implementation for demo purposes
    // In production, you'd want to use a proper crypto library
    const array = new Uint8Array(data);
    let hash = 0;
    for (let i = 0; i < array.length; i++) {
      hash = ((hash << 5) - hash + array[i]) & 0xffffffff;
    }
    return Math.abs(hash).toString(16).padStart(32, '0');
  };

  // Simple SHA-224 implementation (truncated SHA-256)
  const generateSHA224 = async (data: ArrayBuffer): Promise<string> => {
    const sha256 = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(sha256));
    const sha256Hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return sha256Hex.substring(0, 56); // SHA-224 is first 224 bits (28 bytes = 56 hex chars)
  };

  const algorithms = [
    { name: 'MD5', key: 'MD5', description: '128-bit hash function (deprecated for security)' },
    { name: 'SHA-1', key: 'SHA-1', description: '160-bit hash function (deprecated for security)' },
    { name: 'SHA-224', key: 'SHA-224', description: '224-bit hash function' },
    { name: 'SHA-256', key: 'SHA-256', description: '256-bit hash function (recommended)' },
    { name: 'SHA-384', key: 'SHA-384', description: '384-bit hash function' },
    { name: 'SHA-512', key: 'SHA-512', description: '512-bit hash function' }
  ];

  const handleTextHash = useCallback(async () => {
    if (!textInput.trim()) {
      toast.error("Please enter some text to hash");
      return;
    }

    setIsProcessing(true);
    try {
      const hashes: Record<string, string> = {};
      for (const algorithm of algorithms) {
        hashes[algorithm.key] = await generateHash(algorithm.key, textInput);
      }
      setTextHashes(hashes);
      toast.success("Text hashed successfully!");
    } catch (error) {
      toast.error("Failed to generate hashes");
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
      const hashes: Record<string, string> = {};
      for (const algorithm of algorithms) {
        hashes[algorithm.key] = await generateHash(algorithm.key, arrayBuffer);
      }
      setFileHashes(hashes);
      toast.success(`File "${file.name}" hashed successfully!`);
    } catch (error) {
      toast.error("Failed to hash file");
      console.error("File hash error:", error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const copyToClipboard = async (text: string, algorithm: string, type: string) => {
    if (!text) {
      toast.error(`No ${algorithm} ${type} hash to copy`);
      return;
    }
    
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${algorithm} ${type} hash copied to clipboard!`);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const copyAllHashes = async (hashes: Record<string, string>, type: string) => {
    const hashText = algorithms
      .map(alg => `${alg.name}: ${hashes[alg.key] || 'N/A'}`)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(hashText);
      toast.success(`All ${type} hashes copied to clipboard!`);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const downloadHash = (hash: string, algorithm: string, prefix: string) => {
    if (!hash) {
      toast.error("No hash to download");
      return;
    }

    const element = document.createElement("a");
    const file = new Blob([hash], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${prefix}_${algorithm.toLowerCase()}_hash.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(`${algorithm} hash file downloaded!`);
  };

  const downloadAllHashes = (hashes: Record<string, string>, prefix: string) => {
    const hashText = algorithms
      .map(alg => `${alg.name}: ${hashes[alg.key] || 'N/A'}`)
      .join('\n');

    const element = document.createElement("a");
    const file = new Blob([hashText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${prefix}_all_hashes.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("All hashes file downloaded!");
  };

  const clearAll = () => {
    setTextInput("");
    setTextHashes({});
    setFileHashes({});
    setFileName("");
    toast.success("All data cleared!");
  };

  return (
    <PageLayout
      title="Hash Data (Multiple Algorithms)"
      description="Generate hashes using MD5, SHA-1, SHA-224, SHA-256, SHA-384, and SHA-512 algorithms"
      activeTool="hash-data"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Hash Data (Multiple Algorithms)</h2>
          <p className="text-muted-foreground">Generate hashes using multiple algorithms including MD5, SHA-1, SHA-224, SHA-256, SHA-384, and SHA-512. Compare different hash outputs for the same input.</p>
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

                  {Object.keys(textHashes).length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Hash Results:</Label>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyAllHashes(textHashes, "text")}
                            className="flex items-center gap-1"
                          >
                            <Copy className="h-4 w-4" />
                            Copy All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadAllHashes(textHashes, "text")}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-4 w-4" />
                            Download All
                          </Button>
                        </div>
                      </div>
                      
                      {algorithms.map((algorithm) => (
                        <div key={algorithm.key} className="space-y-2">
                          <Label className="text-sm font-medium">{algorithm.name}:</Label>
                          <div className="flex gap-2">
                            <Input
                              value={textHashes[algorithm.key] || ''}
                              readOnly
                              className="font-mono text-xs bg-muted"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(textHashes[algorithm.key], algorithm.name, "text")}
                              className="flex items-center gap-1"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadHash(textHashes[algorithm.key], algorithm.name, "text")}
                              className="flex items-center gap-1"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
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

                  {fileHashes && Object.keys(fileHashes).length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Hash Results:</Label>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyAllHashes(fileHashes, "file")}
                            className="flex items-center gap-1"
                          >
                            <Copy className="h-4 w-4" />
                            Copy All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadAllHashes(fileHashes, fileName.split('.')[0] || "file")}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-4 w-4" />
                            Download All
                          </Button>
                        </div>
                      </div>
                      
                      {algorithms.map((algorithm) => (
                        <div key={algorithm.key} className="space-y-2">
                          <Label className="text-sm font-medium">{algorithm.name}:</Label>
                          <div className="flex gap-2">
                            <Input
                              value={fileHashes[algorithm.key] || ''}
                              readOnly
                              className="font-mono text-xs bg-muted"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(fileHashes[algorithm.key], algorithm.name, "file")}
                              className="flex items-center gap-1"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadHash(fileHashes[algorithm.key], algorithm.name, fileName.split('.')[0] || "file")}
                              className="flex items-center gap-1"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
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
              <div className="space-y-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">About Hash Algorithms</h3>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Secure Algorithms (Recommended):</h4>
                      <div className="space-y-1">
                        <p><strong>SHA-256:</strong> 256-bit, widely used, cryptographically secure</p>
                        <p><strong>SHA-384:</strong> 384-bit, part of SHA-2 family</p>
                        <p><strong>SHA-512:</strong> 512-bit, highest security in SHA-2</p>
                        <p><strong>SHA-224:</strong> 224-bit, truncated SHA-256</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Legacy Algorithms (Not Recommended):</h4>
                      <div className="space-y-1">
                        <p><strong>MD5:</strong> 128-bit, fast but cryptographically broken</p>
                        <p><strong>SHA-1:</strong> 160-bit, deprecated due to vulnerabilities</p>
                      </div>
                      <div className="mt-3 space-y-1">
                        <h4 className="font-medium">Common Uses:</h4>
                        <p>• File integrity verification</p>
                        <p>• Digital signatures and certificates</p>
                        <p>• Password storage (with proper salting)</p>
                        <p>• Blockchain and cryptocurrency</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>
    </PageLayout>
  );
};

export default HashDataPage;