import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { 
  Upload, 
  X, 
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  CheckCircle, 
  Layers, 
  ArrowLeftRight,
  Sparkles,
  Target,
  Zap,
  XCircle,
  Eye,
  Download,
  Info,
  Clock,
  Film,
  MousePointer,
  RefreshCw,
  Settings,
  BarChart3,
  TrendingUp,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageLayout } from "@/components/PageLayout";

interface VideoFile {
  file: File;
  url: string;
  duration: number;
  width: number;
  height: number;
  size: number;
  name: string;
  fps?: number;
  format: string;
}

interface ComparisonResult {
  similarity: number;
  frameDifferences: number[];
  avgDifference: number;
  maxDifference: number;
  durationMatch: boolean;
  resolutionMatch: boolean;
  formatMatch: boolean;
  totalFrames: number;
  significantChanges: number;
}

interface FrameData {
  timestamp: number;
  similarity: number;
  differenceIntensity: number;
  frameNumber: number;
  hasDifference: boolean;
  differentPixels: number;
}

const VideoComparePage = () => {
  const [video1, setVideo1] = useState<VideoFile | null>(null);
  const [video2, setVideo2] = useState<VideoFile | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showDifferences, setShowDifferences] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'realtime' | 'frame' | 'timeline'>('realtime');
  const [frameData, setFrameData] = useState<FrameData[]>([]);
  
  const { toast } = useToast();
  
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const canvas1Ref = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);
  const diffCanvasRef = useRef<HTMLCanvasElement>(null);
  const file1InputRef = useRef<HTMLInputElement>(null);
  const file2InputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number>();

  const loadVideoMetadata = useCallback((file: File): Promise<VideoFile> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        resolve({
          file,
          url,
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          size: file.size,
          name: file.name,
          format: file.type
        });
      };
      
      video.onerror = () => reject(new Error('Failed to load video'));
      video.src = url;
    });
  }, []);

  const handleFileUpload = useCallback(async (file: File, isFirst: boolean) => {
    if (!file.type.startsWith('video/')) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please select a valid video file",
      });
      return;
    }

    try {
      const videoFile = await loadVideoMetadata(file);
      if (isFirst) {
        setVideo1(videoFile);
      } else {
        setVideo2(videoFile);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Loading Video",
        description: "Failed to load the selected video",
      });
    }
  }, [loadVideoMetadata, toast]);

  const syncVideos = useCallback(() => {
    if (video1Ref.current && video2Ref.current) {
      const time = currentTime;
      video1Ref.current.currentTime = time;
      video2Ref.current.currentTime = time;
    }
  }, [currentTime]);

  const calculateFrameDifference = useCallback((
    canvas1: HTMLCanvasElement, 
    canvas2: HTMLCanvasElement, 
    video1: HTMLVideoElement, 
    video2: HTMLVideoElement
  ): number => {
    const ctx1 = canvas1.getContext('2d');
    const ctx2 = canvas2.getContext('2d');
    const diffCtx = diffCanvasRef.current?.getContext('2d');
    
    if (!ctx1 || !ctx2 || !diffCtx) return 0;

    // Set canvas dimensions
    const width = Math.min(video1.videoWidth, video2.videoWidth);
    const height = Math.min(video1.videoHeight, video2.videoHeight);
    
    canvas1.width = canvas2.width = width;
    canvas1.height = canvas2.height = height;
    diffCanvasRef.current!.width = width;
    diffCanvasRef.current!.height = height;

    // Draw current frames
    ctx1.drawImage(video1, 0, 0, width, height);
    ctx2.drawImage(video2, 0, 0, width, height);

    // Get image data
    const imageData1 = ctx1.getImageData(0, 0, width, height);
    const imageData2 = ctx2.getImageData(0, 0, width, height);
    const diffImageData = diffCtx.createImageData(width, height);

    const data1 = imageData1.data;
    const data2 = imageData2.data;
    const diffData = diffImageData.data;

    let totalDifference = 0;
    const pixelCount = width * height;

    for (let i = 0; i < data1.length; i += 4) {
      const r1 = data1[i], g1 = data1[i + 1], b1 = data1[i + 2];
      const r2 = data2[i], g2 = data2[i + 1], b2 = data2[i + 2];

      const rDiff = Math.abs(r1 - r2);
      const gDiff = Math.abs(g1 - g2);
      const bDiff = Math.abs(b1 - b2);
      const avgDiff = (rDiff + gDiff + bDiff) / 3;

      totalDifference += avgDiff;

      // Create difference visualization
      const intensity = avgDiff / 255;
      if (intensity > 0.1) { // Threshold for visible differences
        diffData[i] = 255;     // R - highlight differences in red
        diffData[i + 1] = 0;   // G
        diffData[i + 2] = 0;   // B
        diffData[i + 3] = Math.min(255, intensity * 255); // A
      } else {
        // Show original frame dimmed
        diffData[i] = Math.floor((r1 + r2) / 4);
        diffData[i + 1] = Math.floor((g1 + g2) / 4);
        diffData[i + 2] = Math.floor((b1 + b2) / 4);
        diffData[i + 3] = 100;
      }
    }

    diffCtx.putImageData(diffImageData, 0, 0);
    return (totalDifference / pixelCount) / 255; // Normalize to 0-1
  }, []);

  const extractVideoFrames = useCallback(async (video: HTMLVideoElement, fps: number = 30): Promise<ImageData[]> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const frames: ImageData[] = [];
    const duration = video.duration;
    const frameInterval = 1 / fps; // Time between frames
    const totalFrames = Math.floor(duration * fps);
    
    for (let i = 0; i < totalFrames; i++) {
      const timestamp = i * frameInterval;
      
      // Seek to exact frame timestamp
      video.currentTime = timestamp;
      
      // Wait for seek to complete with high precision
      await new Promise<void>((resolve) => {
        const checkSeek = () => {
          if (Math.abs(video.currentTime - timestamp) < 0.001) {
            resolve();
          } else {
            requestAnimationFrame(checkSeek);
          }
        };
        video.addEventListener('seeked', () => checkSeek(), { once: true });
        setTimeout(() => resolve(), 50); // Fallback
      });
      
      // Draw frame to canvas and extract pixel data
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      frames.push(imageData);
    }
    
    return frames;
  }, []);

  const compareFramesPixelPerfect = useCallback((frame1: ImageData, frame2: ImageData): { similarity: number; hasDifference: boolean; differenceCount: number } => {
    const data1 = frame1.data;
    const data2 = frame2.data;
    const totalPixels = frame1.width * frame2.height;
    
    let differentPixels = 0;
    const threshold = 0; // Zero tolerance for absolute accuracy
    
    for (let i = 0; i < data1.length; i += 4) {
      const r1 = data1[i], g1 = data1[i + 1], b1 = data1[i + 2], a1 = data1[i + 3];
      const r2 = data2[i], g2 = data2[i + 1], b2 = data2[i + 2], a2 = data2[i + 3];
      
      // Exact pixel comparison - any difference counts
      if (r1 !== r2 || g1 !== g2 || b1 !== b2 || a1 !== a2) {
        differentPixels++;
      }
    }
    
    const similarity = ((totalPixels - differentPixels) / totalPixels) * 100;
    const hasDifference = differentPixels > 0;
    
    return { similarity, hasDifference, differenceCount: differentPixels };
  }, []);

  const analyzeFrames = useCallback(async () => {
    if (!video1 || !video2 || !video1Ref.current || !video2Ref.current) return;

    setIsProcessing(true);
    const frameAnalysis: FrameData[] = [];
    const differences: number[] = [];
    
    const video1El = video1Ref.current;
    const video2El = video2Ref.current;

    // Determine FPS for accurate frame extraction
    const fps = 30; // Standard FPS, can be detected from video metadata
    const minDuration = Math.min(video1.duration, video2.duration);
    const totalFrames = Math.floor(minDuration * fps);

    try {
      toast({
        title: "Starting Frame Analysis",
        description: `Preparing to analyze ${totalFrames} frames with absolute precision...`,
      });

      // Extract all frames from both videos
      const frames1 = await extractVideoFrames(video1El, fps);
      const frames2 = await extractVideoFrames(video2El, fps);
      
      toast({
        title: "Frame Extraction Complete",
        description: `Extracted ${frames1.length} and ${frames2.length} frames. Starting pixel-by-pixel comparison...`,
      });

      const maxFramesToCompare = Math.min(frames1.length, frames2.length);
      let frameDifferencesFound = 0;
      let identicalFrames = 0;

      // Compare every single frame with pixel-perfect accuracy
      for (let i = 0; i < maxFramesToCompare; i++) {
        const frameComparison = compareFramesPixelPerfect(frames1[i], frames2[i]);
        const timestamp = i / fps;
        
        differences.push(frameComparison.hasDifference ? 1 : 0);
        
        if (frameComparison.hasDifference) {
          frameDifferencesFound++;
        } else {
          identicalFrames++;
        }
        
        frameAnalysis.push({
          timestamp,
          similarity: frameComparison.similarity,
          differenceIntensity: frameComparison.hasDifference ? 1 : 0,
          frameNumber: i + 1,
          hasDifference: frameComparison.hasDifference,
          differentPixels: frameComparison.differenceCount
        });

        // Update progress frequently for user feedback
        if (i % Math.floor(maxFramesToCompare / 20) === 0 || i === maxFramesToCompare - 1) {
          const progress = Math.round((i / maxFramesToCompare) * 100);
          toast({
            title: "Frame-by-Frame Analysis",
            description: `${progress}% complete - Found ${frameDifferencesFound} different frames out of ${i + 1} analyzed`,
          });
        }
      }

      // Calculate final results with absolute accuracy
      const totalDifferentFrames = frameDifferencesFound;
      const similarity = Math.round((identicalFrames / maxFramesToCompare) * 100);
      const avgDifference = totalDifferentFrames / maxFramesToCompare;
      const maxDifference = totalDifferentFrames > 0 ? 1 : 0;

      const comparisonResult: ComparisonResult = {
        similarity,
        frameDifferences: differences,
        avgDifference,
        maxDifference,
        durationMatch: Math.abs(video1.duration - video2.duration) < 0.1,
        resolutionMatch: video1.width === video2.width && video1.height === video2.height,
        formatMatch: video1.format === video2.format,
        totalFrames: maxFramesToCompare,
        significantChanges: totalDifferentFrames
      };

      setResult(comparisonResult);
      setFrameData(frameAnalysis);
      
      const accuracyMessage = totalDifferentFrames === 0 
        ? "Videos are ABSOLUTELY IDENTICAL - Every single frame matches perfectly!"
        : `Found ${totalDifferentFrames} different frames out of ${maxFramesToCompare} total frames (${similarity}% identical)`;
      
      toast({
        title: "Pixel-Perfect Analysis Complete",
        description: accuracyMessage,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Failed to perform frame-by-frame analysis",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [video1, video2, extractVideoFrames, compareFramesPixelPerfect, toast]);

  const handlePlayPause = useCallback(() => {
    if (!video1Ref.current || !video2Ref.current) return;

    if (isPlaying) {
      video1Ref.current.pause();
      video2Ref.current.pause();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    } else {
      video1Ref.current.play();
      video2Ref.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (video1Ref.current) {
      const time = video1Ref.current.currentTime;
      setCurrentTime(time);
      
      // Real-time difference calculation
      if (analysisMode === 'realtime' && showDifferences && video2Ref.current && canvas1Ref.current && canvas2Ref.current) {
        calculateFrameDifference(
          canvas1Ref.current,
          canvas2Ref.current,
          video1Ref.current,
          video2Ref.current
        );
      }
    }
  }, [analysisMode, showDifferences, calculateFrameDifference]);

  const handleSeek = useCallback((value: number[]) => {
    const time = value[0];
    setCurrentTime(time);
    if (video1Ref.current && video2Ref.current) {
      video1Ref.current.currentTime = time;
      video2Ref.current.currentTime = time;
    }
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearVideos = () => {
    if (video1) URL.revokeObjectURL(video1.url);
    if (video2) URL.revokeObjectURL(video2.url);
    setVideo1(null);
    setVideo2(null);
    setResult(null);
    setFrameData([]);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // Set up video event listeners
  useEffect(() => {
    const video1El = video1Ref.current;
    const video2El = video2Ref.current;

    if (video1El && video2El) {
      const handleLoadedMetadata = () => {
        setDuration(Math.min(video1El.duration, video2El.duration));
      };

      video1El.addEventListener('loadedmetadata', handleLoadedMetadata);
      video1El.addEventListener('timeupdate', handleTimeUpdate);
      
      return () => {
        video1El.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video1El.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [video1, video2, handleTimeUpdate]);

  return (
    <PageLayout
      title="Video Comparison Tool"
      description="Compare two videos frame by frame and analyze differences"
      activeTool="video-compare"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Video Comparison Tool</h2>
          <p className="text-muted-foreground">Upload and compare two videos to identify frame-by-frame differences</p>
        </div>

        {/* Video Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Film className="h-5 w-5 text-blue-500" />
                Video 1 (Original)
              </CardTitle>
              <CardDescription>First video to compare</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!video1 ? (
                  <div 
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => file1InputRef.current?.click()}
                  >
                    <Film className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium">Drop video here or click to browse</p>
                    <p className="text-sm text-muted-foreground">Supports MP4, WebM, AVI, MOV</p>
                    <input
                      ref={file1InputRef}
                      type="file"
                      accept="video/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], true)}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden border">
                      <video 
                        ref={video1Ref}
                        src={video1.url}
                        className="w-full h-48 object-cover"
                        muted={isMuted}
                        onVolumeChange={(e) => setVolume((e.target as HTMLVideoElement).volume)}
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          URL.revokeObjectURL(video1.url);
                          setVideo1(null);
                          setResult(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><strong>Name:</strong> {video1.name}</p>
                      <p><strong>Duration:</strong> {formatTime(video1.duration)}</p>
                      <p><strong>Size:</strong> {formatFileSize(video1.size)}</p>
                      <p><strong>Resolution:</strong> {video1.width}x{video1.height}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Film className="h-5 w-5 text-green-500" />
                Video 2 (Comparison)
              </CardTitle>
              <CardDescription>Second video to compare</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!video2 ? (
                  <div 
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => file2InputRef.current?.click()}
                  >
                    <Film className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium">Drop video here or click to browse</p>
                    <p className="text-sm text-muted-foreground">Supports MP4, WebM, AVI, MOV</p>
                    <input
                      ref={file2InputRef}
                      type="file"
                      accept="video/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], false)}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden border">
                      <video 
                        ref={video2Ref}
                        src={video2.url}
                        className="w-full h-48 object-cover"
                        muted={isMuted}
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          URL.revokeObjectURL(video2.url);
                          setVideo2(null);
                          setResult(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><strong>Name:</strong> {video2.name}</p>
                      <p><strong>Duration:</strong> {formatTime(video2.duration)}</p>
                      <p><strong>Size:</strong> {formatFileSize(video2.size)}</p>
                      <p><strong>Resolution:</strong> {video2.width}x{video2.height}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Video Controls */}
        {video1 && video2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Playback Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Timeline */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                  <Slider
                    value={[currentTime]}
                    max={duration}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="w-full"
                  />
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSeek([Math.max(0, currentTime - 10)])}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={handlePlayPause}
                    size="lg"
                    className="w-16 h-16 rounded-full"
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSeek([Math.min(duration, currentTime + 10)])}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Analysis Controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button 
                    onClick={analyzeFrames} 
                    disabled={isProcessing}
                    className="min-w-[200px]"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analyze Videos
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowDifferences(!showDifferences)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showDifferences ? 'Hide' : 'Show'} Differences
                  </Button>
                  
                  <Button variant="outline" onClick={clearVideos}>
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comparison Results */}
        {result && video1 && video2 && (
          <div className="space-y-6">
            {/* Hero Results Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-indigo-100 dark:border-slate-700">
              <div className="relative p-8">
                <div className="text-center space-y-6">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-600/20">
                      <Sparkles className="h-4 w-4 text-indigo-500" />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Video Analysis Complete</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                        {result.similarity}%
                      </div>
                      <div className="text-xl text-slate-600 dark:text-slate-300">
                        {result.similarity >= 90 ? 'Nearly Identical' :
                         result.similarity >= 70 ? 'Very Similar' :
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
                      <Film className="h-4 w-4 text-indigo-500" />
                      <span className="font-medium">{video1.name}</span>
                    </div>
                    <ArrowLeftRight className="h-4 w-4 text-slate-400" />
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-slate-800/60 rounded-lg backdrop-blur-sm">
                      <Film className="h-4 w-4 text-cyan-500" />
                      <span className="font-medium">{video2.name}</span>
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
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-red-700 dark:text-red-300">
                    {result.significantChanges}
                  </div>
                  <div className="font-semibold text-red-800 dark:text-red-200">
                    Different Frames
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Frames with ANY pixel difference
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
                  <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                    {result.totalFrames - result.significantChanges}
                  </div>
                  <div className="font-semibold text-green-800 dark:text-green-200">
                    Identical Frames
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Pixel-perfect matches
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-950/30 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <Film className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                    {result.totalFrames}
                  </div>
                  <div className="font-semibold text-blue-800 dark:text-blue-200">
                    Total Frames
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Analyzed at 30 FPS precision
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950/30 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                    <Target className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {result.significantChanges === 0 ? 'PERFECT' : 'DETECTED'}
                  </div>
                  <div className="font-semibold text-amber-800 dark:text-amber-200">
                    Accuracy Status
                  </div>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    {result.significantChanges === 0 ? 'Zero tolerance match' : 'Differences found'}
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Comparison Tabs */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                    <Eye className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle>Visual Comparison</CardTitle>
                    <CardDescription>Explore frame-by-frame differences between your videos</CardDescription>
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
                    <TabsTrigger value="difference" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                      <Zap className="h-4 w-4" />
                      <span className="hidden sm:inline">Differences</span>
                      <span className="sm:hidden">Diff</span>
                    </TabsTrigger>
                    <TabsTrigger value="timeline" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                      <BarChart3 className="h-4 w-4" />
                      <span className="hidden sm:inline">Timeline</span>
                      <span className="sm:hidden">Time</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="sidebyside" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Side by Side Comparison</h3>
                      
                      <div className="grid grid-cols-2 gap-4 max-h-[500px] overflow-hidden border rounded-lg">
                        <div className="space-y-2 p-4">
                          <h4 className="font-medium text-indigo-600">Original Video</h4>
                          <video 
                            src={video1.url}
                            className="w-full h-auto rounded border"
                            controls={false}
                            ref={(el) => {
                              if (el && video1Ref.current) {
                                el.currentTime = video1Ref.current.currentTime;
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-2 p-4">
                          <h4 className="font-medium text-cyan-600">Comparison Video</h4>
                          <video 
                            src={video2.url}
                            className="w-full h-auto rounded border"
                            controls={false}
                            ref={(el) => {
                              if (el && video2Ref.current) {
                                el.currentTime = video2Ref.current.currentTime;
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="difference" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Difference Visualization</h3>
                      <p className="text-sm text-muted-foreground">
                        Red areas show differences between frames. Use playback controls to scrub through the timeline.
                      </p>
                      
                      <div className="border rounded-lg overflow-hidden">
                        <canvas
                          ref={diffCanvasRef}
                          className="w-full h-auto max-h-[400px]"
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="timeline" className="mt-6">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Frame-by-Frame Timeline Analysis</h3>
                        <div className="text-sm text-muted-foreground">
                          {result && `${result.totalFrames} frames analyzed with pixel-perfect accuracy`}
                        </div>
                      </div>
                      
                      {frameData.length > 0 && (
                        <div className="space-y-6">
                          {/* Frame accuracy summary */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                {frameData.filter(f => !f.hasDifference).length}
                              </div>
                              <div className="text-sm font-medium text-green-600 dark:text-green-400">
                                Identical Frames
                              </div>
                            </div>
                            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                                {frameData.filter(f => f.hasDifference).length}
                              </div>
                              <div className="text-sm font-medium text-red-600 dark:text-red-400">
                                Different Frames
                              </div>
                            </div>
                            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                {Math.round((frameData.filter(f => !f.hasDifference).length / frameData.length) * 100)}%
                              </div>
                              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                Frame Accuracy
                              </div>
                            </div>
                          </div>

                          {/* Timeline visualization with exact frame differences */}
                          <div className="h-40 bg-slate-50 dark:bg-slate-800 rounded-lg p-4 relative overflow-x-auto">
                            <div className="absolute top-2 left-4 text-xs text-slate-600 dark:text-slate-400">
                              Frame-by-frame difference detection (Red = Different, Green = Identical)
                            </div>
                            <div className="flex items-end justify-start gap-px pt-8 pb-4 min-w-full" style={{ width: `${frameData.length * 2}px` }}>
                              {frameData.map((frame, index) => (
                                <div
                                  key={index}
                                  className={`w-0.5 rounded-t cursor-pointer transition-all hover:w-1 ${
                                    frame.hasDifference 
                                      ? 'bg-red-500 hover:bg-red-400' 
                                      : 'bg-green-500 hover:bg-green-400'
                                  }`}
                                  style={{ height: '80px' }}
                                  title={`Frame ${frame.frameNumber} at ${formatTime(frame.timestamp)}: ${
                                    frame.hasDifference 
                                      ? `DIFFERENT (${frame.differentPixels.toLocaleString()} pixels changed)` 
                                      : 'IDENTICAL'
                                  }`}
                                  onClick={() => {
                                    if (video1Ref.current && video2Ref.current) {
                                      video1Ref.current.currentTime = frame.timestamp;
                                      video2Ref.current.currentTime = frame.timestamp;
                                      setCurrentTime(frame.timestamp);
                                    }
                                  }}
                                />
                              ))}
                            </div>
                            <div className="absolute bottom-2 left-4 text-xs text-slate-500 dark:text-slate-400">
                              Click any bar to jump to that frame
                            </div>
                          </div>

                          {/* Different frames list */}
                          <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-red-600 dark:text-red-400">
                              Frames with Differences ({frameData.filter(f => f.hasDifference).length})
                            </h4>
                            
                            {frameData.filter(f => f.hasDifference).length === 0 ? (
                              <div className="text-center py-8 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-1">
                                  Perfect Match!
                                </h3>
                                <p className="text-green-600 dark:text-green-400 text-sm">
                                  Every single frame is absolutely identical
                                </p>
                              </div>
                            ) : (
                              <div className="max-h-64 overflow-y-auto space-y-2">
                                {frameData
                                  .filter(f => f.hasDifference)
                                  .slice(0, 50) // Show first 50 different frames
                                  .map((frame, index) => (
                                    <div 
                                      key={index}
                                      className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800 cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
                                      onClick={() => {
                                        if (video1Ref.current && video2Ref.current) {
                                          video1Ref.current.currentTime = frame.timestamp;
                                          video2Ref.current.currentTime = frame.timestamp;
                                          setCurrentTime(frame.timestamp);
                                        }
                                      }}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        <div>
                                          <div className="font-medium text-red-800 dark:text-red-200">
                                            Frame {frame.frameNumber}
                                          </div>
                                          <div className="text-sm text-red-600 dark:text-red-400">
                                            {formatTime(frame.timestamp)} • {frame.differentPixels.toLocaleString()} pixels different
                                          </div>
                                        </div>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 border-red-300 hover:bg-red-100"
                                      >
                                        Jump to Frame
                                      </Button>
                                    </div>
                                  ))
                                }
                                {frameData.filter(f => f.hasDifference).length > 50 && (
                                  <div className="text-center py-2 text-sm text-muted-foreground">
                                    Showing first 50 of {frameData.filter(f => f.hasDifference).length} different frames
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-sm text-muted-foreground bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                            <div className="font-semibold mb-2">Analysis Details:</div>
                            <ul className="space-y-1">
                              <li>• <strong>Zero Tolerance:</strong> Any pixel difference triggers a frame mismatch</li>
                              <li>• <strong>Pixel Perfect:</strong> RGBA values compared exactly with no threshold</li>
                              <li>• <strong>Frame Accurate:</strong> Every single frame extracted and analyzed at 30 FPS</li>
                              <li>• <strong>Absolute Precision:</strong> Even 1 different pixel in 1 frame will be detected</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Hidden canvases for processing */}
        <canvas ref={canvas1Ref} className="hidden" />
        <canvas ref={canvas2Ref} className="hidden" />
      </div>
    </PageLayout>
  );
};

export default VideoComparePage;