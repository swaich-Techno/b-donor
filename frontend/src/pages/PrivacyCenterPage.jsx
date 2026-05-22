import { useEffect, useMemo, useState } from "react";
import { Download, EyeOff, LockKeyhole, ShieldCheck, Trash2 } from "lucide-react";
import {
  EmptyState,
  RoleBasedLayout,
  SafetyDisclaimer
} from "../components/PortalComponents";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const OPTIONAL_CONSENTS = [
  ["locationAccepted", "Location matching", "Needed for nearby donor and care search. Manual location can be used if GPS is unavailable."],
  ["liveTrackingAccepted", "Live tracking", "Allows request-specific donor tracking only after explicit donor consent."],
  ["whatsappSmsConsentAccepted", "WhatsApp/SMS coordination", "Allows manual WhatsApp links and future notification channels."],
  ["certificatePublicVerificationAccepted", "Certificate QR verification", "Allows masked public verification records for certificates."],
  ["appointmentDataSharingAccepted", "Appointment data sharing", "Allows appointment summaries to be shared with selected providers."]
];

export default function PrivacyCenterPage() {
  const { logout, refreshUser } = useAuth();
  const [summary, setSummary] = useState(null);
  const [consent, setConsent] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadPrivacy();
  }, []);

  async function loadPrivacy() {
    setMessage("");
    try {
      const res = await api.get("/users/privacy-center/summary");
      setSummary(res.data);
      setConsent(res.data.consent || {});
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not load privacy settings.");
    }
  }

  function toggle(field) {
    setConsent((current) => ({ ...current, [field]: !current[field] }));
  }

  async function saveConsent() {
    setMessage("");
    try {
      const payload = OPTIONAL_CONSENTS.reduce((body, [field]) => {
        body[field] = Boolean(consent[field]);
        return body;
      }, {});
      await api.put("/users/privacy-center/consent", payload);
      await refreshUser();
      setMessage("Consent preferences updated.");
      await loadPrivacy();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update consent.");
    }
  }

  async function requestDeletion() {
    const confirmed = window.confirm("This blocks your account while admin reviews legal and audit retention. Continue?");
    if (!confirmed) return;
    const res = await api.post("/users/privacy-center/delete-request");
    setMessage(res.data.message);
    setTimeout(logout, 1200);
  }

  const dataSummary = useMemo(() => {
    if (!summary?.profile) return "";
    return JSON.stringify({
      name: summary.profile.name,
      email: summary.profile.email,
      phone: summary.profile.phone,
      bloodGroup: summary.profile.bloodGroup,
      consents: consent,
      note: summary.note
    }, null, 2);
  }, [summary, consent]);

  function downloadSummary() {
    const blob = new Blob([dataSummary], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "b-donor-privacy-summary.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <RoleBasedLayout>
      <div className="space-y-5">
        <div className="card bg-slate-950 text-white">
          <p className="text-sm font-bold text-red-200">Privacy center</p>
          <h1 className="mt-1 text-3xl font-black">Consent, records, and data controls</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Manage optional consent for location, live tracking, notifications, appointment sharing, and certificate visibility.
          </p>
        </div>

        <SafetyDisclaimer />

        {message && <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">{message}</div>}

        {!summary ? (
          <EmptyState title="Privacy settings" text={message || "Loading your consent record."} />
        ) : (
          <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
            <div className="card space-y-4">
              <div className="flex items-center gap-2">
                <LockKeyhole className="text-donor-red" size={22} />
                <h2 className="text-xl font-extrabold text-slate-950">Optional consents</h2>
              </div>
              <div className="space-y-3">
                {OPTIONAL_CONSENTS.map(([field, title, text]) => (
                  <label className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-3" key={field}>
                    <span>
                      <span className="block text-sm font-bold text-slate-950">{title}</span>
                      <span className="mt-1 block text-sm leading-6 text-slate-600">{text}</span>
                    </span>
                    <input
                      className="mt-1 h-5 w-5"
                      type="checkbox"
                      checked={Boolean(consent[field])}
                      onChange={() => toggle(field)}
                    />
                  </label>
                ))}
              </div>
              <button className="btn-primary w-full sm:w-auto" onClick={saveConsent}>
                Save privacy settings
              </button>
            </div>

            <div className="space-y-3">
              <div className="card space-y-3">
                <ShieldCheck className="text-emerald-600" size={22} />
                <h2 className="text-xl font-extrabold text-slate-950">Your data summary</h2>
                <p className="text-sm leading-6 text-slate-600">{summary.note}</p>
                <div className="grid gap-2 text-sm">
                  <Info label="Medical reports" value={`${summary.reportVisibility?.length || 0} linked in history`} />
                  <Info label="Live tracking" value={summary.liveTrackingConsent ? "Allowed when requested" : "Off"} />
                  <Info label="Appointment sharing" value={summary.appointmentDataSharing ? "Allowed" : "Off"} />
                  <Info label="Certificate visibility" value={summary.certificateVisibility ? "Public masked allowed" : "Private by default"} />
                </div>
                <button className="btn-secondary w-full" onClick={downloadSummary}>
                  <Download size={16} />
                  Download data summary
                </button>
              </div>

              <div className="card space-y-3 border-amber-100 bg-amber-50">
                <EyeOff className="text-amber-700" size={22} />
                <h2 className="font-extrabold text-amber-900">Report visibility</h2>
                <p className="text-sm leading-6 text-amber-900">
                  Medical reports are private by default. Share summaries with a doctor only from appointment or consultation flows after consent.
                </p>
              </div>

              <div className="card space-y-3 border-red-100 bg-red-50">
                <Trash2 className="text-donor-red" size={22} />
                <h2 className="font-extrabold text-donor-red">Request account deletion</h2>
                <p className="text-sm leading-6 text-slate-700">
                  Some consent, donation, safety, and audit records may be retained where legally necessary.
                </p>
                <button className="btn-secondary w-full" onClick={requestDeletion}>
                  Submit deletion request
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </RoleBasedLayout>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="text-right font-bold text-slate-950">{value}</span>
    </div>
  );
}
