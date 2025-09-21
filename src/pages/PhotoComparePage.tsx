import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  CheckCircle, 
  Layers, 
  ArrowLeftRight,
  Sparkles,
  Target,
  Zap,
  XCircle,
  Eye,
  Maximize,
  Download,
  Info,
  Palette,
  Grid,
  MousePointer,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageLayout } from "@/components/PageLayout";

interface ImageFile {
  file: File;
  url: string;
  width: number;
  height: number;
  size: number;
  name: string;
}

interface ComparisonResult {
  similarity: number;
  differences: number;
  resolution1: string;
  resolution2: string;
  sizeDiff: number;
  formatMatch: boolean;
  differenceMap?: ImageData;
}

const PhotoComparePage = () => {
  const [image1, setImage1] = useState<ImageFile | null>(null);
  const [image2, setImage2] = useState<ImageFile | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'overlay' | 'difference'>('split');
  const [zoomLevel, setZoomLevel] = useState(1);
  const { toast } = useToast();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const file1InputRef = useRef<HTMLInputElement>(null);
  const file2InputRef = useRef<HTMLInputElement>(null);

  const loadImage = useCallback((file: File): Promise<ImageFile> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        resolve({
          file,
          url,
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: file.size,
          name: file.name
        });
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }, []);

  const handleFileUpload = useCallback(async (file: File, isFirst: boolean) => {
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please select a valid image file",
      });
      return;
    }

    try {
      const imageFile = await loadImage(file);
      if (isFirst) {
        setImage1(imageFile);
      } else {
        setImage2(imageFile);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Loading Image",
        description: "Failed to load the selected image",
      });
    }
  }, [loadImage, toast]);

  const calculateImageDifference = useCallback((img1: HTMLImageElement, img2: HTMLImageElement): ComparisonResult => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas not available');

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    // Set canvas size to the larger of the two images
    const maxWidth = Math.max(img1.naturalWidth, img2.naturalWidth);
    const maxHeight = Math.max(img1.naturalHeight, img2.naturalHeight);
    canvas.width = maxWidth;
    canvas.height = maxHeight;

    // Draw first image
    ctx.clearRect(0, 0, maxWidth, maxHeight);
    ctx.drawImage(img1, 0, 0);
    const imageData1 = ctx.getImageData(0, 0, maxWidth, maxHeight);

    // Draw second image
    ctx.clearRect(0, 0, maxWidth, maxHeight);
    ctx.drawImage(img2, 0, 0);
    const imageData2 = ctx.getImageData(0, 0, maxWidth, maxHeight);

    // Calculate differences
    const data1 = imageData1.data;
    const data2 = imageData2.data;
    const diffData = new ImageData(maxWidth, maxHeight);
    const diffArray = diffData.data;

    let differentPixels = 0;
    const totalPixels = maxWidth * maxHeight;

    for (let i = 0; i < data1.length; i += 4) {
      const r1 = data1[i];
      const g1 = data1[i + 1];
      const b1 = data1[i + 2];
      const a1 = data1[i + 3];

      const r2 = data2[i];
      const g2 = data2[i + 1];
      const b2 = data2[i + 2];
      const a2 = data2[i + 3];

      const rDiff = Math.abs(r1 - r2);
      const gDiff = Math.abs(g1 - g2);
      const bDiff = Math.abs(b1 - b2);
      const aDiff = Math.abs(a1 - a2);

      const threshold = 10; // Sensitivity threshold
      const isDifferent = rDiff > threshold || gDiff > threshold || bDiff > threshold || aDiff > threshold;

      if (isDifferent) {
        differentPixels++;
        // Highlight differences in red
        diffArray[i] = 255;     // R
        diffArray[i + 1] = 0;   // G
        diffArray[i + 2] = 0;   // B
        diffArray[i + 3] = 255; // A
      } else {
        // Keep original pixel but dimmed
        diffArray[i] = Math.floor((r1 + r2) / 4);
        diffArray[i + 1] = Math.floor((g1 + g2) / 4);
        diffArray[i + 2] = Math.floor((b1 + b2) / 4);
        diffArray[i + 3] = 100;
      }
    }

    const similarity = Math.round(((totalPixels - differentPixels) / totalPixels) * 100);
    const sizeDiff = Math.abs(image1!.size - image2!.size);
    const formatMatch = image1!.file.type === image2!.file.type;

    return {
      similarity,
      differences: differentPixels,
      resolution1: `${img1.naturalWidth}x${img1.naturalHeight}`,
      resolution2: `${img2.naturalWidth}x${img2.naturalHeight}`,
      sizeDiff,
      formatMatch,
      differenceMap: diffData
    };
  }, [image1, image2]);

  const compareImages = useCallback(async () => {
    if (!image1 || !image2) return;

    setIsProcessing(true);
    
    try {
      // Load images for processing
      const img1 = new Image();
      const img2 = new Image();
      
      await Promise.all([
        new Promise((resolve, reject) => {
          img1.onload = resolve;
          img1.onerror = reject;
          img1.src = image1.url;
        }),
        new Promise((resolve, reject) => {
          img2.onload = resolve;
          img2.onerror = reject;
          img2.src = image2.url;
        })
      ]);

      const comparisonResult = calculateImageDifference(img1, img2);
      setResult(comparisonResult);
      
      toast({
        title: "Comparison Complete",
        description: `${comparisonResult.similarity}% similarity found`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Comparison Failed",
        description: "Failed to compare images",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [image1, image2, calculateImageDifference, toast]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearImages = () => {
    if (image1) URL.revokeObjectURL(image1.url);
    if (image2) URL.revokeObjectURL(image2.url);
    setImage1(null);
    setImage2(null);
    setResult(null);
    setZoomLevel(1);
  };

  const downloadDifferenceMap = () => {
    if (!result?.differenceMap || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.putImageData(result.differenceMap, 0, 0);
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'image-differences.png';
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <PageLayout
      title="Photo Comparison Tool"
      description="Compare two images and analyze visual differences"
      activeTool="photo-compare"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Photo Comparison Tool</h2>
          <p className="text-muted-foreground">Upload and compare two images to identify visual differences</p>
        </div>

        {/* Image Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-blue-500" />
                Image 1 (Original)
              </CardTitle>
              <CardDescription>First image to compare</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!image1 ? (
                  <div 
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => file1InputRef.current?.click()}
                  >
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium">Drop image here or click to browse</p>
                    <p className="text-sm text-muted-foreground">Supports JPG, PNG, WebP, GIF</p>
                    <input
                      ref={file1InputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], true)}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden border">
                      <img 
                        src={image1.url} 
                        alt="Image 1" 
                        className="w-full h-48 object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          URL.revokeObjectURL(image1.url);
                          setImage1(null);
                          setResult(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><strong>Name:</strong> {image1.name}</p>
                      <p><strong>Size:</strong> {formatFileSize(image1.size)}</p>
                      <p><strong>Resolution:</strong> {image1.width}x{image1.height}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-green-500" />
                Image 2 (Comparison)
              </CardTitle>
              <CardDescription>Second image to compare</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!image2 ? (
                  <div 
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => file2InputRef.current?.click()}
                  >
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium">Drop image here or click to browse</p>
                    <p className="text-sm text-muted-foreground">Supports JPG, PNG, WebP, GIF</p>
                    <input
                      ref={file2InputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], false)}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden border">
                      <img 
                        src={image2.url} 
                        alt="Image 2" 
                        className="w-full h-48 object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          URL.revokeObjectURL(image2.url);
                          setImage2(null);
                          setResult(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><strong>Name:</strong> {image2.name}</p>
                      <p><strong>Size:</strong> {formatFileSize(image2.size)}</p>
                      <p><strong>Resolution:</strong> {image2.width}x{image2.height}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button 
            onClick={compareImages} 
            disabled={!image1 || !image2 || isProcessing}
            size="lg"
            className="min-w-[200px]"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Layers className="h-4 w-4 mr-2" />
                Compare Images
              </>
            )}
          </Button>
          
          {(image1 || image2) && (
            <Button variant="outline" onClick={clearImages}>
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        {/* Comparison Results */}
        {result && image1 && image2 && (
          <div className="space-y-6">
            {/* Hero Results Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-purple-100 dark:border-slate-700">
              <div className="relative p-8">
                <div className="text-center space-y-6">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-600/20">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Image Comparison Complete</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {result.similarity}%
                      </div>
                      <div className="text-xl text-slate-600 dark:text-slate-300">
                        {result.similarity >= 95 ? 'Nearly Identical' :
                         result.similarity >= 85 ? 'Very Similar' :
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
                          {result.similarity >= 90 ? <CheckCircle className="h-8 w-8 text-green-500" /> :
                           result.similarity >= 70 ? <Target className="h-8 w-8 text-yellow-500" /> :
                           <XCircle className="h-8 w-8 text-red-500" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-slate-800/60 rounded-lg backdrop-blur-sm">
                      <ImageIcon className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">{image1.name}</span>
                    </div>
                    <ArrowLeftRight className="h-4 w-4 text-slate-400" />
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-slate-800/60 rounded-lg backdrop-blur-sm">
                      <ImageIcon className="h-4 w-4 text-pink-500" />
                      <span className="font-medium">{image2.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-xl bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/30 dark:to-rose-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                    <Palette className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-red-700 dark:text-red-300">
                    {result.differences.toLocaleString()}
                  </div>
                  <div className="font-semibold text-red-800 dark:text-red-200">
                    Different Pixels
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Pixels that vary between images
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-950/30 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <Grid className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {result.resolution1}
                  </div>
                  <div className="font-semibold text-blue-800 dark:text-blue-200">
                    vs {result.resolution2}
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Image resolutions
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950/30 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                    <Info className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {formatFileSize(result.sizeDiff)}
                  </div>
                  <div className="font-semibold text-amber-800 dark:text-amber-200">
                    Size Difference
                  </div>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    File size variation
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {result.formatMatch ? 'Yes' : 'No'}
                  </div>
                  <div className="font-semibold text-green-800 dark:text-green-200">
                    Format Match
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Same file format
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Comparison Tabs */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Eye className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Visual Comparison</CardTitle>
                    <CardDescription>Explore the differences between your images</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="sidebyside" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 p-1 bg-slate-100 dark:bg-slate-800">
                    <TabsTrigger value="sidebyside" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                      <Layers className="h-4 w-4" />
                      <span className="hidden sm:inline">Side by Side</span>
                      <span className="sm:hidden">Compare</span>
                    </TabsTrigger>
                    <TabsTrigger value="overlay" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                      <MousePointer className="h-4 w-4" />
                      <span className="hidden sm:inline">Overlay</span>
                      <span className="sm:hidden">Overlay</span>
                    </TabsTrigger>
                    <TabsTrigger value="difference" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                      <Zap className="h-4 w-4" />
                      <span className="hidden sm:inline">Differences</span>
                      <span className="sm:hidden">Diff</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="sidebyside" className="mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Side by Side Comparison</h3>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                          >
                            -
                          </Button>
                          <span className="text-sm font-medium min-w-[4rem] text-center">
                            {Math.round(zoomLevel * 100)}%
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 max-h-[600px] overflow-auto border rounded-lg p-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-purple-600">Original Image</h4>
                          <div className="border rounded-lg overflow-hidden">
                            <img 
                              src={image1.url} 
                              alt="Original" 
                              className="w-full h-auto"
                              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium text-pink-600">Comparison Image</h4>
                          <div className="border rounded-lg overflow-hidden">
                            <img 
                              src={image2.url} 
                              alt="Comparison" 
                              className="w-full h-auto"
                              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="overlay" className="mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Overlay Comparison</h3>
                        <p className="text-sm text-muted-foreground">Move mouse over image to reveal differences</p>
                      </div>
                      
                      <div className="relative max-h-[600px] overflow-auto border rounded-lg">
                        <div 
                          className="relative group cursor-crosshair"
                          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
                        >
                          <img 
                            src={image1.url} 
                            alt="Base" 
                            className="w-full h-auto"
                          />
                          <img 
                            src={image2.url} 
                            alt="Overlay" 
                            className="absolute top-0 left-0 w-full h-auto opacity-0 group-hover:opacity-70 transition-opacity duration-300"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="difference" className="mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Difference Map</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadDifferenceMap}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Red areas indicate differences between the images. Similar areas are dimmed.
                        </p>
                        <div className="border rounded-lg overflow-hidden max-h-[600px] overflow-auto">
                          <canvas
                            ref={canvasRef}
                            className="w-full h-auto"
                            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </PageLayout>
  );
};

export default PhotoComparePage;