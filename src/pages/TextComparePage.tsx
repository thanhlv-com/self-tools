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
  Target,
  Zap,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageLayout } from "@/components/PageLayout";

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

interface ComparisonResult {
  addedLines: number;
  removedLines: number;
  modifiedLines: number;
  unchangedLines: number;
  similarity: number;
  equal: boolean;
  parallelDiff: ParallelDiffLine[];
}

const TextComparePage = () => {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);
  const { toast } = useToast();

  const compareTexts = () => {
    if (!text1.trim() && !text2.trim()) {
      toast({
        variant: "destructive",
        title: "Empty Input",
        description: "Please enter some text to compare",
      });
      return;
    }

    // Create parallel diff
    const parallelDiff = createParallelDiff(text1, text2);
    
    // Calculate statistics
    const addedLines = parallelDiff.filter(line => line.rightLine.type === 'added').length;
    const removedLines = parallelDiff.filter(line => line.leftLine.type === 'removed').length;
    const modifiedLines = parallelDiff.filter(line => line.isDifferent && line.leftLine.type === 'normal' && line.rightLine.type === 'normal').length;
    const unchangedLines = parallelDiff.filter(line => !line.isDifferent).length;
    
    const totalLines = Math.max(1, parallelDiff.length);
    const similarity = Math.round((unchangedLines / totalLines) * 100);
    const equal = addedLines === 0 && removedLines === 0 && modifiedLines === 0;
    
    setResult({
      addedLines,
      removedLines,
      modifiedLines,
      unchangedLines,
      similarity,
      equal,
      parallelDiff
    });
    
    toast({
      title: "Comparison Complete",
      description: equal ? "Texts are identical" : `${similarity}% similarity found`,
    });
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
        const areEqual = lineA === lineB;
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

  return (
    <PageLayout
      title="Text Comparison Tool"
      description="Compare two text documents line by line"
      activeTool="text-compare"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Text Comparison Tool</h2>
          <p className="text-muted-foreground">Compare two text documents and see line-by-line differences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-500" />
                Text 1 (Original)
              </CardTitle>
              <CardDescription>First text document to compare</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={text1}
                onChange={(e) => setText1(e.target.value)}
                placeholder="Enter your first text here..."
                className="min-h-[300px] font-mono text-sm"
              />
              {text1 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {text1.split('\n').length} lines, {text1.length} characters
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-500" />
                Text 2 (Comparison)
              </CardTitle>
              <CardDescription>Second text document to compare</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={text2}
                onChange={(e) => setText2(e.target.value)}
                placeholder="Enter your second text here..."
                className="min-h-[300px] font-mono text-sm"
              />
              {text2 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {text2.split('\n').length} lines, {text2.length} characters
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button 
            onClick={compareTexts} 
            size="lg"
            className="min-w-[200px]"
            disabled={!text1.trim() && !text2.trim()}
          >
            <Layers className="h-4 w-4 mr-2" />
            Compare Texts
          </Button>
        </div>

        {result && (
          <div className="space-y-6">
            {/* Hero Results Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-orange-100 dark:border-slate-700">
              <div className="relative p-8">
                <div className="text-center space-y-6">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-600/20">
                      <Sparkles className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Text Comparison Complete</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-6xl font-bold bg-gradient-to-r from-orange-600 to-teal-600 bg-clip-text text-transparent">
                        {result.similarity}%
                      </div>
                      <div className="text-xl text-slate-600 dark:text-slate-300">
                        {result.equal ? 'Identical' : 
                         result.similarity >= 90 ? 'Nearly Identical' :
                         result.similarity >= 70 ? 'Quite Similar' :
                         result.similarity >= 50 ? 'Somewhat Different' : 'Very Different'}
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
                            className={
                              result.similarity >= 90 ? 'stroke-green-500' :
                              result.similarity >= 70 ? 'stroke-yellow-500' :
                              result.similarity >= 50 ? 'stroke-orange-500' : 'stroke-red-500'
                            }
                            strokeDasharray={`${result.similarity * 3.14} 314`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          {result.equal ? <CheckCircle className="h-8 w-8 text-green-500" /> :
                           result.similarity >= 70 ? <Target className="h-8 w-8 text-yellow-500" /> :
                           <XCircle className="h-8 w-8 text-red-500" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-slate-800/60 rounded-lg backdrop-blur-sm">
                      <FileText className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">Text 1</span>
                    </div>
                    <ArrowLeftRight className="h-4 w-4 text-slate-400" />
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-slate-800/60 rounded-lg backdrop-blur-sm">
                      <FileText className="h-4 w-4 text-teal-500" />
                      <span className="font-medium">Text 2</span>
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
                    {result.addedLines}
                  </div>
                  <div className="font-semibold text-emerald-800 dark:text-emerald-200">
                    Added Lines
                  </div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    New lines in Text 2
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
                    {result.removedLines}
                  </div>
                  <div className="font-semibold text-rose-800 dark:text-rose-200">
                    Removed Lines
                  </div>
                  <p className="text-sm text-rose-600 dark:text-rose-400">
                    Lines missing from Text 2
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-sky-50 to-blue-100 dark:from-sky-950/30 dark:to-blue-900/20 border border-sky-200 dark:border-sky-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-sky-100 dark:bg-sky-900/30">
                    <Equal className="h-6 w-6 text-sky-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-sky-700 dark:text-sky-300">
                    {result.unchangedLines}
                  </div>
                  <div className="font-semibold text-sky-800 dark:text-sky-200">
                    Unchanged Lines
                  </div>
                  <p className="text-sm text-sky-600 dark:text-sky-400">
                    Identical lines in both texts
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-950/30 dark:to-purple-900/20 border border-violet-200 dark:border-violet-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                    <Zap className="h-6 w-6 text-violet-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-violet-700 dark:text-violet-300">
                    {result.addedLines + result.removedLines + result.modifiedLines}
                  </div>
                  <div className="font-semibold text-violet-800 dark:text-violet-200">
                    Total Changes
                  </div>
                  <p className="text-sm text-violet-600 dark:text-violet-400">
                    All modifications detected
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Exploration Tabs */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <Layers className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle>Text Comparison Analysis</CardTitle>
                    <CardDescription>Explore line-by-line differences between your texts</CardDescription>
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
                      <span className="hidden sm:inline">Added ({result.addedLines})</span>
                      <span className="sm:hidden">+{result.addedLines}</span>
                    </TabsTrigger>
                    <TabsTrigger value="removed" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                      <Minus className="h-4 w-4" />
                      <span className="hidden sm:inline">Removed ({result.removedLines})</span>
                      <span className="sm:hidden">-{result.removedLines}</span>
                    </TabsTrigger>
                    <TabsTrigger value="unchanged" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                      <Equal className="h-4 w-4" />
                      <span className="hidden sm:inline">Shared ({result.unchangedLines})</span>
                      <span className="sm:hidden">={result.unchangedLines}</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="sidebyside" className="mt-6">
                    {/* Header with text info */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                          <FileText className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                            Text 1 (Original)
                          </h3>
                          <p className="text-sm text-orange-600 dark:text-orange-400">
                            {text1.split('\n').length} lines, {text1.length} chars
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-950/30 dark:to-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                        <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                          <FileText className="h-5 w-5 text-teal-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-teal-800 dark:text-teal-200">
                            Text 2 (Comparison)
                          </h3>
                          <p className="text-sm text-teal-600 dark:text-teal-400">
                            {text2.split('\n').length} lines, {text2.length} chars
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
                            className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
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
                          <div className="sticky top-0 bg-orange-50 dark:bg-orange-950/20 px-4 py-2 border-b border-r border-orange-200 dark:border-orange-800 font-medium text-sm text-orange-800 dark:text-orange-200">
                            Text 1 (Original)
                          </div>
                          {/* Right column header */}
                          <div className="sticky top-0 bg-teal-50 dark:bg-teal-950/20 px-4 py-2 border-b border-teal-200 dark:border-teal-800 font-medium text-sm text-teal-800 dark:text-teal-200">
                            Text 2 (Comparison)
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
                      <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {showOnlyDifferences 
                            ? result.parallelDiff.filter(line => line.isDifferent).length
                            : result.parallelDiff.length
                          }
                        </div>
                        <div className="text-sm text-orange-600 dark:text-orange-400">
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
                        <p className="text-green-600 dark:text-green-400">These texts are identical!</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="added" className="mt-6">
                    {result.addedLines === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">No Added Lines</h3>
                        <p className="text-slate-600 dark:text-slate-400">Text 2 doesn't contain any additional lines.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground mb-4">
                          These {result.addedLines} lines appear in Text 2 but not in Text 1:
                        </p>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {result.parallelDiff
                            .filter(line => line.rightLine.type === 'added')
                            .map((diff, index) => (
                              <div key={index} className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                                <div className="flex items-start gap-3">
                                  <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1 rounded">
                                    <Plus className="h-4 w-4 text-emerald-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded font-mono">
                                        Line {diff.rightLine.lineNumber}
                                      </span>
                                    </div>
                                    <pre className="text-sm text-emerald-800 dark:text-emerald-200 whitespace-pre-wrap break-words leading-relaxed bg-white dark:bg-emerald-950/10 p-3 rounded border border-emerald-200 dark:border-emerald-800">
                                      {diff.rightLine.content}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="removed" className="mt-6">
                    {result.removedLines === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">No Removed Lines</h3>
                        <p className="text-slate-600 dark:text-slate-400">All lines from Text 1 are preserved in Text 2.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground mb-4">
                          These {result.removedLines} lines appear in Text 1 but not in Text 2:
                        </p>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {result.parallelDiff
                            .filter(line => line.leftLine.type === 'removed')
                            .map((diff, index) => (
                              <div key={index} className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800">
                                <div className="flex items-start gap-3">
                                  <div className="bg-rose-100 dark:bg-rose-900/30 p-1 rounded">
                                    <Minus className="h-4 w-4 text-rose-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-xs bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 px-2 py-1 rounded font-mono">
                                        Line {diff.leftLine.lineNumber}
                                      </span>
                                    </div>
                                    <pre className="text-sm text-rose-800 dark:text-rose-200 whitespace-pre-wrap break-words leading-relaxed bg-white dark:bg-rose-950/10 p-3 rounded border border-rose-200 dark:border-rose-800">
                                      {diff.leftLine.content}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="unchanged" className="mt-6">
                    {result.unchangedLines === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <XCircle className="h-8 w-8 text-rose-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">No Shared Content</h3>
                        <p className="text-slate-600 dark:text-slate-400">These texts have completely different content.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground mb-4">
                          These {Math.min(result.unchangedLines, 50)} lines are identical in both texts:
                        </p>
                        <div className="max-h-96 overflow-y-auto space-y-2">
                          {result.parallelDiff
                            .filter(line => !line.isDifferent)
                            .slice(0, 50)
                            .map((diff, index) => (
                              <div key={index} className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800">
                                <div className="flex items-start gap-3">
                                  <div className="bg-sky-100 dark:bg-sky-900/30 p-1 rounded">
                                    <Equal className="h-3 w-3 text-sky-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-xs bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 px-2 py-1 rounded font-mono mb-2 inline-block">
                                      Line {diff.leftLine.lineNumber}
                                    </span>
                                    <pre className="text-sm text-sky-800 dark:text-sky-200 whitespace-pre-wrap break-words leading-relaxed bg-white dark:bg-sky-950/10 p-3 rounded border border-sky-200 dark:border-sky-800">
                                      {diff.leftLine.content}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                        {result.unchangedLines > 50 && (
                          <div className="text-center py-4 border-t border-sky-200 dark:border-sky-800">
                            <p className="text-sm text-sky-600 dark:text-sky-400">
                              Showing first 50 of {result.unchangedLines} shared lines
                            </p>
                          </div>
                        )}
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

export default TextComparePage;