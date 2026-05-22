import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, NavLink, useLocation } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Award,
  BadgeCheck,
  Bell,
  Bot,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Coins,
  Droplets,
  ExternalLink,
  FileText,
  HeartHandshake,
  LocateFixed,
  LockKeyhole,
  LogOut,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Stethoscope,
  TimerReset,
  UserRound
} from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export const BLOOD_GROUPS = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];
export const SEARCH_RADII = [2, 5, 10, 20, 50];

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export function AdminOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader />;
  if (!user?.isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

export function FullPageLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50">
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm">
        Loading B Donor...
      </div>
    </div>
  );
}

export function LogoMark() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-donor-red text-white shadow-sm">
        <Droplets size={22} />
      </span>
      <span>
        <span className="block text-base font-extrabold leading-tight text-slate-950">B Donor</span>
        <span className="block text-xs font-semibold text-donor-red">Every Life Matters</span>
      </span>
    </Link>
  );
}

export function RoleBasedLayout({ children }) {
  const { user, logout } = useAuth();
  const links = [
    { to: "/dashboard", label: "Dashboard", icon: Activity },
    { to: "/need-blood", label: "Need Blood", icon: Droplets },
    { to: "/ai-health-assistant", label: "Ask AI", icon: Bot },
    { to: "/find-care", label: "Care", icon: Stethoscope },
    { to: "/appointments", label: "Appointments", icon: CalendarDays },
    { to: "/certificates", label: "Certificates", icon: BadgeCheck },
    { to: "/privacy-center", label: "Privacy", icon: LockKeyhole },
    { to: "/donor-coin", label: "Impact", icon: Coins }
  ];

  if (user?.isAdmin) links.push({ to: "/admin", label: "Admin", icon: ShieldCheck });

  return (
    <div className="app-shell min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-white/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <LogoMark />
          <div className="flex items-center gap-2">
            <NotificationDrawer />
            <button className="btn-secondary px-3" onClick={logout} title="Logout">
              <LogOut size={17} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
        <nav className="mx-auto hidden max-w-6xl gap-2 overflow-x-auto px-4 pb-3 md:flex">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? "bg-donor-red text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-soft backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {links.slice(0, 5).map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-bold ${isActive ? "bg-red-50 text-donor-red" : "text-slate-500"}`}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function NotificationDrawer() {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    api.get("/donor-alerts/mine")
      .then((res) => setAlerts(res.data.alerts || []))
      .catch(() => setAlerts([]));
  }, []);

  return (
    <div className="relative">
      <button className="btn-secondary px-3" onClick={() => setOpen((value) => !value)} title="Notifications">
        <Bell size={17} />
        {alerts.length > 0 && <span className="h-2 w-2 rounded-full bg-donor-red" />}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft">
          <p className="mb-2 text-sm font-extrabold text-slate-950">Live alerts</p>
          <div className="space-y-2">
            {alerts.slice(0, 4).map((alert) => (
              <Link className="block rounded-xl bg-slate-50 p-3 text-sm hover:bg-red-50" to="/dashboard" key={alert._id}>
                <span className="font-bold text-slate-950">{alert.requestedBloodGroup}</span>
                <span className="ml-2 capitalize text-slate-500">{alert.status}</span>
              </Link>
            ))}
            {!alerts.length && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No donor alerts yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export function BloodGroupBadge({ group, matchType }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${matchType === "compatible" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-donor-red"}`}>
      <Droplets size={13} />
      {group || "N/A"}
    </span>
  );
}

export function EmergencyCompatibleBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
      <AlertTriangle size={13} />
      Emergency compatible match
    </span>
  );
}

