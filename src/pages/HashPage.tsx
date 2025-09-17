import { PageLayout } from "@/components/PageLayout";
import { HashGenerator } from "@/components/tools/HashGenerator";

const HashPage = () => {
  return (
    <PageLayout
      title="Hash Generator"
      description="Generate MD5, SHA-256 hashes"
      activeTool="hash"
    >
      <HashGenerator />
    </PageLayout>
  );
};

export default HashPage;