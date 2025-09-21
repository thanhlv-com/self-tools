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
  AlertCircle
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Comparison Results
                <Badge variant={comparisonResult.similarity > 80 ? "secondary" : "outline"}>
                  {comparisonResult.similarity}% Similar
                </Badge>
              </CardTitle>
              <CardDescription>
                Analysis of differences between {comparisonResult.documents.length} documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="added">Added ({differencesByType.added.length})</TabsTrigger>
                  <TabsTrigger value="removed">Removed ({differencesByType.removed.length})</TabsTrigger>
                  <TabsTrigger value="unchanged">Unchanged ({differencesByType.unchanged.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="summary" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 p-4 rounded-lg border">
                      <Plus className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Added</p>
                        <p className="text-2xl font-bold text-green-500">{differencesByType.added.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-4 rounded-lg border">
                      <Minus className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium">Removed</p>
                        <p className="text-2xl font-bold text-red-500">{differencesByType.removed.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-4 rounded-lg border">
                      <Equal className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Unchanged</p>
                        <p className="text-2xl font-bold text-blue-500">{differencesByType.unchanged.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      <span className="font-medium">Similarity Score</span>
                    </div>
                    <Progress value={comparisonResult.similarity} className="w-full" />
                    <p className="text-sm text-muted-foreground">
                      {comparisonResult.similarity}% of content is similar between documents
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="added">
                  {differencesByType.added.length === 0 ? (
                    <p className="text-muted-foreground">No added content</p>
                  ) : (
                    <div className="space-y-2">
                      {differencesByType.added.map((diff, index) => (
                        <div key={index} className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                          <div className="flex items-start gap-2">
                            <Plus className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              {diff.lineNumber && (
                                <span className="text-xs text-green-600 dark:text-green-400 font-mono">
                                  Line {diff.lineNumber}:
                                </span>
                              )}
                              <p className="text-sm font-mono text-green-700 dark:text-green-300 whitespace-pre-wrap break-words">
                                {diff.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="removed">
                  {differencesByType.removed.length === 0 ? (
                    <p className="text-muted-foreground">No removed content</p>
                  ) : (
                    <div className="space-y-2">
                      {differencesByType.removed.map((diff, index) => (
                        <div key={index} className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                          <div className="flex items-start gap-2">
                            <Minus className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              {diff.lineNumber && (
                                <span className="text-xs text-red-600 dark:text-red-400 font-mono">
                                  Line {diff.lineNumber}:
                                </span>
                              )}
                              <p className="text-sm font-mono text-red-700 dark:text-red-300 whitespace-pre-wrap break-words">
                                {diff.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="unchanged">
                  {differencesByType.unchanged.length === 0 ? (
                    <p className="text-muted-foreground">No unchanged content</p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {differencesByType.unchanged.slice(0, 50).map((diff, index) => (
                        <div key={index} className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start gap-2">
                            <Equal className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              {diff.lineNumber && (
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                                  Line {diff.lineNumber}:
                                </span>
                              )}
                              <p className="text-sm font-mono text-blue-700 dark:text-blue-300 whitespace-pre-wrap break-words">
                                {diff.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {differencesByType.unchanged.length > 50 && (
                        <p className="text-center text-sm text-muted-foreground py-2">
                          Showing first 50 of {differencesByType.unchanged.length} unchanged lines
                        </p>
                      )}
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

export default WordComparePage;