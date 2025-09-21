import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import JsonViewerPage from "./pages/JsonViewerPage";
import JsonComparePage from "./pages/JsonComparePage"; 
import Base64Page from "./pages/Base64Page";
import UrlEncodePage from "./pages/UrlEncodePage";
import HashPage from "./pages/HashPage";
import TextCasePage from "./pages/TextCasePage";
import VideoCompressorPage from "./pages/VideoCompressorPage";
import ImageCompressorPage from "./pages/ImageCompressorPage";
import JwtToolPage from "./pages/JwtToolPage";
import ImageSizeConverterPage from "./pages/ImageSizeConverterPage";
import WordComparePage from "./pages/WordComparePage";
import TextComparePage from "./pages/TextComparePage";
import PhotoComparePage from "./pages/PhotoComparePage";
import VideoComparePage from "./pages/VideoComparePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/json-viewer" element={<JsonViewerPage />} />
            <Route path="/json-compare" element={<JsonComparePage />} />
            <Route path="/base64" element={<Base64Page />} />
            <Route path="/url-encode" element={<UrlEncodePage />} />
            <Route path="/hash" element={<HashPage />} />
            <Route path="/text-case" element={<TextCasePage />} />
            <Route path="/video-compressor" element={<VideoCompressorPage />} />
            <Route path="/image-compressor" element={<ImageCompressorPage />} />
            <Route path="/jwt-tool" element={<JwtToolPage />} />
            <Route path="/image-size-converter" element={<ImageSizeConverterPage />} />
            <Route path="/word-compare" element={<WordComparePage />} />
            <Route path="/text-compare" element={<TextComparePage />} />
            <Route path="/photo-compare" element={<PhotoComparePage />} />
            <Route path="/video-compare" element={<VideoComparePage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
