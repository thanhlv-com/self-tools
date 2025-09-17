import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageLayout } from "@/components/PageLayout";

const TextCasePage = () => {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<{[key: string]: string}>({});
  const { toast } = useToast();

  const convertCases = () => {
    if (!input.trim()) {
      toast({
        variant: "destructive",
        title: "Empty Input",
        description: "Please enter some text to convert",
      });
      return;
    }

    const conversions = {
      'UPPERCASE': input.toUpperCase(),
      'lowercase': input.toLowerCase(),
      'Title Case': input.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      ),
      'camelCase': input.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
        index === 0 ? word.toLowerCase() : word.toUpperCase()
      ).replace(/\s+/g, ''),
      'PascalCase': input.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => 
        word.toUpperCase()
      ).replace(/\s+/g, ''),
      'snake_case': input.toLowerCase().replace(/\s+/g, '_'),
      'kebab-case': input.toLowerCase().replace(/\s+/g, '-'),
      'CONSTANT_CASE': input.toUpperCase().replace(/\s+/g, '_'),
      'dot.case': input.toLowerCase().replace(/\s+/g, '.'),
      'Sentence case': input.charAt(0).toUpperCase() + input.slice(1).toLowerCase(),
      'iNVERSE cASE': input.split('').map(char => 
        char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()
      ).join(''),
      'aLtErNaTiNg CaSe': input.split('').map((char, index) => 
        index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
      ).join('')
    };

    setResults(conversions);
    toast({
      title: "Conversion Complete",
      description: "Text converted to all case formats",
    });
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  const clearAll = () => {
    setInput("");
    setResults({});
  };

  return (
    <PageLayout
      title="Text Case Converter"
      description="Convert text cases"
      activeTool="text-case"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Text Case Converter</h2>
          <p className="text-muted-foreground">Convert text to various case formats</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Input Text</CardTitle>
            <CardDescription>Enter text to convert to different cases</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your text here..."
              className="min-h-[120px]"
            />
            <div className="flex gap-2">
              <Button onClick={convertCases}>Convert Cases</Button>
              <Button variant="outline" onClick={clearAll}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {Object.keys(results).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(results).map(([caseName, result]) => (
              <Card key={caseName}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    {caseName}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyText(result)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="p-3 rounded-lg bg-muted font-mono text-sm break-all">
                    {result || <span className="text-muted-foreground">Empty result</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Case Format Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold">camelCase</h4>
                <p className="text-muted-foreground">Used in JavaScript, Java</p>
              </div>
              <div>
                <h4 className="font-semibold">PascalCase</h4>
                <p className="text-muted-foreground">Used for class names</p>
              </div>
              <div>
                <h4 className="font-semibold">snake_case</h4>
                <p className="text-muted-foreground">Used in Python, Ruby</p>
              </div>
              <div>
                <h4 className="font-semibold">kebab-case</h4>
                <p className="text-muted-foreground">Used in URLs, CSS</p>
              </div>
              <div>
                <h4 className="font-semibold">CONSTANT_CASE</h4>
                <p className="text-muted-foreground">Used for constants</p>
              </div>
              <div>
                <h4 className="font-semibold">Title Case</h4>
                <p className="text-muted-foreground">Used for titles, headings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default TextCasePage;