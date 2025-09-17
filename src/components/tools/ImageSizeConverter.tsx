import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, Trash2, Image as ImageIcon, X, Scissors, Crop } from "lucide-react";
import { toast } from "sonner";

interface ImageFormat {
  name: string;
  width: number;
  height: number;
  description: string;
}

const presetFormats: ImageFormat[] = [
  { name: "Autobiography Photo", width: 300, height: 400, description: "Standard autobiography photo size" },
  { name: "European Passport", width: 350, height: 450, description: "35mm x 45mm passport photo" },
  { name: "US Passport", width: 600, height: 600, description: "2x2 inch square passport photo" },
  { name: "Vietnamese Visa", width: 300, height: 400, description: "3cm x 4cm visa photo" },
  { name: "ID Card", width: 250, height: 350, description: "Standard ID card photo" },
  { name: "Driver License", width: 300, height: 400, description: "Driver's license photo" },
  { name: "Student ID", width: 250, height: 300, description: "Student identification photo" },
  { name: "CV Photo", width: 350, height: 450, description: "Professional CV/Resume photo" },
  { name: "LinkedIn Profile", width: 400, height: 400, description: "Square profile photo for LinkedIn" },
  { name: "Schengen Visa", width: 350, height: 450, description: "European Schengen visa photo" },
];

interface ProcessedImage {
  id: string;
  originalFile: File;
  processedBlob?: Blob;
  originalPreview: string;
  processedPreview?: string;
  format: ImageFormat;
  status: "pending" | "processing" | "completed" | "error";
}

