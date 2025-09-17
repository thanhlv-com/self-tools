import { PageLayout } from "@/components/PageLayout";
import { TextCaseConverter } from "@/components/tools/TextCaseConverter";

const TextCasePage = () => {
  return (
    <PageLayout
      title="Text Case Converter"
      description="Convert text cases"
      activeTool="text-case"
    >
      <TextCaseConverter />
    </PageLayout>
  );
};

export default TextCasePage;