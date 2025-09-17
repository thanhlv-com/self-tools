import { PageLayout } from "@/components/PageLayout";
import { HashGenerator } from "@/components/tools/HashGenerator";

const HashPage = () => {
  return (
    <PageLayout
      title="Hash Generator"
      description="Generate MD4, MD5, SHA-1, SHA-224, SHA-256, SHA-384, SHA-512, SHA3, BLAKE2b, Keccak, CRC-32, FNV-1a, and Simple Hash algorithms"
      activeTool="hash"
    >
      <HashGenerator />
    </PageLayout>
  );
};

export default HashPage;