export function ApprovalStatusCard({ title, enabled, status }) {
  const badge = !enabled ? "Not started" : status;
  const tone = status === "approved"
    ? "bg-emerald-100 text-emerald-700"
    : status === "rejected"
      ? "bg-red-100 text-red-700"
      : "bg-amber-100 text-amber-700";

  return (
    <div className="card flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-bold text-slate-950">{title}</p>
        <p className="text-xs text-slate-500">Patients are active automatically. Other profiles need admin approval.</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${enabled ? tone : "bg-slate-100 text-slate-600"}`}>
        {badge}
      </span>
    </div>
  );
}

export function RadiusSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {SEARCH_RADII.map((radius) => (
        <button
          key={radius}
          type="button"
          onClick={() => onChange(radius)}
          className={`rounded-lg border px-2 py-2 text-sm font-bold ${Number(value) === radius ? "border-donor-red bg-red-50 text-donor-red" : "border-slate-200 bg-white text-slate-600"}`}
        >
          {radius}km
        </button>
      ))}
    </div>
  );
}

export function LocationPicker({ value, onChange }) {
  const [status, setStatus] = useState("");

  function update(field, fieldValue) {
    onChange({ ...value, [field]: fieldValue });
  }

  function useGps() {
    if (!navigator.geolocation) {
      setStatus("GPS is not available on this device. Use manual location.");
      return;
    }

    setStatus("Getting GPS location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          ...value,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          locationSource: "gps"
        });
        setStatus("GPS location added.");
      },
      () => setStatus("GPS failed. Manual location is okay.")
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-secondary" onClick={useGps}>
          <LocateFixed size={17} />
          Use GPS
        </button>
        <span className="text-xs text-slate-500">{status || "Manual location works if GPS is not available."}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="field" placeholder="Village / area" value={value.village || ""} onChange={(e) => update("village", e.target.value)} />
        <input className="field" placeholder="City" value={value.city || ""} onChange={(e) => update("city", e.target.value)} />
        <input className="field" placeholder="District" value={value.district || ""} onChange={(e) => update("district", e.target.value)} />
        <input className="field" placeholder="State" value={value.state || ""} onChange={(e) => update("state", e.target.value)} />
        <input className="field" placeholder="Pincode" value={value.pincode || ""} onChange={(e) => update("pincode", e.target.value)} />
        <input className="field" placeholder="Address" value={value.address || ""} onChange={(e) => update("address", e.target.value)} />
      </div>
    </div>
  );
}

export function DonorConsentBox({ checked, onChange }) {
  return (
    <label className="flex gap-3 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-slate-700">
      <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        I understand B Donor only connects voluntary donors. I will donate only if healthy and only through a licensed hospital, blood bank, or medical professional.
      </span>
    </label>
  );
}

export function PatientConsentBox({ checked, onChange }) {
  return (
    <label className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
      <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        I agree to store my basic health, location, and request information for care coordination. Reports stay private unless I share them.
      </span>
    </label>
  );
}

export function HowItWorksCards() {
  const cards = [
    ["Need Blood", "Submit blood group, location, urgency, and hospital details. B Donor searches nearby approved donors."],
    ["Donor Alert", "Matching approved donors receive in-app and WhatsApp alert links."],
    ["Donor Accepts", "Your contact details are shared only after donor accepts."],
    ["Hospital / Blood Bank", "Blood collection and transfusion must happen only through licensed medical professionals/hospitals."]
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(([title, text], index) => (
        <div className="card" key={title}>
          <div className="mb-3 grid h-8 w-8 place-items-center rounded-lg bg-red-50 text-donor-red">{index + 1}</div>
          <h3 className="font-bold text-slate-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
        </div>
      ))}
    </div>
  );
}

export function BloodRequestCard({ request }) {
  const accepted = request.acceptedDonor;

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-slate-950">{request.patientName}</p>
          <p className="text-sm text-slate-500">{request.hospitalName || request.city || "Location pending"}</p>
        </div>
        <BloodGroupBadge group={request.bloodGroupRequired} />
      </div>
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 capitalize text-slate-700">{request.urgency}</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{request.unitsRequired || 1} unit(s)</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{request.searchRadiusKm}km radius</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 capitalize text-slate-700">{request.status}</span>
      </div>
      {request.matchedDonors?.length > 0 && (
        <p className="text-sm text-slate-600">
          {request.exactMatchDonors?.length || 0} exact match(es), {request.compatibleMatchDonors?.length || 0} compatible emergency match(es).
        </p>
      )}
      {accepted && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Accepted donor: <strong>{accepted.name}</strong> ({accepted.bloodGroup}) - {accepted.phone}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {accepted && <Link className="btn-secondary" to={`/tracking/${request._id}`}><Navigation size={16} /> Track donor</Link>}
        {["donor_accepted", "tracking", "arrived"].includes(request.status) && (
          <button className="btn-secondary" type="button" onClick={() => api.post(`/blood-requests/${request._id}/mark-donated`).then(() => window.location.reload())}>
            Blood donated
          </button>
        )}
      </div>
    </div>
  );
}

export function DonorAlertCard({ alert, onRespond }) {
  const request = alert.bloodRequestId || {};

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-slate-950">{request.hospitalName || request.city || "Blood request"}</p>
          <p className="text-sm text-slate-500">{alert.distanceKm ? `${alert.distanceKm} km away` : "Distance not available"}</p>
        </div>
        {alert.matchType === "compatible" ? <EmergencyCompatibleBadge /> : <BloodGroupBadge group={alert.requestedBloodGroup} />}
      </div>
      <p className="whitespace-pre-line text-sm leading-6 text-slate-600">{alert.messageText}</p>
      {alert.manualWhatsAppUrl && (
        <a className="inline-flex text-sm font-bold text-donor-red" href={alert.manualWhatsAppUrl} target="_blank" rel="noreferrer">
          Open WhatsApp manual alert
        </a>
      )}
      <div className="flex gap-2">
        <button className="btn-primary" onClick={() => onRespond(alert._id, "accept")} disabled={alert.status === "accepted"}>
          Accept
        </button>
        <button className="btn-secondary" onClick={() => onRespond(alert._id, "decline")} disabled={alert.status === "declined"}>
          Decline
        </button>
      </div>
      {alert.status === "accepted" && alert.bloodRequestId?._id && (
        <Link className="btn-secondary w-full" to={`/tracking/${alert.bloodRequestId._id}`}>
          <Navigation size={16} />
          Share live location
        </Link>
      )}
    </div>
  );
}

export function DoctorCard({ doctor }) {
  const profile = doctor.doctorProfile || {};
  const isActive = Boolean(profile.appointmentEnabled);

  return (
    <div className="card space-y-3">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-red-50 text-donor-red"><Stethoscope size={20} /></span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-950">Dr. {doctor.name}</p>
          <p className="text-sm text-slate-600">{profile.specialization || "General medicine"}</p>
          <p className="mt-1 text-xs text-slate-500">{doctor.location?.city || profile.currentWorkingCity || "Location not listed"}</p>
        </div>
        {profile.verifiedBadge && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">Verified</span>}
      </div>
      <div className="grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-3">
        <span className="rounded-lg bg-slate-50 px-2.5 py-2">{profile.experience || 0} yrs exp</span>
        <span className="rounded-lg bg-slate-50 px-2.5 py-2">Rs {profile.consultationFee || 0}</span>
        <span className="rounded-lg bg-slate-50 px-2.5 py-2 capitalize">{profile.consultationModes?.[0] || "clinic"}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link className="btn-secondary" to={`/doctors/${doctor._id}`}>
          View profile
          <ExternalLink size={15} />
        </Link>
        {isActive ? (
          <Link className="btn-primary" to={`/appointments/request/doctor/${doctor._id}`}>
            Request appointment
          </Link>
        ) : doctor.phone ? (
          <a className="btn-secondary" href={`tel:${doctor.phone}`}>
            <Phone size={15} />
            Call clinic
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function HospitalCard({ hospital }) {
  const profile = hospital.hospitalProfile || {};
  const isActive = Boolean(profile.appointmentEnabled);

  return (
    <div className="card space-y-3">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-red-50 text-donor-red"><Building2 size={20} /></span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-950">{profile.hospitalName || hospital.name}</p>
          <p className="text-sm text-slate-600">{profile.hospitalType || "Hospital"}</p>
          <p className="mt-1 text-xs text-slate-500">{hospital.location?.city || "Location not listed"}</p>
        </div>
        {profile.verifiedBadge && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">Verified</span>}
      </div>
      <div className="grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-3">
        <span className="rounded-lg bg-slate-50 px-2.5 py-2">{profile.departments?.[0] || "General care"}</span>
        <span className="rounded-lg bg-slate-50 px-2.5 py-2">{profile.bloodBankAvailable ? "Blood bank listed" : "Blood bank not listed"}</span>
        <span className="rounded-lg bg-slate-50 px-2.5 py-2">{profile.timings || "Timings not listed"}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link className="btn-secondary" to={`/hospitals/${hospital._id}`}>
          View profile
          <ExternalLink size={15} />
        </Link>
        {isActive ? (
          <Link className="btn-primary" to={`/appointments/request/hospital/${hospital._id}`}>
            Request appointment
          </Link>
        ) : (profile.emergencyPhone || hospital.phone) ? (
          <a className="btn-secondary" href={`tel:${profile.emergencyPhone || hospital.phone}`}>
            <Phone size={15} />
            Call hospital
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function BloodRequestForm({ onCreated }) {
  const [form, setForm] = useState({
    patientName: "",
    patientAge: "",
    patientGender: "",
    attendantName: "",
    attendantPhone: "",
    bloodGroupRequired: "O+",
    unitsRequired: 1,
    urgency: "urgent",
    hospitalName: "",
    reason: "",
    searchRadiusKm: 5,
    allowCompatibleInEmergency: true
  });
  const [location, setLocation] = useState({});
  const [patientConsent, setPatientConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!patientConsent) {
      setMessage("Please accept consent before creating a blood request.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const res = await api.post("/blood-requests", { ...form, ...location, consentAccepted: patientConsent });
      setMessage(`${res.data.message} Alerts created: ${res.data.alertsCreated || 0}.`);
      onCreated?.(res.data.request);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not create request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card space-y-4" onSubmit={submit}>
      <div>
        <h2 className="text-xl font-extrabold text-slate-950">Need Blood</h2>
        <p className="mt-1 text-sm text-slate-600">Exact blood group is searched first. Compatible groups appear only for urgent or critical emergency fallback.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="field" placeholder="Patient name" value={form.patientName} onChange={(e) => setField("patientName", e.target.value)} required />
        <input className="field" placeholder="Patient age" type="number" value={form.patientAge} onChange={(e) => setField("patientAge", e.target.value)} />
        <select className="field" value={form.patientGender} onChange={(e) => setField("patientGender", e.target.value)}>
          <option value="">Patient gender</option>
          <option>Female</option>
          <option>Male</option>
          <option>Other</option>
        </select>
        <select className="field" value={form.bloodGroupRequired} onChange={(e) => setField("bloodGroupRequired", e.target.value)}>
          {BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}
        </select>
        <input className="field" placeholder="Units required" type="number" min="1" value={form.unitsRequired} onChange={(e) => setField("unitsRequired", e.target.value)} />
        <select className="field" value={form.urgency} onChange={(e) => setField("urgency", e.target.value)}>
          <option value="normal">Normal</option>
          <option value="urgent">Urgent</option>
          <option value="critical">Critical</option>
        </select>
        <input className="field" placeholder="Attendant name" value={form.attendantName} onChange={(e) => setField("attendantName", e.target.value)} />
        <input className="field" placeholder="Attendant phone" value={form.attendantPhone} onChange={(e) => setField("attendantPhone", e.target.value)} />
      </div>
      <input className="field" placeholder="Hospital name" value={form.hospitalName} onChange={(e) => setField("hospitalName", e.target.value)} />
      <textarea className="field min-h-24" placeholder="Reason / notes" value={form.reason} onChange={(e) => setField("reason", e.target.value)} />
      <div>
        <p className="label mb-2">Search radius</p>
        <RadiusSelector value={form.searchRadiusKm} onChange={(value) => setField("searchRadiusKm", value)} />
      </div>
      <LocationPicker value={location} onChange={setLocation} />
      <PatientConsentBox checked={patientConsent} onChange={setPatientConsent} />
      <label className="flex gap-3 text-sm text-slate-700">
        <input type="checkbox" checked={form.allowCompatibleInEmergency} onChange={(e) => setField("allowCompatibleInEmergency", e.target.checked)} />
        Allow compatible blood groups only for urgent/critical emergency fallback.
      </label>
      {message && <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">{message}</p>}
      <button className="btn-primary w-full sm:w-auto" disabled={submitting}>{submitting ? "Searching..." : "Create request and search donors"}</button>
    </form>
  );
}

export function AIHealthAssistant() {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  async function send(e) {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message.trim();
    setHistory((current) => [...current, { role: "user", text: userMessage }]);
    setMessage("");
    setLoading(true);
    try {
      const res = await api.post("/medbot/chat", { message: userMessage, saveToHistory: true });
      setHistory((current) => [...current, {
        role: "assistant",
        text: res.data.reply,
        redFlags: res.data.redFlags,
        followUpQuestions: res.data.followUpQuestions
      }]);
    } catch (error) {
      setHistory((current) => [...current, { role: "assistant", text: error.response?.data?.message || "AI assistant is unavailable right now." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card flex min-h-[560px] flex-col">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-950"><Bot className="text-donor-red" /> B Donor AI Health Assistant</h2>
        <p className="mt-1 text-sm text-slate-600">It can organize symptoms and reports for doctor discussion. It cannot diagnose or prescribe.</p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {history.length === 0 && (
          <div className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            Tell me symptoms, duration, severity, and any current medicines. For chest pain, breathing trouble, severe bleeding, fainting, stroke symptoms, or other serious signs, seek emergency medical help immediately.
          </div>
        )}
        {history.map((item, index) => (
          <div key={`${item.role}-${index}`} className={`rounded-lg p-3 text-sm leading-6 ${item.role === "user" ? "ml-auto max-w-[86%] bg-donor-red text-white" : "mr-auto max-w-[92%] bg-slate-100 text-slate-700"}`}>
            <p className="whitespace-pre-line">{item.text}</p>
            {item.redFlags?.map((flag) => <p className="mt-2 font-bold text-red-700" key={flag}>{flag}</p>)}
            {item.followUpQuestions?.length > 0 && (
              <ul className="mt-2 space-y-1">
                {item.followUpQuestions.map((question) => <li key={question}>- {question}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
      <form className="flex gap-2 border-t border-slate-100 pt-3" onSubmit={send}>
        <input className="field" placeholder="Describe symptoms or ask for a doctor summary..." value={message} onChange={(e) => setMessage(e.target.value)} />
        <button className="btn-primary shrink-0" disabled={loading}>{loading ? "..." : "Send"}</button>
      </form>
    </div>
  );
}

export function MedicalReportUploader({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");

  async function upload(e) {
    e.preventDefault();
    if (!file) return setMessage("Choose a PDF, JPG, or PNG report.");

    const formData = new FormData();
    formData.append("report", file);
    formData.append("reportCategory", category);

    try {
      const res = await api.post("/medical-reports/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      await api.post(`/medical-reports/${res.data.report._id}/analyze`, {});
      setMessage("Report uploaded. AI summary is prepared for doctor discussion only.");
      setFile(null);
      setCategory("");
      onUploaded?.();
    } catch (error) {
      setMessage(error.response?.data?.message || "Upload failed.");
    }
  }

  return (
    <form className="card space-y-3" onSubmit={upload}>
      <div>
        <h3 className="font-bold text-slate-950">Upload medical report</h3>
        <p className="text-sm text-slate-600">PDF, JPG, or PNG. Private by default.</p>
      </div>
      <input className="field" placeholder="Report category" value={category} onChange={(e) => setCategory(e.target.value)} />
      <input className="field" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0])} />
      {message && <p className="text-sm text-slate-600">{message}</p>}
      <button className="btn-primary">Upload report</button>
    </form>
  );
}

export function QuickActionGrid() {
  const actions = [
    { to: "/need-blood", label: "Need Blood Now", icon: Droplets, text: "Start emergency matching." },
    { to: "/dashboard#donor", label: "Donate Blood", icon: HeartHandshake, text: "Go available after approval." },
    { to: "/ai-health-assistant", label: "Ask AI", icon: Bot, text: "Prepare symptom/report summary." },
    { to: "/appointments", label: "Appointments", icon: CalendarDays, text: "Request care without payment." },
    { to: "/certificates", label: "Certificates", icon: BadgeCheck, text: "Verify impact records." },
    { to: "/privacy-center", label: "Privacy", icon: LockKeyhole, text: "Manage consent." }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {actions.map(({ to, label, icon: Icon, text }) => (
        <Link className="card group" key={label} to={to}>
          <div className="mb-4 flex items-center justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-red-50 text-donor-red"><Icon size={20} /></span>
            <ChevronRight className="text-slate-300 group-hover:text-donor-red" size={18} />
          </div>
          <p className="font-bold text-slate-950">{label}</p>
          <p className="mt-1 text-sm text-slate-600">{text}</p>
        </Link>
      ))}
    </div>
  );
}

export function useReports() {
  const [reports, setReports] = useState([]);

  async function loadReports() {
    const res = await api.get("/medical-reports/mine");
    setReports(res.data.reports || []);
  }

  useEffect(() => {
    loadReports().catch(() => setReports([]));
  }, []);

  return { reports, loadReports };
}

export function ReportsList({ reports }) {
  if (!reports?.length) {
    return <div className="card text-sm text-slate-600">No reports uploaded yet.</div>;
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div className="card" key={report._id}>
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-600"><FileText size={20} /></span>
            <div>
              <p className="font-bold text-slate-950">{report.fileName}</p>
              <p className="text-sm text-slate-600">{report.aiSummary || "AI summary not generated yet."}</p>
              {report.redFlags?.map((flag) => <p className="mt-2 text-sm font-bold text-red-700" key={flag}>{flag}</p>)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon = Activity }) {
  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-500">{label}</span>
        <Icon className="text-donor-red" size={18} />
      </div>
      <p className="text-2xl font-extrabold text-slate-950">{value ?? 0}</p>
    </div>
  );
}

export function LiveStatusCard({ title, status, children, tone = "red" }) {
  const color = tone === "green" ? "bg-emerald-500" : tone === "amber" ? "bg-amber-500" : "bg-donor-red";
  return (
    <div className="card overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-1 text-xl font-extrabold capitalize text-slate-950">{status || "Ready"}</p>
        </div>
        <span className={`h-3 w-3 rounded-full ${color} shadow-[0_0_0_6px_rgba(201,31,47,0.10)]`} />
      </div>
      {children}
    </div>
  );
}

export function MiniMap({ donorLocation, requestLocation, etaMinutes, distanceKm }) {
  return (
    <div className="map-grid relative min-h-72 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
      <div className="absolute left-[18%] top-[58%] grid h-11 w-11 place-items-center rounded-full bg-white shadow-soft">
        <MapPin className="text-donor-red" size={22} />
      </div>
      <div className="absolute right-[20%] top-[28%] grid h-12 w-12 place-items-center rounded-full bg-donor-red text-white shadow-soft">
        <Navigation size={22} />
      </div>
      <div className="absolute left-[28%] top-[43%] h-1 w-[42%] -rotate-12 rounded-full bg-donor-red/30" />
      <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/80 bg-white/90 p-3 shadow-soft backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-500">Approx ETA</p>
            <p className="text-lg font-black text-slate-950">{etaMinutes ? `${etaMinutes} min` : "Waiting"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-500">Distance</p>
            <p className="text-lg font-black text-donor-red">{distanceKm ? `${distanceKm} km` : "Not live"}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Donor live location is shown only for this request after consent.
        </p>
      </div>
    </div>
  );
}

export function RequestTimeline({ status }) {
  const steps = [
    ["searching", "Request created"],
    ["matched", "Donor notified"],
    ["donor_accepted", "Donor accepted"],
    ["tracking", "Donor on the way"],
    ["arrived", "Arrived"],
    ["donated", "Blood donated"],
    ["fulfilled", "Consent completed"]
  ];
  const currentIndex = Math.max(0, steps.findIndex(([key]) => key === status));

  return (
    <div className="card space-y-3">
      <h3 className="font-extrabold text-slate-950">Request timeline</h3>
      {steps.map(([key, label], index) => (
        <div className="flex items-center gap-3" key={key}>
          <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${index <= currentIndex ? "bg-donor-red text-white" : "bg-slate-100 text-slate-400"}`}>
            {index + 1}
          </span>
          <span className={`text-sm font-semibold ${index <= currentIndex ? "text-slate-950" : "text-slate-400"}`}>{label}</span>
        </div>
      ))}
    </div>
  );
}

