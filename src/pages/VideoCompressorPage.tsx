import { PageLayout } from "@/components/PageLayout";
import { VideoCompressor } from "@/components/tools/VideoCompressor";

const VideoCompressorPage = () => {
  return (
    <PageLayout
      title="Video Compressor"
      description="Reduce video file sizes"
      activeTool="video-compressor"
    >
      <VideoCompressor />
    </PageLayout>
  );
};

export default VideoCompressorPage;