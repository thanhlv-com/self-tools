import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Minus, 
  Equal, 
  FileText, 
  CheckCircle, 
  Layers, 
  ArrowLeftRight,
  Sparkles,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageLayout } from "@/components/PageLayout";

interface ComparisonResult {
  added: string[];
  removed: string[];
  modified: string[];
  equal: boolean;
  parallelDiff: ParallelDiffLine[];
  formattedJson1: string;
  formattedJson2: string;
}

interface ParallelDiffLine {
  leftLine: {
    content: string;
    lineNumber: number;
    type: 'normal' | 'removed' | 'empty';
  };
  rightLine: {
    content: string;
    lineNumber: number;
    type: 'normal' | 'added' | 'empty';
  };
  isDifferent: boolean;
}

const JsonComparePage = () => {
  const [json1, setJson1] = useState("");
  const [json2, setJson2] = useState("");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);
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
      
      // Format JSONs for side-by-side comparison
      const formattedJson1 = JSON.stringify(parsed1, null, 2);
      const formattedJson2 = JSON.stringify(parsed2, null, 2);
      
      // Create parallel diff
      const parallelDiff = createParallelDiff(formattedJson1, formattedJson2);
      
      setResult({ 
        added, 
        removed, 
        modified, 
        equal, 
        parallelDiff, 
        formattedJson1, 
        formattedJson2 
      });
      
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

  const createParallelDiff = (textA: string, textB: string): ParallelDiffLine[] => {
    const linesA = textA.split('\n');
    const linesB = textB.split('\n');
    
    const result: ParallelDiffLine[] = [];
    const maxLines = Math.max(linesA.length, linesB.length);
    
    let lineNumberA = 1;
    let lineNumberB = 1;
    
    for (let i = 0; i < maxLines; i++) {
      const lineA = linesA[i];
      const lineB = linesB[i];
      
      const hasLineA = lineA !== undefined;
      const hasLineB = lineB !== undefined;
      
      if (!hasLineA && !hasLineB) continue;
      
      let leftLine, rightLine, isDifferent;
      
      if (hasLineA && hasLineB) {
        // Both lines exist
        const areEqual = lineA.trim() === lineB.trim();
        isDifferent = !areEqual;
        
        leftLine = {
          content: lineA,
          lineNumber: lineNumberA++,
          type: areEqual ? 'normal' as const : 'removed' as const
        };
        
        rightLine = {
          content: lineB,
          lineNumber: lineNumberB++,
          type: areEqual ? 'normal' as const : 'added' as const
        };
      } else if (hasLineA && !hasLineB) {
        // Only left line exists (removed)
        isDifferent = true;
        leftLine = {
          content: lineA,
          lineNumber: lineNumberA++,
          type: 'removed' as const
        };
        rightLine = {
          content: '',
          lineNumber: lineNumberB,
          type: 'empty' as const
        };
      } else {
        // Only right line exists (added)
        isDifferent = true;
        leftLine = {
          content: '',
          lineNumber: lineNumberA,
          type: 'empty' as const
        };
        rightLine = {
          content: lineB,
          lineNumber: lineNumberB++,
          type: 'added' as const
        };
      }
      
      result.push({
        leftLine,
        rightLine,
        isDifferent
      });
    }
    
    return result;
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
          <div className="space-y-6">
            {/* Hero Results Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-blue-100 dark:border-slate-700">
              <div className="relative p-8">
                <div className="text-center space-y-6">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-600/20">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">JSON Comparison Complete</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {result.equal ? "100%" : `${Math.round((result.parallelDiff.filter(line => !line.isDifferent).length / Math.max(1, result.parallelDiff.length)) * 100)}%`}
                      </div>
                      <div className="text-xl text-slate-600 dark:text-slate-300">
                        {result.equal ? 'Identical' : 'Match'}
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="relative w-32 h-32">
                        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                          <circle 
                            cx="60" 
                            cy="60" 
                            r="50" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="8" 
                            className="text-slate-200 dark:text-slate-700"
                          />
                          <circle 
                            cx="60" 
                            cy="60" 
                            r="50" 
                            fill="none" 
                            strokeWidth="8" 
                            strokeLinecap="round"
                            className={result.equal ? 'stroke-green-500' : 'stroke-blue-500'}
                            strokeDasharray={`${(result.equal ? 100 : Math.round((result.parallelDiff.filter(line => !line.isDifferent).length / Math.max(1, result.parallelDiff.length)) * 100)) * 3.14} 314`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          {result.equal ? <CheckCircle className="h-8 w-8 text-green-500" /> :
                           <Target className="h-8 w-8 text-blue-500" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-slate-800/60 rounded-lg backdrop-blur-sm">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">JSON 1</span>
                    </div>
                    <ArrowLeftRight className="h-4 w-4 text-slate-400" />
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-slate-800/60 rounded-lg backdrop-blur-sm">
                      <FileText className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">JSON 2</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950/30 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <Plus className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                    {result.added.length}
                  </div>
                  <div className="font-semibold text-emerald-800 dark:text-emerald-200">
                    Added Properties
                  </div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    New keys in JSON 2
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-950/30 dark:to-red-900/20 border border-rose-200 dark:border-rose-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-900/30">
                    <Minus className="h-6 w-6 text-rose-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-rose-700 dark:text-rose-300">
                    {result.removed.length}
                  </div>
                  <div className="font-semibold text-rose-800 dark:text-rose-200">
                    Removed Properties
                  </div>
                  <p className="text-sm text-rose-600 dark:text-rose-400">
                    Keys missing from JSON 2
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950/30 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                    <Equal className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                    {result.modified.length}
                  </div>
                  <div className="font-semibold text-amber-800 dark:text-amber-200">
                    Modified Properties
                  </div>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Values changed between JSONs
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/30 dark:to-slate-900/20 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/30">
                    <Layers className="h-6 w-6 text-slate-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-slate-700 dark:text-slate-300">
                    {result.parallelDiff.length}
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Total Lines
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Lines in formatted JSON
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Exploration Tabs */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>JSON Comparison Analysis</CardTitle>
                    <CardDescription>Explore differences between your JSON objects</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="sidebyside" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 p-1 bg-slate-100 dark:bg-slate-800">
                    <TabsTrigger value="sidebyside" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                      <Layers className="h-4 w-4" />
                      <span className="hidden sm:inline">Side by Side</span>
                      <span className="sm:hidden">Compare</span>
                    </TabsTrigger>
                    <TabsTrigger value="added" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Added ({result.added.length})</span>
                      <span className="sm:hidden">+{result.added.length}</span>
                    </TabsTrigger>
                    <TabsTrigger value="removed" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                      <Minus className="h-4 w-4" />
                      <span className="hidden sm:inline">Removed ({result.removed.length})</span>
                      <span className="sm:hidden">-{result.removed.length}</span>
                    </TabsTrigger>
                    <TabsTrigger value="modified" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                      <Equal className="h-4 w-4" />
                      <span className="hidden sm:inline">Modified ({result.modified.length})</span>
                      <span className="sm:hidden">±{result.modified.length}</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="sidebyside" className="mt-6">
                    {/* Header with JSON info */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                            JSON 1 (Original)
                          </h3>
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            {result.formattedJson1.split('\n').length} lines
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                          <FileText className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-purple-800 dark:text-purple-200">
                            JSON 2 (Comparison)
                          </h3>
                          <p className="text-sm text-purple-600 dark:text-purple-400">
                            {result.formattedJson2.split('\n').length} lines
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Legend and Controls */}
                    <div className="flex items-center justify-between mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded"></div>
                          <span className="text-sm text-slate-600 dark:text-slate-400">Removed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded"></div>
                          <span className="text-sm text-slate-600 dark:text-slate-400">Added</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded"></div>
                          <span className="text-sm text-slate-600 dark:text-slate-400">Unchanged</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showOnlyDifferences}
                            onChange={(e) => setShowOnlyDifferences(e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Show only differences
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Parallel diff view */}
                    <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                      <div className="max-h-[600px] overflow-y-auto">
                        <div className="grid grid-cols-2">
                          {/* Left column header */}
                          <div className="sticky top-0 bg-blue-50 dark:bg-blue-950/20 px-4 py-2 border-b border-r border-blue-200 dark:border-blue-800 font-medium text-sm text-blue-800 dark:text-blue-200">
                            JSON 1 (Original)
                          </div>
                          {/* Right column header */}
                          <div className="sticky top-0 bg-purple-50 dark:bg-purple-950/20 px-4 py-2 border-b border-purple-200 dark:border-purple-800 font-medium text-sm text-purple-800 dark:text-purple-200">
                            JSON 2 (Comparison)
                          </div>
                          
                          {/* Diff lines */}
                          {result.parallelDiff
                            .filter(diffLine => !showOnlyDifferences || diffLine.isDifferent)
                            .map((diffLine, index) => (
                            <>
                              {/* Left line */}
                              <div 
                                key={`left-${index}`}
                                className={`flex border-r border-slate-200 dark:border-slate-700 ${
                                  diffLine.leftLine.type === 'removed' 
                                    ? 'bg-red-50 dark:bg-red-950/20' 
                                    : diffLine.leftLine.type === 'empty'
                                    ? 'bg-slate-100 dark:bg-slate-800'
                                    : diffLine.isDifferent
                                    ? 'bg-red-50/50 dark:bg-red-950/10'
                                    : 'bg-white dark:bg-slate-900'
                                } ${diffLine.isDifferent ? 'border-l-2 border-l-red-400' : ''}`}
                              >
                                <div className={`px-3 py-2 text-xs font-mono min-w-[3rem] text-right border-r select-none ${
                                  diffLine.leftLine.type === 'empty' 
                                    ? 'text-slate-400 bg-slate-200 dark:bg-slate-700' 
                                    : 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800'
                                }`}>
                                  {diffLine.leftLine.type !== 'empty' ? diffLine.leftLine.lineNumber : ''}
                                </div>
                                <div className="flex-1 px-3 py-2 text-sm font-mono whitespace-pre-wrap break-words">
                                  {diffLine.leftLine.content || (diffLine.leftLine.type === 'empty' ? '' : ' ')}
                                </div>
                                {diffLine.leftLine.type === 'removed' && (
                                  <div className="px-2 py-2 flex items-center">
                                    <Minus className="h-3 w-3 text-red-500" />
                                  </div>
                                )}
                              </div>
                              
                              {/* Right line */}
                              <div 
                                key={`right-${index}`}
                                className={`flex ${
                                  diffLine.rightLine.type === 'added' 
                                    ? 'bg-green-50 dark:bg-green-950/20' 
                                    : diffLine.rightLine.type === 'empty'
                                    ? 'bg-slate-100 dark:bg-slate-800'
                                    : diffLine.isDifferent
                                    ? 'bg-green-50/50 dark:bg-green-950/10'
                                    : 'bg-white dark:bg-slate-900'
                                } ${diffLine.isDifferent ? 'border-l-2 border-l-green-400' : ''}`}
                              >
                                <div className={`px-3 py-2 text-xs font-mono min-w-[3rem] text-right border-r select-none ${
                                  diffLine.rightLine.type === 'empty' 
                                    ? 'text-slate-400 bg-slate-200 dark:bg-slate-700' 
                                    : 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800'
                                }`}>
                                  {diffLine.rightLine.type !== 'empty' ? diffLine.rightLine.lineNumber : ''}
                                </div>
                                <div className="flex-1 px-3 py-2 text-sm font-mono whitespace-pre-wrap break-words">
                                  {diffLine.rightLine.content || (diffLine.rightLine.type === 'empty' ? '' : ' ')}
                                </div>
                                {diffLine.rightLine.type === 'added' && (
                                  <div className="px-2 py-2 flex items-center">
                                    <Plus className="h-3 w-3 text-green-500" />
                                  </div>
                                )}
                              </div>
                            </>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Quick stats */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {result.parallelDiff.filter(line => line.leftLine.type === 'removed').length}
                        </div>
                        <div className="text-sm text-red-600 dark:text-red-400">Lines Removed</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {result.parallelDiff.filter(line => line.rightLine.type === 'added').length}
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">Lines Added</div>
                      </div>
                      <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                          {result.parallelDiff.filter(line => !line.isDifferent).length}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Lines Unchanged</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {showOnlyDifferences 
                            ? result.parallelDiff.filter(line => line.isDifferent).length
                            : result.parallelDiff.length
                          }
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">
                          {showOnlyDifferences ? 'Differences Shown' : 'Total Lines'}
                        </div>
                      </div>
                    </div>

                    {/* Empty state when showing only differences */}
                    {showOnlyDifferences && result.parallelDiff.filter(line => line.isDifferent).length === 0 && (
                      <div className="mt-6 text-center py-12 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">No Differences Found</h3>
                        <p className="text-green-600 dark:text-green-400">These JSON objects are identical!</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="added" className="mt-6">
                    {result.added.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">No Added Properties</h3>
                        <p className="text-slate-600 dark:text-slate-400">JSON 2 doesn't contain any new properties.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground mb-4">
                          These {result.added.length} properties appear in JSON 2 but not in JSON 1:
                        </p>
                        {result.added.map((key) => (
                          <div key={key} className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-start gap-3">
                              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1 rounded">
                                <Plus className="h-4 w-4 text-emerald-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <code className="text-sm font-mono text-emerald-800 dark:text-emerald-200 whitespace-pre-wrap break-words leading-relaxed bg-white dark:bg-emerald-950/10 p-3 rounded border border-emerald-200 dark:border-emerald-800 block">
                                  + {getDifferenceText(key, "added")}
                                </code>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="removed" className="mt-6">
                    {result.removed.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">No Removed Properties</h3>
                        <p className="text-slate-600 dark:text-slate-400">All properties from JSON 1 are present in JSON 2.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground mb-4">
                          These {result.removed.length} properties appear in JSON 1 but not in JSON 2:
                        </p>
                        {result.removed.map((key) => (
                          <div key={key} className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800">
                            <div className="flex items-start gap-3">
                              <div className="bg-rose-100 dark:bg-rose-900/30 p-1 rounded">
                                <Minus className="h-4 w-4 text-rose-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <code className="text-sm font-mono text-rose-800 dark:text-rose-200 whitespace-pre-wrap break-words leading-relaxed bg-white dark:bg-rose-950/10 p-3 rounded border border-rose-200 dark:border-rose-800 block">
                                  - {getDifferenceText(key, "removed")}
                                </code>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="modified" className="mt-6">
                    {result.modified.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">No Modified Properties</h3>
                        <p className="text-slate-600 dark:text-slate-400">All shared properties have identical values.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground mb-4">
                          These {result.modified.length} properties have different values between JSON 1 and JSON 2:
                        </p>
                        {result.modified.map((key) => (
                          <div key={key} className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                            <div className="flex items-start gap-3">
                              <div className="bg-amber-100 dark:bg-amber-900/30 p-1 rounded">
                                <Equal className="h-4 w-4 text-amber-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <code className="text-sm font-mono text-amber-800 dark:text-amber-200 whitespace-pre-wrap break-words leading-relaxed bg-white dark:bg-amber-950/10 p-3 rounded border border-amber-200 dark:border-amber-800 block">
                                  ± {getDifferenceText(key, "modified")}
                                </code>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default JsonComparePage;