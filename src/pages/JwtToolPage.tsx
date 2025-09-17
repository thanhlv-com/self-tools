import { PageLayout } from "@/components/PageLayout";
import { JwtTool } from "@/components/tools/JwtTool";

const JwtToolPage = () => {
  return (
    <PageLayout
      title="JWT Toolkit 📄✨"
      description="Complete JWT debugging & creation 📄✨"
      activeTool="jwt-tool"
    >
      <JwtTool />
    </PageLayout>
  );
};

export default JwtToolPage;