import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Copy, 
  Download, 
  Upload, 
  Search, 
  Network, 
  Code2, 
  FileText, 
  Zap,
  ChevronRight,
  ChevronDown,
  Braces,
  Hash,
  Type,
  List
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PageLayout } from "@/components/PageLayout";

// Tree node interface for JSON tree view
interface TreeNode {
  key: string;
  value: any;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  path: string;
  isExpanded?: boolean;
  children?: TreeNode[];
}

const JsonViewerPage = () => {
  const [input, setInput] = useState("");
  const [formatted, setFormatted] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [jsonObject, setJsonObject] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"formatted" | "tree">("formatted");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();

  // Convert JSON to tree structure
  const createTreeNode = useCallback((key: string, value: any, path: string): TreeNode => {
    const getType = (val: any): TreeNode['type'] => {
      if (val === null) return 'null';
      if (Array.isArray(val)) return 'array';
      return typeof val as TreeNode['type'];
    };

    const type = getType(value);
    const node: TreeNode = {
      key,
      value,
      type,
      path,
      isExpanded: expandedNodes.has(path)
    };

    if (type === 'object' && value !== null) {
      node.children = Object.entries(value).map(([k, v]) => 
        createTreeNode(k, v, `${path}.${k}`)
      );
    } else if (type === 'array') {
      node.children = value.map((v: any, i: number) => 
        createTreeNode(`[${i}]`, v, `${path}[${i}]`)
      );
    }

    return node;
  }, [expandedNodes]);

  // JSON validation with detailed errors
  const validateJson = (jsonString: string) => {
    const errors: string[] = [];
    try {
      JSON.parse(jsonString);
      return { isValid: true, errors: [] };
    } catch (error: any) {
      const message = error.message;
      if (message.includes('Unexpected token')) {
        errors.push(`Syntax error: ${message}`);
      } else if (message.includes('Unexpected end')) {
        errors.push('Incomplete JSON: Missing closing brackets or quotes');
      } else {
        errors.push(`Parse error: ${message}`);
      }
      return { isValid: false, errors };
    }
  };

  const formatJson = () => {
    const validation = validateJson(input);
    setValidationErrors(validation.errors);
    
    if (validation.isValid) {
      try {
        const parsed = JSON.parse(input);
        const formatted = JSON.stringify(parsed, null, 2);
        setFormatted(formatted);
        setJsonObject(parsed);
        setIsValid(true);
        toast({
          title: "Success! ✨",
          description: "JSON formatted successfully",
        });
      } catch (error) {
        setIsValid(false);
      }
    } else {
      setIsValid(false);
      toast({
        variant: "destructive",
        title: "Invalid JSON 🚫",
        description: `Found ${validation.errors.length} error(s)`,
      });
    }
  };

  const minifyJson = () => {
    const validation = validateJson(input);
    
    if (validation.isValid) {
      try {
        const parsed = JSON.parse(input);
        const minified = JSON.stringify(parsed);
        setFormatted(minified);
        setJsonObject(parsed);
        setIsValid(true);
        toast({
          title: "Minified! 🗜️",
          description: "JSON compressed successfully",
        });
      } catch (error) {
        setIsValid(false);
      }
    } else {
      setIsValid(false);
      setValidationErrors(validation.errors);
    }
  };

  // Toggle node expansion
  const toggleNodeExpansion = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  // Get JSON statistics
  const jsonStats = useMemo(() => {
    if (!jsonObject) return null;
    
    const countKeys = (obj: any): number => {
      if (Array.isArray(obj)) {
        return obj.reduce((sum, item) => sum + countKeys(item), 0);
      } else if (obj && typeof obj === 'object') {
        return Object.keys(obj).length + Object.values(obj).reduce((sum, val) => sum + countKeys(val), 0);
      }
      return 0;
    };

    const getDepth = (obj: any): number => {
      if (Array.isArray(obj)) {
        return 1 + Math.max(0, ...obj.map(getDepth));
      } else if (obj && typeof obj === 'object') {
        return 1 + Math.max(0, ...Object.values(obj).map(getDepth));
      }
      return 0;
    };

    return {
      size: JSON.stringify(jsonObject).length,
      keys: countKeys(jsonObject),
      depth: getDepth(jsonObject),
      type: Array.isArray(jsonObject) ? 'Array' : typeof jsonObject
    };
  }, [jsonObject]);

  // Syntax highlighting for JSON
  const highlightJson = (jsonStr: string) => {
    return jsonStr
      .replace(/"([^"]+)"\s*:/g, '<span class="text-syntax-property font-semibold">"$1":</span>')
      .replace(/:\s*"([^"]*)"/g, ': <span class="text-syntax-string">"$1"</span>')
      .replace(/:\s*(\d+\.?\d*)/g, ': <span class="text-syntax-number">$1</span>')
      .replace(/:\s*(true|false)/g, ': <span class="text-syntax-keyword font-semibold">$1</span>')
      .replace(/:\s*null/g, ': <span class="text-syntax-comment">null</span>');
  };

  // Tree node component
  const TreeNodeComponent = ({ node, level = 0 }: { node: TreeNode; level?: number }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.path);
    const indent = level * 24;

    const getValuePreview = (value: any, type: TreeNode['type']) => {
      switch (type) {
        case 'string':
          return `"${value.length > 50 ? value.substring(0, 50) + '...' : value}"`;
        case 'number':
        case 'boolean':
          return String(value);
        case 'null':
          return 'null';
        case 'array':
          return `Array(${value.length})`;
        case 'object':
          return `Object(${Object.keys(value).length})`;
        default:
          return String(value);
      }
    };

    const getTypeIcon = (type: TreeNode['type']) => {
      switch (type) {
        case 'object':
          return <Braces className="h-4 w-4 text-syntax-property" />;
        case 'array':
          return <List className="h-4 w-4 text-syntax-keyword" />;
        case 'string':
          return <Type className="h-4 w-4 text-syntax-string" />;
        case 'number':
          return <Hash className="h-4 w-4 text-syntax-number" />;
        case 'boolean':
          return <Zap className="h-4 w-4 text-syntax-keyword" />;
        default:
          return <FileText className="h-4 w-4 text-syntax-comment" />;
      }
    };

    return (
      <div className="font-mono text-sm">
        <div 
          className="flex items-center gap-2 py-1 px-2 hover:bg-accent/30 rounded cursor-pointer transition-colors"
          style={{ paddingLeft: `${8 + indent}px` }}
          onClick={() => hasChildren && toggleNodeExpansion(node.path)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <div className="w-4" />
          )}
          
          {getTypeIcon(node.type)}
          
          <span className="text-syntax-property font-semibold">
            {node.key}
          </span>
          
          <span className="text-muted-foreground">:</span>
          
          <span className={cn(
            "flex-1",
            node.type === 'string' && "text-syntax-string",
            node.type === 'number' && "text-syntax-number",
            node.type === 'boolean' && "text-syntax-keyword font-semibold",
            node.type === 'null' && "text-syntax-comment"
          )}>
            {getValuePreview(node.value, node.type)}
          </span>
          
          <Badge variant="outline" className="text-xs">
            {node.path}
          </Badge>
        </div>
        
        {hasChildren && isExpanded && node.children && (
          <div>
            {node.children.map((child, index) => (
              <TreeNodeComponent 
                key={`${child.path}-${index}`} 
                node={child} 
                level={level + 1} 
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(formatted);
    toast({
      title: "Copied! 📋",
      description: "JSON copied to clipboard",
    });
  };

  const downloadJson = () => {
    const blob = new Blob([formatted], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatted.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded! 💾",
      description: "JSON file saved successfully",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setInput(content);
        toast({
          title: "File loaded! 📁",
          description: `Loaded ${file.name}`,
        });
      };
      reader.readAsText(file);
    }
  };

  // Generate tree data
  const treeData = useMemo(() => {
    if (!jsonObject) return null;
    return createTreeNode('root', jsonObject, 'root');
  }, [jsonObject, createTreeNode]);

  // Search functionality
  const filteredTreeData = useMemo(() => {
    if (!treeData || !searchTerm) return treeData;
    
    // Simple search implementation - can be enhanced
    const searchInNode = (node: TreeNode): boolean => {
      const matchesKey = node.key.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesValue = String(node.value).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPath = node.path.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesKey || matchesValue || matchesPath || 
        (node.children?.some(searchInNode) ?? false);
    };

    return searchInNode(treeData) ? treeData : null;
  }, [treeData, searchTerm]);

  return (
    <PageLayout
      title="JSON Viewer & Formatter"
      description="Format and view JSON data"
      activeTool="json-viewer"
    >
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent tracking-tight">
            JSON Viewer & Formatter 🚀
          </h2>
          <p className="text-muted-foreground text-lg font-medium">
            Advanced JSON processing with tree view, syntax highlighting, and powerful analysis tools ✨
          </p>
        </div>

        {/* JSON Stats Banner */}
        {jsonStats && (
          <div className="bg-gradient-card border border-border/30 shadow-glass dark:shadow-glass-dark backdrop-blur-sm rounded-2xl p-6 relative overflow-hidden animate-fade-in">
            <div className="absolute inset-0 bg-gradient-glass opacity-20"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-6 justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-syntax-number">{jsonStats.size.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Bytes</div>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-syntax-property">{jsonStats.keys.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Keys</div>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-syntax-keyword">{jsonStats.depth}</div>
                  <div className="text-sm text-muted-foreground">Depth</div>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-syntax-string">{jsonStats.type}</div>
                  <div className="text-sm text-muted-foreground">Type</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Input Panel */}
          <Card className="xl:col-span-1 bg-gradient-card border border-border/30 shadow-glass dark:shadow-glass-dark backdrop-blur-sm relative overflow-hidden animate-fade-in">
            <div className="absolute inset-0 bg-gradient-glass opacity-20"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center justify-between text-lg font-bold">
                <div className="flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-syntax-keyword" />
                  Input JSON
                </div>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("file-upload")?.click()}
                    className="backdrop-blur-sm border-border/30 hover:bg-accent/60 transition-all duration-300 hover:scale-105"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                  {isValid !== null && (
                    <Badge 
                      variant={isValid ? "secondary" : "destructive"}
                      className={cn(
                        "backdrop-blur-sm font-semibold transition-all duration-300 animate-glow-pulse",
                        isValid ? "bg-success/20 text-success border-success/30" : "bg-destructive/20 text-destructive border-destructive/30"
                      )}
                    >
                      {isValid ? "✓ Valid" : "✗ Invalid"}
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='{"name": "awesome", "features": ["tree view", "search", "stats"], "version": 2.0}'
                className="min-h-[400px] font-mono bg-background/50 backdrop-blur-sm border-border/30 rounded-xl resize-none transition-all duration-300 focus:bg-background/70 focus:shadow-glow"
              />
              
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-destructive flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Validation Errors:
                  </h4>
                  {validationErrors.map((error, index) => (
                    <div key={index} className="text-sm text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">
                      {error}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-3">
                <Button 
                  onClick={formatJson}
                  className="bg-gradient-primary hover:shadow-glow transition-all duration-300 hover:scale-105 font-semibold flex-1"
                >
                  <Code2 className="h-4 w-4 mr-2" />
                  Format
                </Button>
                <Button 
                  variant="outline" 
                  onClick={minifyJson}
                  className="backdrop-blur-sm border-border/30 hover:bg-accent/60 transition-all duration-300 hover:scale-105 font-semibold flex-1"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Minify
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output Panel */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="bg-gradient-card border border-border/30 shadow-glass dark:shadow-glass-dark backdrop-blur-sm relative overflow-hidden animate-fade-in" style={{animationDelay: "0.2s"}}>
              <div className="absolute inset-0 bg-gradient-glass opacity-20"></div>
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold">
                    <Network className="h-5 w-5 text-syntax-property" />
                    JSON Output
                  </CardTitle>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      disabled={!formatted}
                      className="backdrop-blur-sm border-border/30 hover:bg-accent/60 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadJson}
                      disabled={!formatted}
                      className="backdrop-blur-sm border-border/30 hover:bg-accent/60 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                {formatted && (
                  <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "formatted" | "tree")}>
                    <div className="flex items-center justify-between mb-4">
                      <TabsList className="bg-background/50 backdrop-blur-sm">
                        <TabsTrigger value="formatted" className="flex items-center gap-2">
                          <Code2 className="h-4 w-4" />
                          Formatted
                        </TabsTrigger>
                        <TabsTrigger value="tree" className="flex items-center gap-2">
                          <Network className="h-4 w-4" />
                          Tree View
                        </TabsTrigger>
                      </TabsList>
                      
                      {viewMode === "tree" && (
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search JSON paths..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-64 bg-background/50 backdrop-blur-sm border-border/30"
                          />
                        </div>
                      )}
                    </div>
                    
                    <TabsContent value="formatted" className="mt-0">
                      <div className="bg-background/30 backdrop-blur-sm border border-border/30 rounded-xl p-4 max-h-[600px] overflow-auto">
                        <pre 
                          className="font-mono text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: highlightJson(formatted) }}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="tree" className="mt-0">
                      <div className="bg-background/30 backdrop-blur-sm border border-border/30 rounded-xl max-h-[600px] overflow-auto">
                        {filteredTreeData ? (
                          <TreeNodeComponent node={filteredTreeData} />
                        ) : (
                          <div className="p-4 text-center text-muted-foreground">
                            {searchTerm ? "No matching results found" : "No valid JSON data"}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
                
                {!formatted && (
                  <div className="bg-muted/30 backdrop-blur-sm border border-border/30 rounded-xl p-8 text-center">
                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-full flex items-center justify-center">
                        <Code2 className="h-8 w-8 text-primary-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold">Ready to Process JSON</h3>
                      <p className="text-muted-foreground">
                        Paste your JSON data in the input panel and click Format or Minify to see the magic happen! ✨
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default JsonViewerPage;