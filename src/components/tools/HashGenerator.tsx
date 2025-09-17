import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const HashGenerator = () => {
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<{[key: string]: string}>({});
  const { toast } = useToast();

  // Simple hash functions (for demonstration - in production use crypto libraries)
  const generateMD5 = async (text: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('MD5', data).catch(() => null);
    if (!hashBuffer) return "MD5 not supported in this browser";
    
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const generateSHA256 = async (text: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const generateSHA1 = async (text: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const generateSHA512 = async (text: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-512', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const generateAllHashes = async () => {
    if (!input.trim()) {
      toast({
        variant: "destructive",
        title: "Empty Input",
        description: "Please enter some text to hash",
      });
      return;
    }

    try {
      const results = await Promise.all([
        generateSHA256(input),
        generateSHA1(input),
        generateSHA512(input),
        // MD5 might not be available in all browsers
        generateMD5(input).catch(() => "Not supported")
      ]);

      setHashes({
        'SHA-256': results[0],
        'SHA-1': results[1],
        'SHA-512': results[2],
        'MD5': results[3]
      });

      toast({
        title: "Hashes Generated",
        description: "All hash algorithms completed successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation Error",
        description: "Failed to generate hashes",
      });
    }
  };

  const copyHash = async (hash: string) => {
    await navigator.clipboard.writeText(hash);
    toast({
      title: "Copied!",
      description: "Hash copied to clipboard",
    });
  };

  const clearAll = () => {
    setInput("");
    setHashes({});
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Hash Generator</h2>
        <p className="text-muted-foreground">Generate MD5, SHA-1, SHA-256, and SHA-512 hashes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Input Text</CardTitle>
          <CardDescription>Enter text to generate hashes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your text here..."
            className="min-h-[120px] font-mono"
          />
          <div className="flex gap-2">
            <Button onClick={generateAllHashes}>Generate Hashes</Button>
            <Button variant="outline" onClick={clearAll}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {Object.keys(hashes).length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {Object.entries(hashes).map(([algorithm, hash]) => (
            <Card key={algorithm}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  {algorithm}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyHash(hash)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Input
                    value={hash}
                    readOnly
                    className="font-mono text-sm bg-muted pr-20"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                    {hash.length} chars
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Hash Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">MD5</h4>
              <p className="text-muted-foreground">128-bit hash function, fast but cryptographically broken</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">SHA-1</h4>
              <p className="text-muted-foreground">160-bit hash function, deprecated for security</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">SHA-256</h4>
              <p className="text-muted-foreground">256-bit hash function, cryptographically secure</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">SHA-512</h4>
              <p className="text-muted-foreground">512-bit hash function, highest security</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};