export const ImageSizeConverter = () => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCurrentFormat = (): ImageFormat => {
    if (isCustomMode) {
      return {
        name: "Custom Size",
        width: parseInt(customWidth) || 400,
        height: parseInt(customHeight) || 400,
        description: `Custom ${customWidth}x${customHeight} pixels`
      };
    }
    
    const preset = presetFormats.find(f => f.name === selectedFormat);
    return preset || presetFormats[0];
  };

  const handleFiles = (files: File[]) => {
    const format = getCurrentFormat();
    if (!format && !isCustomMode) {
      toast.error("Please select a format first");
      return;
    }

    const newImages: ProcessedImage[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      originalFile: file,
      originalPreview: URL.createObjectURL(file),
      format,
      status: "pending"
    }));
    
    setImages(prev => [...prev, ...newImages]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    handleFiles(files);
  };

  const cropAndResizeImage = async (image: ProcessedImage): Promise<void> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      img.onload = () => {
        const { width: targetWidth, height: targetHeight } = image.format;
        
        // Calculate crop dimensions to maintain aspect ratio
        const sourceAspectRatio = img.width / img.height;
        const targetAspectRatio = targetWidth / targetHeight;
        
        let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;
        
        if (sourceAspectRatio > targetAspectRatio) {
          // Image is wider than target, crop horizontally
          sourceWidth = img.height * targetAspectRatio;
          sourceX = (img.width - sourceWidth) / 2;
        } else if (sourceAspectRatio < targetAspectRatio) {
          // Image is taller than target, crop vertically
          sourceHeight = img.width / targetAspectRatio;
          sourceY = (img.height - sourceHeight) / 2;
        }

        // Set canvas size to target dimensions
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Draw the cropped and resized image
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, targetWidth, targetHeight
        );

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to process image'));
              return;
            }

            const processedPreview = URL.createObjectURL(blob);
            
            setImages(prev => prev.map(img => 
              img.id === image.id 
                ? { 
                    ...img, 
                    status: "completed" as const,
                    processedBlob: blob,
                    processedPreview
                  } 
                : img
            ));

            resolve();
          },
          'image/jpeg',
          0.9
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = image.originalPreview;
    });
  };

  const processImage = async (image: ProcessedImage) => {
    try {
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, status: "processing" as const } : img
      ));

      await cropAndResizeImage(image);
      toast.success(`Image converted to ${image.format.name}! 📸`);
    } catch (error) {
      console.error('Processing failed:', error);
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, status: "error" as const } : img
      ));
      toast.error("Processing failed. Please try again.");
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

  const downloadImage = (image: ProcessedImage) => {
    if (!image.processedBlob) return;
    
    const url = URL.createObjectURL(image.processedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${image.format.name.toLowerCase().replace(/\s+/g, '_')}_${image.originalFile.name.split('.')[0]}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const removeImage = (id: string) => {
    const image = images.find(img => img.id === id);
    if (image) {
      URL.revokeObjectURL(image.originalPreview);
      if (image.processedPreview) {
        URL.revokeObjectURL(image.processedPreview);
      }
    }
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const clearAll = () => {
    images.forEach(image => {
      URL.revokeObjectURL(image.originalPreview);
      if (image.processedPreview) {
        URL.revokeObjectURL(image.processedPreview);
      }
    });
    setImages([]);
  };

  const completedImages = images.filter(img => img.status === "completed");

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
          Image Size Converter ✂️📏
        </h2>
        <p className="text-muted-foreground">
          Convert images to standard formats like passport photos, visa images, and more! 🖼️
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Crop className="h-4 w-4" />
              Format Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="preset"
                name="mode"
                checked={!isCustomMode}
                onChange={() => setIsCustomMode(false)}
                className="text-primary"
              />
              <Label htmlFor="preset">Preset Formats</Label>
            </div>
            
            {!isCustomMode && (
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a format..." />
                </SelectTrigger>
                <SelectContent>
                  {presetFormats.map((format) => (
                    <SelectItem key={format.name} value={format.name}>
                      <div className="flex flex-col">
                        <span>{format.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {format.width}x{format.height}px - {format.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="custom"
                name="mode"
                checked={isCustomMode}
                onChange={() => setIsCustomMode(true)}
                className="text-primary"
              />
              <Label htmlFor="custom">Custom Dimensions</Label>
            </div>

            {isCustomMode && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="width" className="text-xs">Width (px)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    placeholder="400"
                    min="50"
                    max="2000"
                  />
                </div>
                <div>
                  <Label htmlFor="height" className="text-xs">Height (px)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    placeholder="400"
                    min="50"
                    max="2000"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Current Format</CardTitle>
          </CardHeader>
          <CardContent>
            {(selectedFormat || isCustomMode) ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{getCurrentFormat().name}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{getCurrentFormat().description}</p>
                <p className="text-xs text-muted-foreground">
                  Dimensions: {getCurrentFormat().width} × {getCurrentFormat().height} pixels
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Please select a format above</p>
            )}
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
            <Scissors className="h-6 w-6 text-primary absolute -bottom-1 -right-1" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">Drop images here or click to select 🖼️</p>
            <p className="text-sm text-muted-foreground">
              Images will be cropped and resized to your selected format 📐
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
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                <Scissors className="h-4 w-4 mr-2" />
                Convert All
              </Button>
              <Button variant="outline" onClick={clearAll}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {images.map((image) => (
              <div key={image.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 min-w-0 flex-1">
                    <div className="flex-shrink-0 space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Original</p>
                        <img
                          src={image.originalPreview}
                          alt={image.originalFile.name}
                          className="w-16 h-16 object-cover rounded-lg border"
                        />
                      </div>
                      {image.processedPreview && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Converted</p>
                          <img
                            src={image.processedPreview}
                            alt="Processed"
                            className="w-16 h-16 object-cover rounded-lg border border-green-500"
                          />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{image.originalFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Target: {image.format.name} ({image.format.width}×{image.format.height}px)
                      </p>
                      <Badge variant={
                        image.status === "completed" ? "default" :
                        image.status === "processing" ? "secondary" :
                        image.status === "error" ? "destructive" : "outline"
                      } className="mt-2">
                        {image.status === "completed" ? "✅ Converted" :
                         image.status === "processing" ? "⚡ Processing" :
                         image.status === "error" ? "❌ Error" : "⏳ Pending"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};