import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Minus, Equal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageLayout } from "@/components/PageLayout";

interface ComparisonResult {
  added: string[];
  removed: string[];
  modified: string[];
  equal: boolean;
}

const JsonComparePage = () => {
  const [json1, setJson1] = useState("");
  const [json2, setJson2] = useState("");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const { toast } = useToast();

  const compareJsons = () => {
    try {
      const parsed1 = JSON.parse(json1);
      const parsed2 = JSON.parse(json2);
      
      const keys1 = new Set(Object.keys(parsed1));
      const keys2 = new Set(Object.keys(parsed2));
      
      const added = Array.from(keys2).filter(key => !keys1.has(key));
      const removed = Array.from(keys1).filter(key => !keys2.has(key));
      const common = Array.from(keys1).filter(key => keys2.has(key));
      
      const modified = common.filter(key => 
        JSON.stringify(parsed1[key]) !== JSON.stringify(parsed2[key])
      );
      
      const equal = added.length === 0 && removed.length === 0 && modified.length === 0;
      
      setResult({ added, removed, modified, equal });
      
      toast({
        title: "Comparison Complete",
        description: equal ? "JSONs are identical" : "Differences found",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Invalid JSON",
        description: "Please check both JSON inputs",
      });
    }
  };

  const getDifferenceText = (key: string, type: "added" | "removed" | "modified") => {
    try {
      const parsed1 = json1 ? JSON.parse(json1) : {};
      const parsed2 = json2 ? JSON.parse(json2) : {};
      
      if (type === "added") {
        return `"${key}": ${JSON.stringify(parsed2[key], null, 2)}`;
      } else if (type === "removed") {
        return `"${key}": ${JSON.stringify(parsed1[key], null, 2)}`;
      } else {
        return `"${key}": ${JSON.stringify(parsed1[key], null, 2)} → ${JSON.stringify(parsed2[key], null, 2)}`;
      }
    } catch {
      return key;
    }
  };

  return (
    <PageLayout
      title="JSON Comparison Tool"
      description="Compare multiple JSON objects"
      activeTool="json-compare"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">JSON Comparison Tool</h2>
          <p className="text-muted-foreground">Compare two JSON objects and see differences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>JSON 1</CardTitle>
              <CardDescription>First JSON object to compare</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={json1}
                onChange={(e) => setJson1(e.target.value)}
                placeholder='{"name": "John", "age": 30}'
                className="min-h-[300px] font-mono"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>JSON 2</CardTitle>
              <CardDescription>Second JSON object to compare</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={json2}
                onChange={(e) => setJson2(e.target.value)}
                placeholder='{"name": "Jane", "age": 25, "city": "NYC"}'
                className="min-h-[300px] font-mono"
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button onClick={compareJsons} size="lg">
            Compare JSONs
          </Button>
        </div>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Comparison Results
                <Badge variant={result.equal ? "secondary" : "outline"}>
                  {result.equal ? "Identical" : "Different"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Differences between the two JSON objects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="added">Added ({result.added.length})</TabsTrigger>
                  <TabsTrigger value="removed">Removed ({result.removed.length})</TabsTrigger>
                  <TabsTrigger value="modified">Modified ({result.modified.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="summary" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 p-4 rounded-lg border">
                      <Plus className="h-5 w-5 text-success" />
                      <div>
                        <p className="font-medium">Added</p>
                        <p className="text-2xl font-bold text-success">{result.added.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-4 rounded-lg border">
                      <Minus className="h-5 w-5 text-destructive" />
                      <div>
                        <p className="font-medium">Removed</p>
                        <p className="text-2xl font-bold text-destructive">{result.removed.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-4 rounded-lg border">
                      <Equal className="h-5 w-5 text-warning" />
                      <div>
                        <p className="font-medium">Modified</p>
                        <p className="text-2xl font-bold text-warning">{result.modified.length}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="added">
                  {result.added.length === 0 ? (
                    <p className="text-muted-foreground">No added properties</p>
                  ) : (
                    <div className="space-y-2">
                      {result.added.map((key) => (
                        <div key={key} className="p-3 rounded-lg bg-success/10 border border-success/20">
                          <code className="text-sm font-mono text-success">
                            + {getDifferenceText(key, "added")}
                          </code>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="removed">
                  {result.removed.length === 0 ? (
                    <p className="text-muted-foreground">No removed properties</p>
                  ) : (
                    <div className="space-y-2">
                      {result.removed.map((key) => (
                        <div key={key} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <code className="text-sm font-mono text-destructive">
                            - {getDifferenceText(key, "removed")}
                          </code>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="modified">
                  {result.modified.length === 0 ? (
                    <p className="text-muted-foreground">No modified properties</p>
                  ) : (
                    <div className="space-y-2">
                      {result.modified.map((key) => (
                        <div key={key} className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                          <code className="text-sm font-mono text-warning">
                            ± {getDifferenceText(key, "modified")}
                          </code>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};

export default JsonComparePage;