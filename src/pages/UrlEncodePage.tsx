import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageLayout } from "@/components/PageLayout";

const UrlEncodePage = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const { toast } = useToast();

  const encodeUrl = () => {
    try {
      const encoded = encodeURIComponent(input);
      setOutput(encoded);
      toast({
        title: "Encoded Successfully",
        description: "Text has been URL encoded",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Encoding Error",
        description: "Failed to encode the input text",
      });
    }
  };

  const decodeUrl = () => {
    try {
      const decoded = decodeURIComponent(input);
      setOutput(decoded);
      toast({
        title: "Decoded Successfully",
        description: "URL has been decoded",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Decoding Error",
        description: "Invalid URL encoded input",
      });
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(output);
    toast({
      title: "Copied!",
      description: "Result copied to clipboard",
    });
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
  };

  const swapInputOutput = () => {
    const temp = input;
    setInput(output);
    setOutput(temp);
  };

  // URL encoding examples
  const examples = [
    {
      original: "Hello World!",
      encoded: "Hello%20World%21"
    },
    {
      original: "user@example.com",
      encoded: "user%40example.com"
    },
    {
      original: "price=$100&discount=20%",
      encoded: "price%3D%24100%26discount%3D20%25"
    },
    {
      original: "path/to/file with spaces.txt",
      encoded: "path%2Fto%2Ffile%20with%20spaces.txt"
    }
  ];

  return (
    <PageLayout
      title="URL Encoder/Decoder"
      description="URL encoding and decoding"
      activeTool="url-encode"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">URL Encoder/Decoder</h2>
          <p className="text-muted-foreground">Encode or decode URL/URI components</p>
        </div>

        <Tabs defaultValue="encode" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="encode">Encode</TabsTrigger>
            <TabsTrigger value="decode">Decode</TabsTrigger>
          </TabsList>
          
          <TabsContent value="encode" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Plain Text Input</CardTitle>
                  <CardDescription>Enter text to URL encode</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter your text here..."
                    className="min-h-[200px] font-mono"
                  />
                  <div className="flex gap-2 mt-4">
                    <Button onClick={encodeUrl}>Encode URL</Button>
                    <Button variant="outline" onClick={clearAll}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    URL Encoded Output
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      disabled={!output}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </CardTitle>
                  <CardDescription>URL encoded result</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={output}
                    readOnly
                    className="min-h-[200px] font-mono bg-muted"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="decode" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>URL Encoded Input</CardTitle>
                  <CardDescription>Enter URL encoded text to decode</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter URL encoded text..."
                    className="min-h-[200px] font-mono"
                  />
                  <div className="flex gap-2 mt-4">
                    <Button onClick={decodeUrl}>Decode URL</Button>
                    <Button variant="outline" onClick={clearAll}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Plain Text Output
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      disabled={!output}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </CardTitle>
                  <CardDescription>Decoded text result</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={output}
                    readOnly
                    className="min-h-[200px] font-mono bg-muted"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-center">
          <Button variant="outline" onClick={swapInputOutput} disabled={!input && !output}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Swap Input/Output
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>URL Encoding Examples</CardTitle>
            <CardDescription>Common characters and their URL encoded equivalents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {examples.map((example, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Original:</p>
                    <code className="text-sm font-mono bg-muted p-2 rounded block">
                      {example.original}
                    </code>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Encoded:</p>
                    <code className="text-sm font-mono bg-muted p-2 rounded block">
                      {example.encoded}
                    </code>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-info/10 border border-info/20 rounded-lg">
              <h4 className="font-semibold text-info mb-2">Common URL Encoding Rules:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Spaces become %20</li>
                <li>• @ becomes %40</li>
                <li>• # becomes %23</li>
                <li>• & becomes %26</li>
                <li>• = becomes %3D</li>
                <li>• ? becomes %3F</li>
                <li>• / becomes %2F</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default UrlEncodePage;