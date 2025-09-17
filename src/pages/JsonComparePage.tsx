import { PageLayout } from "@/components/PageLayout";
import { JsonCompare } from "@/components/tools/JsonCompare";

const JsonComparePage = () => {
  return (
    <PageLayout
      title="JSON Comparison Tool"
      description="Compare multiple JSON objects"
      activeTool="json-compare"
    >
      <JsonCompare />
    </PageLayout>
  );
};

export default JsonComparePage;