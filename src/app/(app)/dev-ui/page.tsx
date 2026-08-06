import { DevUiPalettePicker } from "@/components/dev-ui-palette-picker";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Dev UI · DailyOS" };

export default function DevUiPage() {
  return (
    <div>
      <PageHeader
        title="Dev UI"
        description="Try ten temporary color directions across the whole DailyOS website. Your current colors are preserved as the default."
      />
      <DevUiPalettePicker />
    </div>
  );
}
