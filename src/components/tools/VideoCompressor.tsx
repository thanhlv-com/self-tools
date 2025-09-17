import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { Upload, Download, Trash2, Play, X, FileVideo, Zap } from "lucide-react";
import { toast } from "sonner";

interface VideoFile {
  id: string;
  file: File;
  originalSize: number;
  compressedSize?: number;
  compressedBlob?: Blob;
  progress: number;
  status: "pending" | "processing" | "completed" | "error";
}

export const VideoCompressor = () => {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [quality, setQuality] = useState([23]);
  const [format, setFormat] = useState("mp4");
  const [resolution, setResolution] = useState("original");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef(new FFmpeg());

  const loadFFmpeg = async () => {
    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg.loaded) {
      try {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        ffmpeg.on('log', ({ message }) => {
          console.log(message);
        });
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
          workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
        });
      } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        // Fallback to alternative CDN
        const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
          workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
        });
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('video/')
    );
    handleFiles(files);
  }, []);

  const handleFiles = (files: File[]) => {
    const newVideos: VideoFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      originalSize: file.size,
      progress: 0,
      status: "pending"
    }));
    setVideos(prev => [...prev, ...newVideos]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const compressVideoWithCanvas = async (video: VideoFile): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const videoElement = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      videoElement.src = URL.createObjectURL(video.file);
      videoElement.muted = true;
      
      videoElement.addEventListener('loadedmetadata', () => {
        let width = videoElement.videoWidth;
        let height = videoElement.videoHeight;
        
        // Apply resolution scaling
        if (resolution !== 'original') {
          const [newWidth, newHeight] = resolution.split(':').map(Number);
          const aspectRatio = width / height;
          if (aspectRatio > newWidth / newHeight) {
            width = newWidth;
            height = newWidth / aspectRatio;
          } else {
            height = newHeight;
            width = newHeight * aspectRatio;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Create MediaRecorder for video compression
        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: `video/${format === 'mp4' ? 'webm' : format}; codecs=vp9`,
          videoBitsPerSecond: Math.max(100000, video.originalSize * (1 - quality[0] / 51) * 0.8)
        });
        
        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: `video/${format === 'mp4' ? 'webm' : format}` });
          URL.revokeObjectURL(videoElement.src);
          resolve(blob);
        };
        
        mediaRecorder.start();
        videoElement.play();
        
        const renderFrame = () => {
          if (videoElement.ended) {
            mediaRecorder.stop();
            return;
          }
          
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(renderFrame);
        };
        
        renderFrame();
      });
      
      videoElement.addEventListener('error', () => {
        reject(new Error('Failed to load video'));
      });
    });
  };

  const compressVideo = async (video: VideoFile) => {
    try {
      setVideos(prev => prev.map(v => 
        v.id === video.id ? { ...v, status: "processing" as const, progress: 0 } : v
      ));

      // Try FFmpeg first, fallback to canvas method
      try {
        await loadFFmpeg();
        const ffmpeg = ffmpegRef.current;

        ffmpeg.on('progress', ({ progress }) => {
          setVideos(prev => prev.map(v => 
            v.id === video.id ? { ...v, progress: Math.round(progress * 100) } : v
          ));
        });

        const inputName = `input_${video.id}.${video.file.name.split('.').pop()}`;
        const outputName = `output_${video.id}.${format}`;

        await ffmpeg.writeFile(inputName, await fetchFile(video.file));

        let ffmpegArgs = ['-i', inputName];
        
        if (resolution !== 'original') {
          ffmpegArgs.push('-vf', `scale=${resolution}`);
        }
        
        ffmpegArgs.push('-crf', quality[0].toString(), '-preset', 'medium', '-c:a', 'aac', outputName);

        await ffmpeg.exec(ffmpegArgs);

        const data = await ffmpeg.readFile(outputName);
        const blob = new Blob([data], { type: `video/${format}` });

        setVideos(prev => prev.map(v => 
          v.id === video.id 
            ? { 
                ...v, 
                status: "completed" as const, 
                progress: 100,
                compressedSize: blob.size,
                compressedBlob: blob
              } 
            : v
        ));

        toast.success(`Video compressed with FFmpeg! 📹`);
      } catch (ffmpegError) {
        console.warn('FFmpeg failed, using fallback method:', ffmpegError);
        
        // Simulate progress for canvas method
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 10;
          setVideos(prev => prev.map(v => 
            v.id === video.id ? { ...v, progress: Math.min(progress, 90) } : v
          ));
        }, 200);

        const blob = await compressVideoWithCanvas(video);
        clearInterval(progressInterval);

        setVideos(prev => prev.map(v => 
          v.id === video.id 
            ? { 
                ...v, 
                status: "completed" as const, 
                progress: 100,
                compressedSize: blob.size,
                compressedBlob: blob
              } 
            : v
        ));

        toast.success(`Video compressed with browser fallback! 📹`);
      }
    } catch (error) {
      console.error('Compression failed:', error);
      setVideos(prev => prev.map(v => 
        v.id === video.id ? { ...v, status: "error" as const } : v
      ));
      toast.error("Compression failed. Please try a different video or settings.");
    }
  };

  const processAllVideos = async () => {
    setIsProcessing(true);
    const pendingVideos = videos.filter(v => v.status === "pending");
    
    for (const video of pendingVideos) {
      await compressVideo(video);
    }
    
    setIsProcessing(false);
  };

  const downloadVideo = (video: VideoFile) => {
    if (!video.compressedBlob) return;
    
    const url = URL.createObjectURL(video.compressedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed_${video.file.name.split('.')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const removeVideo = (id: string) => {
    setVideos(prev => prev.filter(v => v.id !== id));
  };

  const clearAll = () => {
    setVideos([]);
  };

  const getCompressionRatio = (video: VideoFile): string => {
    if (!video.compressedSize) return "";
    const ratio = ((video.originalSize - video.compressedSize) / video.originalSize * 100);
    return `${ratio.toFixed(1)}% smaller`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Video Compressor 📉🎥
        </h2>
        <p className="text-muted-foreground">
          Reduce video file sizes while maintaining quality. Perfect for sharing and storage! 🚀
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Quality (CRF)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Slider
              value={quality}
              onValueChange={setQuality}
              max={51}
              min={0}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Best (0)</span>
              <span className="font-semibold text-primary">{quality[0]}</span>
              <span>Worst (51)</span>
            </div>
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
                <SelectItem value="mp4">MP4</SelectItem>
                <SelectItem value="webm">WebM</SelectItem>
                <SelectItem value="avi">AVI</SelectItem>
                <SelectItem value="mov">MOV</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Resolution</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={resolution} onValueChange={setResolution}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original">Original</SelectItem>
                <SelectItem value="1920:1080">1080p</SelectItem>
                <SelectItem value="1280:720">720p</SelectItem>
                <SelectItem value="854:480">480p</SelectItem>
                <SelectItem value="640:360">360p</SelectItem>
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
            <FileVideo className="h-6 w-6 text-primary absolute -bottom-1 -right-1" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">Drop videos here or click to select 🎬</p>
            <p className="text-sm text-muted-foreground">
              Supports MP4, WebM, AVI, MOV and more. Multiple files supported! 🔄
            </p>
          </div>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFiles(Array.from(e.target.files));
          }
        }}
      />

      {videos.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Videos ({videos.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={processAllVideos}
                disabled={isProcessing || videos.every(v => v.status !== "pending")}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Zap className="h-4 w-4 mr-2" />
                Compress All
              </Button>
              <Button variant="outline" onClick={clearAll}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {videos.map((video) => (
              <div key={video.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <FileVideo className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{video.file.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(video.originalSize)}</span>
                        {video.compressedSize && (
                          <>
                            <span>→</span>
                            <span className="text-green-500">{formatFileSize(video.compressedSize)}</span>
                            <Badge variant="secondary" className="text-xs">
                              {getCompressionRatio(video)}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      video.status === "completed" ? "default" :
                      video.status === "processing" ? "secondary" :
                      video.status === "error" ? "destructive" : "outline"
                    }>
                      {video.status === "completed" ? "✅ Done" :
                       video.status === "processing" ? "⚡ Processing" :
                       video.status === "error" ? "❌ Error" : "⏳ Pending"}
                    </Badge>
                    {video.status === "completed" && (
                      <Button size="sm" onClick={() => downloadVideo(video)}>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => removeVideo(video.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {video.status === "processing" && (
                  <div className="space-y-2">
                    <Progress value={video.progress} className="w-full" />
                    <p className="text-xs text-muted-foreground text-center">
                      {video.progress}% complete
                    </p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};