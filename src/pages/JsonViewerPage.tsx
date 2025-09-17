import { PageLayout } from "@/components/PageLayout";
import { JsonViewer } from "@/components/tools/JsonViewer";

const JsonViewerPage = () => {
  return (
    <PageLayout
      title="JSON Viewer & Formatter"
      description="Format and view JSON data"
      activeTool="json-viewer"
    >
      <JsonViewer />
    </PageLayout>
  );
};

export default JsonViewerPage;