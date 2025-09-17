import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, Trash2, Image as ImageIcon, X, Zap, Archive } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import { PageLayout } from "@/components/PageLayout";

interface ImageFile {
  id: string;
  file: File;
  originalSize: number;
  compressedSize?: number;
  compressedBlob?: Blob;
  progress: number;
  status: "pending" | "processing" | "completed" | "error";
  preview: string;
}

const ImageCompressorPage = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [quality, setQuality] = useState([0.8]);
  const [format, setFormat] = useState("jpeg");
  const [maxWidth, setMaxWidth] = useState("original");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    handleFiles(files);
  }, []);

  const handleFiles = (files: File[]) => {
    const newImages: ImageFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      originalSize: file.size,
      progress: 0,
      status: "pending",
      preview: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const compressImage = async (image: ImageFile): Promise<void> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      img.onload = () => {
        let { width, height } = img;

        // Apply maximum width constraint
        if (maxWidth !== 'original') {
          const maxWidthNum = parseInt(maxWidth);
          if (width > maxWidthNum) {
            const ratio = maxWidthNum / width;
            width = maxWidthNum;
            height = height * ratio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with specified quality and format
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            setImages(prev => prev.map(img => 
              img.id === image.id 
                ? { 
                    ...img, 
                    status: "completed" as const, 
                    progress: 100,
                    compressedSize: blob.size,
                    compressedBlob: blob
                  } 
                : img
            ));

            resolve();
          },
          format === 'png' ? 'image/png' : 'image/jpeg',
          format === 'jpeg' ? quality[0] : undefined
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = image.preview;
    });
  };

  const processImage = async (image: ImageFile) => {
    try {
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, status: "processing" as const, progress: 0 } : img
      ));

      // Simulate progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 20;
        setImages(prev => prev.map(img => 
          img.id === image.id ? { ...img, progress: Math.min(progress, 90) } : img
        ));
      }, 100);

      await compressImage(image);
      clearInterval(progressInterval);

      toast.success(`Image compressed successfully! 🖼️`);
    } catch (error) {
      console.error('Compression failed:', error);
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, status: "error" as const } : img
      ));
      toast.error("Compression failed. Please try a different image or settings.");
    }
  };

  const processAllImages = async () => {
    setIsProcessing(true);
    const pendingImages = images.filter(img => img.status === "pending");
    
    for (const image of pendingImages) {
      await processImage(image);
    }
    
    setIsProcessing(false);
  };

  const downloadImage = (image: ImageFile) => {
    if (!image.compressedBlob) return;
    
    const url = URL.createObjectURL(image.compressedBlob);
    const a = document.createElement('a');
    a.href = url;
    const extension = format === 'jpeg' ? 'jpg' : format;
    a.download = `compressed_${image.file.name.split('.')[0]}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllAsZip = async () => {
    const completedImages = images.filter(img => img.status === "completed" && img.compressedBlob);
    
    if (completedImages.length === 0) {
      toast.error("No compressed images to download");
      return;
    }

    if (completedImages.length === 1) {
      downloadImage(completedImages[0]);
      return;
    }

    const zip = new JSZip();
    const extension = format === 'jpeg' ? 'jpg' : format;

    completedImages.forEach((image, index) => {
      if (image.compressedBlob) {
        const fileName = `compressed_${image.file.name.split('.')[0]}.${extension}`;
        zip.file(fileName, image.compressedBlob);
      }
    });

    try {
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compressed_images_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${completedImages.length} images as ZIP! 📦`);
    } catch (error) {
      console.error('Failed to create ZIP:', error);
      toast.error("Failed to create ZIP file");
    }
  };

  const removeImage = (id: string) => {
    const image = images.find(img => img.id === id);
    if (image) {
      URL.revokeObjectURL(image.preview);
    }
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const clearAll = () => {
    images.forEach(image => {
      URL.revokeObjectURL(image.preview);
    });
    setImages([]);
  };

  const getCompressionRatio = (image: ImageFile): string => {
    if (!image.compressedSize) return "";
    const ratio = ((image.originalSize - image.compressedSize) / image.originalSize * 100);
    return `${ratio.toFixed(1)}% smaller`;
  };

  const completedImages = images.filter(img => img.status === "completed");

  return (
    <PageLayout
      title="Image Compressor"
      description="Compress images while maintaining quality"
      activeTool="image-compressor"
    >
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Image Compressor 🗜️📸
          </h2>
          <p className="text-muted-foreground">
            Compress images while maintaining quality. Perfect for web optimization! 🚀
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quality</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Slider
                value={quality}
                onValueChange={setQuality}
                max={1}
                min={0.1}
                step={0.1}
                className="w-full"
                disabled={format === 'png'}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low (0.1)</span>
                <span className="font-semibold text-primary">
                  {format === 'png' ? 'N/A' : quality[0].toFixed(1)}
                </span>
                <span>High (1.0)</span>
              </div>
              {format === 'png' && (
                <p className="text-xs text-muted-foreground">PNG uses lossless compression</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Output Format</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Max Width</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={maxWidth} onValueChange={setMaxWidth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">Original</SelectItem>
                  <SelectItem value="1920">1920px</SelectItem>
                  <SelectItem value="1280">1280px</SelectItem>
                  <SelectItem value="800">800px</SelectItem>
                  <SelectItem value="600">600px</SelectItem>
                  <SelectItem value="400">400px</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <Card
          className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <ImageIcon className="h-6 w-6 text-primary absolute -bottom-1 -right-1" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">Drop images here or click to select 🖼️</p>
              <p className="text-sm text-muted-foreground">
                Supports JPEG, PNG, WebP and more. Multiple files supported! 🔄
              </p>
            </div>
          </CardContent>
        </Card>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(Array.from(e.target.files));
            }
          }}
        />

        {images.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Images ({images.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={processAllImages}
                  disabled={isProcessing || images.every(img => img.status !== "pending")}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Compress All
                </Button>
                {completedImages.length > 0 && (
                  <Button onClick={downloadAllAsZip} variant="secondary">
                    <Archive className="h-4 w-4 mr-2" />
                    Download {completedImages.length > 1 ? 'ZIP' : 'Image'}
                  </Button>
                )}
                <Button variant="outline" onClick={clearAll}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {images.map((image) => (
                <div key={image.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        <img
                          src={image.preview}
                          alt={image.file.name}
                          className="w-12 h-12 object-cover rounded-lg border"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{image.file.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatFileSize(image.originalSize)}</span>
                          {image.compressedSize && (
                            <>
                              <span>→</span>
                              <span className="text-green-500">{formatFileSize(image.compressedSize)}</span>
                              <Badge variant="secondary" className="text-xs">
                                {getCompressionRatio(image)}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        image.status === "completed" ? "default" :
                        image.status === "processing" ? "secondary" :
                        image.status === "error" ? "destructive" : "outline"
                      }>
                        {image.status === "completed" ? "✅ Done" :
                         image.status === "processing" ? "⚡ Processing" :
                         image.status === "error" ? "❌ Error" : "⏳ Pending"}
                      </Badge>
                      {image.status === "completed" && (
                        <Button size="sm" onClick={() => downloadImage(image)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => removeImage(image.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {image.status === "processing" && (
                    <div className="space-y-2">
                      <Progress value={image.progress} className="w-full" />
                      <p className="text-xs text-muted-foreground text-center">
                        {image.progress}% complete
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};

export default ImageCompressorPage;