export function RecoveryCard({ donorProfile }) {
  const cooldownUntil = donorProfile?.cooldownUntil || donorProfile?.nextEligibleDonationDate;
  return (
    <LiveStatusCard title="Donor recovery" status={cooldownUntil ? "Recovery Mode" : "Eligible"} tone={cooldownUntil ? "amber" : "green"}>
      <div className="space-y-2 text-sm text-slate-600">
        <p><TimerReset className="mr-2 inline text-amber-600" size={16} /> Next eligible date: <strong>{cooldownUntil ? new Date(cooldownUntil).toLocaleDateString() : "Available after approval"}</strong></p>
        <p>Drink enough water, eat iron-rich foods, rest, and avoid heavy exercise for 24 hours after donation.</p>
      </div>
      <Link className="btn-secondary mt-4 w-full" to="/donor/recovery">Recovery tips</Link>
    </LiveStatusCard>
  );
}

export function DonorCoinCard({ wallet, compact = false }) {
  return (
    <LiveStatusCard title="DONOR COIN Impact Points" status={wallet?.level || "New Helper"} tone="green">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-black text-slate-950">{wallet?.impactPoints || 0}</p>
          <p className="text-sm text-slate-500">non-cash recognition points</p>
        </div>
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-700">
          <Award size={28} />
        </span>
      </div>
      {!compact && <p className="mt-3 text-xs leading-5 text-slate-500">Not payment, not tradable, not withdrawable, and no monetary value.</p>}
      <Link className="btn-secondary mt-4 w-full" to="/donor-coin">Open impact wallet</Link>
    </LiveStatusCard>
  );
}

