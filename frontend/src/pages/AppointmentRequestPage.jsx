import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CalendarDays, Phone, ShieldCheck } from "lucide-react";
import {
  RoleBasedLayout,
  SafetyDisclaimer
} from "../components/PortalComponents";
import api from "../api/client";

export default function AppointmentRequestPage() {
  const { providerType, providerId } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [form, setForm] = useState({
    preferredDate: "",
    preferredTime: "",
    consultationMode: "clinic",
    symptomsSummary: "",
    attachAiSummary: false
  });

  useEffect(() => {
    const endpoint = providerType === "doctor" ? `/doctors/${providerId}` : `/hospitals/${providerId}`;
    api.get(endpoint)
      .then((res) => setProvider(res.data.doctor || res.data.hospital))
      .catch((error) => setMessage(error.response?.data?.message || "Could not load provider."));
  }, [providerId, providerType]);

  const profile = providerType === "doctor" ? provider?.doctorProfile : provider?.hospitalProfile;
  const providerName = useMemo(() => {
    if (!provider) return "Care provider";
    if (providerType === "doctor") return `Dr. ${provider.name}`;
    return profile?.hospitalName || provider.name;
  }, [provider, providerType, profile]);

  const activeOnPlatform = Boolean(profile?.appointmentEnabled);
  const directPhone = providerType === "doctor"
    ? provider?.phone
    : profile?.emergencyPhone || provider?.phone;

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setMessage("");
    if (!consent) {
      setMessage("Please consent before sharing appointment details.");
      return;
    }

    try {
      const payload = {
        requestedFor: providerType,
        doctorId: providerType === "doctor" ? providerId : undefined,
        hospitalId: providerType === "hospital" ? providerId : undefined,
        specialization: providerType === "doctor" ? profile?.specialization : profile?.departments?.[0],
        symptomsSummary: form.symptomsSummary,
        preferredDate: form.preferredDate,
        preferredTime: form.preferredTime,
        consultationMode: form.consultationMode,
        consultationFeeShown: providerType === "doctor" ? profile?.consultationFee : 0,
        patientConsentToShareMedicalData: true
      };

      await api.post("/appointments/request", payload);
      setMessage("Appointment interest sent. Payment is not required in Phase 1.");
      setTimeout(() => navigate("/appointments"), 700);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not send appointment request.");
    }
  }

  return (
    <RoleBasedLayout>
      <div className="space-y-5">
        <div className="card bg-slate-950 text-white">
          <p className="text-sm font-bold text-red-200">Appointment request</p>
          <h1 className="mt-1 text-3xl font-black">{providerName}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            This is an appointment interest request. It becomes confirmed only after the doctor or hospital accepts it.
          </p>
        </div>

        <SafetyDisclaimer />

        {message && <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">{message}</div>}

        <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-3">
            <div className="card space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold text-slate-950">{providerName}</p>
                  <p className="text-sm text-slate-600">
                    {providerType === "doctor" ? profile?.specialization || "General medicine" : profile?.hospitalType || "Hospital"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{provider?.location?.city || "Location not listed"}</p>
                </div>
                {profile?.verifiedBadge && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">Verified</span>
                )}
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                {profile?.about || "Profile details will appear after the provider completes their B Donor profile."}
              </div>
              {directPhone && (
                <a className="btn-secondary w-full" href={`tel:${directPhone}`}>
                  <Phone size={16} />
                  Call directly
                </a>
              )}
              <Link className="btn-secondary w-full" to={providerType === "doctor" ? `/doctors/${providerId}` : `/hospitals/${providerId}`}>
                View full profile
              </Link>
            </div>

            {!activeOnPlatform && (
              <div className="card border-amber-100 bg-amber-50">
                <p className="font-bold text-amber-800">Call/contact only</p>
                <p className="mt-1 text-sm leading-6 text-amber-800">
                  This provider is listed but appointment acceptance is not active. Use the call/contact option instead of expecting confirmed booking.
                </p>
              </div>
            )}
          </div>

          <form className="card space-y-4" onSubmit={submit}>
            <div className="flex items-center gap-2">
              <CalendarDays className="text-donor-red" size={22} />
              <h2 className="text-xl font-extrabold text-slate-950">Preferred slot</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="field" type="date" value={form.preferredDate} onChange={(e) => setField("preferredDate", e.target.value)} required />
              <input className="field" type="time" value={form.preferredTime} onChange={(e) => setField("preferredTime", e.target.value)} required />
              <select className="field" value={form.consultationMode} onChange={(e) => setField("consultationMode", e.target.value)}>
                <option value="clinic">Clinic / hospital visit</option>
                <option value="phone">Phone</option>
                <option value="video">Video</option>
              </select>
              <input className="field" readOnly value={providerType === "doctor" ? `Fee shown: Rs ${profile?.consultationFee || 0}` : "Hospital helpdesk request"} />
            </div>

            <textarea
              className="field min-h-32"
              placeholder="Reason, symptoms, duration, and what you want the doctor/hospital to know."
              value={form.symptomsSummary}
              onChange={(e) => setField("symptomsSummary", e.target.value)}
              required
            />

            <label className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
              <input type="checkbox" checked={form.attachAiSummary} onChange={(e) => setField("attachAiSummary", e.target.checked)} />
              <span>Attach AI symptom/report summary if available. AI summary is only for doctor discussion, not diagnosis.</span>
            </label>

            <label className="flex gap-3 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-slate-700">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>I consent to share this appointment request and symptom summary with this provider.</span>
            </label>

            <div className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">
              <ShieldCheck className="mr-2 inline text-emerald-600" size={16} />
              Phase 1 has no appointment platform payment. Future booking fees must be shown before payment and are never connected to blood donation.
            </div>

            <button className="btn-primary w-full" disabled={!activeOnPlatform}>
              Send appointment interest
            </button>
          </form>
        </section>
      </div>
    </RoleBasedLayout>
  );
}
