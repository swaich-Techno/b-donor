import {
  AIHealthAssistant,
  MedicalReportUploader,
  ReportsList,
  RoleBasedLayout,
  SafetyDisclaimer,
  useReports
} from "../components/PortalComponents";

export default function AIHealthPage() {
  const { reports, loadReports } = useReports();

  return (
    <RoleBasedLayout>
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <AIHealthAssistant />
        <aside className="space-y-4">
          <SafetyDisclaimer />
          <MedicalReportUploader onUploaded={loadReports} />
          <ReportsList reports={reports} />
        </aside>
      </div>
    </RoleBasedLayout>
  );
}
