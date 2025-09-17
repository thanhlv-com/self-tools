import { PageLayout } from "@/components/PageLayout";
import { UrlEncodeTool } from "@/components/tools/UrlEncodeTool";

const UrlEncodePage = () => {
  return (
    <PageLayout
      title="URL Encoder/Decoder"
      description="URL encoding and decoding"
      activeTool="url-encode"
    >
      <UrlEncodeTool />
    </PageLayout>
  );
};

export default UrlEncodePage;