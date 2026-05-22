import { useState } from "react";
import {
  BloodRequestCard,
  BloodRequestForm,
  RoleBasedLayout,
  SafetyDisclaimer
} from "../components/PortalComponents";

export default function BloodRequestPage() {
  const [created, setCreated] = useState(null);

  return (
    <RoleBasedLayout>
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <BloodRequestForm onCreated={setCreated} />
        <div className="space-y-4">
          <SafetyDisclaimer />
          {created && <BloodRequestCard request={created} />}
        </div>
      </div>
    </RoleBasedLayout>
  );
}
