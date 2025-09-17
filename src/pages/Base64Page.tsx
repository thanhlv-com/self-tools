import { PageLayout } from "@/components/PageLayout";
import { Base64Tool } from "@/components/tools/Base64Tool";

const Base64Page = () => {
  return (
    <PageLayout
      title="Base64 Encoder/Decoder"
      description="Base64 encoding and decoding"
      activeTool="base64"
    >
      <Base64Tool />
    </PageLayout>
  );
};

export default Base64Page;