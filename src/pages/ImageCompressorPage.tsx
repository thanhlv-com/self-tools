import { PageLayout } from "@/components/PageLayout";
import { ImageCompressor } from "@/components/tools/ImageCompressor";

const ImageCompressorPage = () => {
  return (
    <PageLayout
      title="Image Compressor"
      description="Compress images while maintaining quality"
      activeTool="image-compressor"
    >
      <ImageCompressor />
    </PageLayout>
  );
};

export default ImageCompressorPage;