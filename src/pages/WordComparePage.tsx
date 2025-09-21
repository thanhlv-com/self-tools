import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  Minus, 
  Equal, 
  Upload, 
  X, 
  FileText, 
  Hash,
  BarChart3,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  ArrowLeftRight,
  Eye,
  TrendingUp,
  FileCheck,
  Zap,
  Target,
  Layers,
  PieChart,
  Calendar,
  Users,
  Globe,
  Sparkles,
  ArrowRight,
  ChevronRight,
  MousePointer,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageLayout } from "@/components/PageLayout";
import { useWordProcessor } from "@/hooks/useWordProcessor";
import { formatFileSize } from "@/lib/wordUtils";

const WordComparePage = () => {
  const {
    documents,
    comparisonResult,
    isProcessing,
    error,
    addMultipleDocuments,
    removeDocument,
    clearDocuments,
    compareDocuments,
    clearError,
    canCompare
  } = useWordProcessor();
  
  const { toast } = useToast();

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      addMultipleDocuments(files);
    }
    // Reset the input value to allow re-uploading the same file
    event.target.value = '';
  }, [addMultipleDocuments]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      addMultipleDocuments(files);
    }
  }, [addMultipleDocuments]);

  const handleCompare = () => {
    compareDocuments();
    toast({
      title: "Comparison Complete",
      description: comparisonResult ? 
        `${comparisonResult.similarity}% similarity found` : 
        "Documents compared successfully",
    });
  };

  const getDifferencesByType = () => {
    if (!comparisonResult) return { added: [], removed: [], unchanged: [] };
    
    const result = { 
      added: [] as typeof comparisonResult.differences, 
      removed: [] as typeof comparisonResult.differences, 
      unchanged: [] as typeof comparisonResult.differences 
    };
    
    comparisonResult.differences.forEach(diff => {
      result[diff.type].push(diff);
    });
    
    return result;
  };

  const differencesByType = getDifferencesByType();

  return (
    <PageLayout
      title="Word Document Comparison"
      description="Compare multiple Word documents to find differences"
      activeTool="word-compare"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Word Document Comparison</h2>
          <p className="text-muted-foreground">Upload and compare 2 or more Word documents (.docx) to identify differences</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              {error}
              <Button variant="ghost" size="sm" onClick={clearError}>
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Word Documents
            </CardTitle>
            <CardDescription>
              Select multiple .docx files to compare. Supports drag and drop.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Drop Word files here or click to browse</p>
                <p className="text-sm text-muted-foreground">Supports .docx files only</p>
                <input
                  type="file"
                  multiple
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="word-file-input"
                />
                <div className="flex gap-2 justify-center">
                  <Button asChild variant="outline">
                    <label htmlFor="word-file-input" className="cursor-pointer">
                      Select Files
                    </label>
                  </Button>
                  {documents.length > 0 && (
                    <Button variant="destructive" onClick={clearDocuments}>
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {isProcessing && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Processing documents...</span>
                </div>
                <Progress value={undefined} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Uploaded Documents */}
        {documents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Uploaded Documents ({documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documents.map((doc, index) => (
                  <div key={`${doc.filename}-${index}`} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.filename}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{doc.wordCount} words</span>
                          <span>{formatFileSize(doc.size)}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(doc.filename)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-6">
                <Button 
                  onClick={handleCompare}
                  disabled={!canCompare || isProcessing}
                  size="lg"
                  className="min-w-[200px]"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Compare Documents
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comparison Results */}
        {comparisonResult && (
          <div className="space-y-8">
            {/* Hero Results Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-indigo-100 dark:border-slate-700">
              <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
              <div className="relative p-8">
                <div className="text-center space-y-6">
                  {/* Main Similarity Score */}
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-600/20">
                      <Sparkles className="h-4 w-4 text-indigo-500" />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Comparison Complete</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                        {comparisonResult.similarity}%
                      </div>
                      <div className="text-xl text-slate-600 dark:text-slate-300">
                        {comparisonResult.similarity >= 90 ? 'Nearly Identical' :
                         comparisonResult.similarity >= 70 ? 'Quite Similar' :
                         comparisonResult.similarity >= 50 ? 'Somewhat Different' : 'Very Different'}
                      </div>
                    </div>

                    {/* Visual Similarity Ring */}
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
                            className={`${
                              comparisonResult.similarity >= 90 ? 'stroke-green-500' :
                              comparisonResult.similarity >= 70 ? 'stroke-yellow-500' :
                              comparisonResult.similarity >= 50 ? 'stroke-orange-500' : 'stroke-red-500'
                            }`}
                            strokeDasharray={`${comparisonResult.similarity * 3.14} 314`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          {comparisonResult.similarity >= 90 ? <CheckCircle className="h-8 w-8 text-green-500" /> :
                           comparisonResult.similarity >= 70 ? <Target className="h-8 w-8 text-yellow-500" /> :
                           comparisonResult.similarity >= 50 ? <Info className="h-8 w-8 text-orange-500" /> : 
                           <XCircle className="h-8 w-8 text-red-500" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Document Names */}
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-slate-800/60 rounded-lg backdrop-blur-sm">
                      <FileText className="h-4 w-4 text-indigo-500" />
                      <span className="font-medium truncate max-w-32">{comparisonResult.documents[0]?.filename}</span>
                    </div>
                    <ArrowLeftRight className="h-4 w-4 text-slate-400" />
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-slate-800/60 rounded-lg backdrop-blur-sm">
                      <FileText className="h-4 w-4 text-cyan-500" />
                      <span className="font-medium truncate max-w-32">{comparisonResult.documents[1]?.filename}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Added Content Card */}
              <div className="group cursor-pointer">
                <div className="h-full p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950/30 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800 hover:shadow-lg hover:shadow-emerald-200/50 dark:hover:shadow-emerald-900/20 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                      <Plus className="h-6 w-6 text-emerald-600" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                      {differencesByType.added.length}
                    </div>
                    <div className="font-semibold text-emerald-800 dark:text-emerald-200">
                      Added Lines
                    </div>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      New content in the second document
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                    <MousePointer className="h-3 w-3" />
                    <span>Click to explore</span>
                  </div>
                </div>
              </div>

              {/* Removed Content Card */}
              <div className="group cursor-pointer">
                <div className="h-full p-6 rounded-xl bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-950/30 dark:to-red-900/20 border border-rose-200 dark:border-rose-800 hover:shadow-lg hover:shadow-rose-200/50 dark:hover:shadow-rose-900/20 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-900/30">
                      <Minus className="h-6 w-6 text-rose-600" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-rose-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-rose-700 dark:text-rose-300">
                      {differencesByType.removed.length}
                    </div>
                    <div className="font-semibold text-rose-800 dark:text-rose-200">
                      Removed Lines
                    </div>
                    <p className="text-sm text-rose-600 dark:text-rose-400">
                      Content missing from the second document
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                    <MousePointer className="h-3 w-3" />
                    <span>Click to explore</span>
                  </div>
                </div>
              </div>

              {/* Shared Content Card */}
              <div className="group cursor-pointer">
                <div className="h-full p-6 rounded-xl bg-gradient-to-br from-sky-50 to-blue-100 dark:from-sky-950/30 dark:to-blue-900/20 border border-sky-200 dark:border-sky-800 hover:shadow-lg hover:shadow-sky-200/50 dark:hover:shadow-sky-900/20 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-sky-100 dark:bg-sky-900/30">
                      <Equal className="h-6 w-6 text-sky-600" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-sky-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-sky-700 dark:text-sky-300">
                      {differencesByType.unchanged.length}
                    </div>
                    <div className="font-semibold text-sky-800 dark:text-sky-200">
                      Shared Lines
                    </div>
                    <p className="text-sm text-sky-600 dark:text-sky-400">
                      Identical content in both documents
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-sky-600 dark:text-sky-400">
                    <MousePointer className="h-3 w-3" />
                    <span>Click to explore</span>
                  </div>
                </div>
              </div>

              {/* Total Changes Card */}
              <div className="group cursor-pointer">
                <div className="h-full p-6 rounded-xl bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-950/30 dark:to-purple-900/20 border border-violet-200 dark:border-violet-800 hover:shadow-lg hover:shadow-violet-200/50 dark:hover:shadow-violet-900/20 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                      <Zap className="h-6 w-6 text-violet-600" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-violet-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-violet-700 dark:text-violet-300">
                      {differencesByType.added.length + differencesByType.removed.length}
                    </div>
                    <div className="font-semibold text-violet-800 dark:text-violet-200">
                      Total Changes
                    </div>
                    <p className="text-sm text-violet-600 dark:text-violet-400">
                      All modifications between documents
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
                    <MousePointer className="h-3 w-3" />
                    <span>Click to explore</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Insights */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                    <PieChart className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Smart Analysis</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">AI-powered insights about your documents</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Similarity Breakdown */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Target className="h-4 w-4 text-indigo-500" />
                      Document Similarity Breakdown
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Shared Content</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${Math.min(100, (differencesByType.unchanged.length / Math.max(1, differencesByType.unchanged.length + differencesByType.added.length + differencesByType.removed.length)) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-emerald-600">
                            {Math.round((differencesByType.unchanged.length / Math.max(1, differencesByType.unchanged.length + differencesByType.added.length + differencesByType.removed.length)) * 100)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Differences</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-rose-500 rounded-full transition-all duration-1000 ease-out delay-200"
                              style={{ width: `${Math.min(100, ((differencesByType.added.length + differencesByType.removed.length) / Math.max(1, differencesByType.unchanged.length + differencesByType.added.length + differencesByType.removed.length)) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-rose-600">
                            {Math.round(((differencesByType.added.length + differencesByType.removed.length) / Math.max(1, differencesByType.unchanged.length + differencesByType.added.length + differencesByType.removed.length)) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Insights */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-cyan-500" />
                      Key Insights
                    </h4>
                    <div className="space-y-3">
                      {comparisonResult.similarity >= 90 && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                          <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Almost Identical</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">These documents are nearly the same with only minor variations.</p>
                          </div>
                        </div>
                      )}
                      
                      {comparisonResult.similarity >= 70 && comparisonResult.similarity < 90 && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                          <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Good Match</p>
                            <p className="text-xs text-amber-600 dark:text-amber-400">Strong similarities with some notable differences worth reviewing.</p>
                          </div>
                        </div>
                      )}
                      
                      {comparisonResult.similarity < 70 && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20">
                          <XCircle className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-rose-800 dark:text-rose-200">Significant Differences</p>
                            <p className="text-xs text-rose-600 dark:text-rose-400">These documents have major differences and limited shared content.</p>
                          </div>
                        </div>
                      )}

                      {differencesByType.added.length > differencesByType.removed.length && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-sky-50 dark:bg-sky-950/20">
                          <Plus className="h-4 w-4 text-sky-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-sky-800 dark:text-sky-200">Content Expansion</p>
                            <p className="text-xs text-sky-600 dark:text-sky-400">The second document has more content than the first.</p>
                          </div>
                        </div>
                      )}

                      {differencesByType.removed.length > differencesByType.added.length && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                          <Minus className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Content Reduction</p>
                            <p className="text-xs text-orange-600 dark:text-orange-400">The second document has less content than the first.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Exploration Tabs */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                    <Search className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle>Detailed Exploration</CardTitle>
                    <CardDescription>Deep dive into the specific changes between documents</CardDescription>
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
                      <span className="hidden sm:inline">Added ({differencesByType.added.length})</span>
                      <span className="sm:hidden">+{differencesByType.added.length}</span>
                    </TabsTrigger>
                    <TabsTrigger value="removed" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                      <Minus className="h-4 w-4" />
                      <span className="hidden sm:inline">Removed ({differencesByType.removed.length})</span>
                      <span className="sm:hidden">-{differencesByType.removed.length}</span>
                    </TabsTrigger>
                    <TabsTrigger value="unchanged" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                      <Equal className="h-4 w-4" />
                      <span className="hidden sm:inline">Shared ({differencesByType.unchanged.length})</span>
                      <span className="sm:hidden">={differencesByType.unchanged.length}</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="sidebyside" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg">
                          <FileText className="h-4 w-4 text-indigo-600" />
                          <span className="font-medium text-indigo-800 dark:text-indigo-200 truncate">
                            {comparisonResult.documents[0]?.filename}
                          </span>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b">
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                              {comparisonResult.documents[0]?.wordCount} words
                            </span>
                          </div>
                          <div className="p-4 bg-white dark:bg-slate-900 max-h-96 overflow-y-auto">
                            <div className="space-y-1 text-sm font-mono">
                              {comparisonResult.documents[0]?.content.split('\n').map((line, index) => (
                                <div key={index} className="flex hover:bg-slate-50 dark:hover:bg-slate-800 rounded px-2 py-1">
                                  <span className="text-slate-400 mr-4 select-none min-w-[2.5rem] text-right">
                                    {index + 1}
                                  </span>
                                  <span className="whitespace-pre-wrap break-words flex-1">{line || ' '}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg">
                          <FileText className="h-4 w-4 text-cyan-600" />
                          <span className="font-medium text-cyan-800 dark:text-cyan-200 truncate">
                            {comparisonResult.documents[1]?.filename}
                          </span>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b">
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                              {comparisonResult.documents[1]?.wordCount} words
                            </span>
                          </div>
                          <div className="p-4 bg-white dark:bg-slate-900 max-h-96 overflow-y-auto">
                            <div className="space-y-1 text-sm font-mono">
                              {comparisonResult.documents[1]?.content.split('\n').map((line, index) => (
                                <div key={index} className="flex hover:bg-slate-50 dark:hover:bg-slate-800 rounded px-2 py-1">
                                  <span className="text-slate-400 mr-4 select-none min-w-[2.5rem] text-right">
                                    {index + 1}
                                  </span>
                                  <span className="whitespace-pre-wrap break-words flex-1">{line || ' '}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="added" className="mt-6">
                    {differencesByType.added.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">No New Content</h3>
                        <p className="text-slate-600 dark:text-slate-400">The second document doesn't contain any additional lines.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                          <Plus className="h-5 w-5 text-emerald-600" />
                          <div>
                            <h3 className="font-semibold text-emerald-800 dark:text-emerald-200">
                              {differencesByType.added.length} lines added
                            </h3>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">
                              Content that appears in <strong>{comparisonResult.documents[1]?.filename}</strong> but not in <strong>{comparisonResult.documents[0]?.filename}</strong>
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {differencesByType.added.map((diff, index) => (
                            <div key={index} className="group p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 hover:shadow-md transition-all">
                              <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex-shrink-0">
                                  <Plus className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  {diff.lineNumber && (
                                    <div className="flex items-center gap-2 mb-3">
                                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                        Line {diff.lineNumber}
                                      </span>
                                    </div>
                                  )}
                                  <p className="text-sm text-emerald-800 dark:text-emerald-200 whitespace-pre-wrap break-words leading-relaxed bg-white dark:bg-emerald-950/10 p-3 rounded border border-emerald-200 dark:border-emerald-800">
                                    {diff.text}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="removed" className="mt-6">
                    {differencesByType.removed.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">No Content Removed</h3>
                        <p className="text-slate-600 dark:text-slate-400">All content from the first document is preserved in the second.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/20 rounded-lg">
                          <Minus className="h-5 w-5 text-rose-600" />
                          <div>
                            <h3 className="font-semibold text-rose-800 dark:text-rose-200">
                              {differencesByType.removed.length} lines removed
                            </h3>
                            <p className="text-sm text-rose-600 dark:text-rose-400">
                              Content that appears in <strong>{comparisonResult.documents[0]?.filename}</strong> but not in <strong>{comparisonResult.documents[1]?.filename}</strong>
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {differencesByType.removed.map((diff, index) => (
                            <div key={index} className="group p-4 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 hover:shadow-md transition-all">
                              <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex-shrink-0">
                                  <Minus className="h-4 w-4 text-rose-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  {diff.lineNumber && (
                                    <div className="flex items-center gap-2 mb-3">
                                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-rose-100 dark:bg-rose-900/30 text-xs font-medium text-rose-700 dark:text-rose-300">
                                        Line {diff.lineNumber}
                                      </span>
                                    </div>
                                  )}
                                  <p className="text-sm text-rose-800 dark:text-rose-200 whitespace-pre-wrap break-words leading-relaxed bg-white dark:bg-rose-950/10 p-3 rounded border border-rose-200 dark:border-rose-800">
                                    {diff.text}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="unchanged" className="mt-6">
                    {differencesByType.unchanged.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <XCircle className="h-8 w-8 text-rose-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">No Shared Content</h3>
                        <p className="text-slate-600 dark:text-slate-400">These documents have completely different content.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-sky-50 dark:bg-sky-950/20 rounded-lg">
                          <Equal className="h-5 w-5 text-sky-600" />
                          <div>
                            <h3 className="font-semibold text-sky-800 dark:text-sky-200">
                              {differencesByType.unchanged.length} shared lines
                            </h3>
                            <p className="text-sm text-sky-600 dark:text-sky-400">
                              Content that is identical in both documents
                            </p>
                          </div>
                        </div>
                        <div className="max-h-96 overflow-y-auto space-y-3">
                          {differencesByType.unchanged.slice(0, 50).map((diff, index) => (
                            <div key={index} className="group p-4 rounded-lg bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 hover:shadow-md transition-all">
                              <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex-shrink-0">
                                  <Equal className="h-4 w-4 text-sky-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  {diff.lineNumber && (
                                    <div className="flex items-center gap-2 mb-3">
                                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-sky-100 dark:bg-sky-900/30 text-xs font-medium text-sky-700 dark:text-sky-300">
                                        Line {diff.lineNumber}
                                      </span>
                                    </div>
                                  )}
                                  <p className="text-sm text-sky-800 dark:text-sky-200 whitespace-pre-wrap break-words leading-relaxed bg-white dark:bg-sky-950/10 p-3 rounded border border-sky-200 dark:border-sky-800">
                                    {diff.text}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {differencesByType.unchanged.length > 50 && (
                          <div className="text-center py-4 border-t border-sky-200 dark:border-sky-800">
                            <p className="text-sm text-sky-600 dark:text-sky-400">
                              Showing first 50 of {differencesByType.unchanged.length} shared lines
                            </p>
                            <button className="mt-2 text-xs text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300 underline">
                              Load more...
                            </button>
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

export default WordComparePage;