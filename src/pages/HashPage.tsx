import { PageLayout } from "@/components/PageLayout";
import { HashGenerator } from "@/components/tools/HashGenerator";

const HashPage = () => {
  return (
    <PageLayout
      title="Hash Generator"
      description="Generate MD5, SHA-1, SHA-256, SHA-384, SHA-512, BLAKE2b, SHA3, and Keccak hashes"
      activeTool="hash"
    >
      <HashGenerator />
    </PageLayout>
  );
};

export default HashPage;