export function SafetyDisclaimer() {
  return (
    <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm leading-6 text-slate-700">
      <strong className="text-donor-red">Safety disclaimer:</strong> B Donor only helps connect voluntary blood donors with patients/hospitals. Blood collection, testing, transfusion, and storage must be handled only by licensed hospitals/blood banks/medical professionals.
    </div>
  );
}

export function ProfileSummary({ user }) {
  const approvals = useMemo(() => ([
    ["Patient", true, "approved"],
    ["Donor", user?.donorProfile?.enabled, user?.donorProfile?.approvalStatus],
    ["Doctor", user?.doctorProfile?.enabled, user?.doctorProfile?.approvalStatus],
    ["Hospital", user?.hospitalProfile?.enabled, user?.hospitalProfile?.approvalStatus]
  ]), [user]);

  return (
    <section className="space-y-3">
      <div className="card flex items-start gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-lg bg-red-50 text-donor-red"><UserRound /></span>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950">{user?.name}</h1>
          <p className="text-sm text-slate-600">{user?.email} {user?.bloodGroup ? `- ${user.bloodGroup}` : ""}</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {approvals.map(([title, enabled, status]) => (
          <ApprovalStatusCard key={title} title={title} enabled={enabled} status={status} />
        ))}
      </div>
    </section>
  );
}

export function EmptyState({ title, text, icon: Icon = CheckCircle2 }) {
  return (
    <div className="card text-center">
      <span className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-500"><Icon size={20} /></span>
      <p className="font-bold text-slate-950">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{text}</p>
    </div>
  );
}
