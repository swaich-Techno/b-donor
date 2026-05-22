import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, LogIn, UserPlus } from "lucide-react";
import {
  BLOOD_GROUPS,
  DonorConsentBox,
  LogoMark,
  PatientConsentBox,
  SafetyDisclaimer
} from "../components/PortalComponents";
import { useAuth } from "../context/AuthContext";

export default function AuthPage({ mode = "login" }) {
  const isRegister = mode === "register";
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    accountType: "patient",
    name: "",
    email: "",
    password: "",
    phone: "",
    bloodGroup: "",
    privacyAccepted: false,
    medicalDataAccepted: false,
    donorConsentAccepted: false,
    whatsappSmsConsentAccepted: false,
    specialization: "",
    medicalRegistrationNumber: "",
    hospitalName: "",
    registrationNumber: ""
  });

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setMessage("");

    try {
      if (isRegister) {
        if (!form.privacyAccepted || !form.medicalDataAccepted) {
          setMessage("Please accept privacy and medical data consent.");
          return;
        }

        await register({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          bloodGroup: form.bloodGroup,
          accountType: form.accountType,
          consent: {
            privacyAccepted: form.privacyAccepted,
            medicalDataAccepted: form.medicalDataAccepted,
            donorConsentAccepted: form.donorConsentAccepted,
            whatsappSmsConsentAccepted: form.whatsappSmsConsentAccepted
          },
          doctorProfile: {
            specialization: form.specialization,
            medicalRegistrationNumber: form.medicalRegistrationNumber
          },
          hospitalProfile: {
            hospitalName: form.hospitalName,
            registrationNumber: form.registrationNumber
          }
        });
      } else {
        await login({ email: form.email, password: form.password });
      }

      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (error) {
      setMessage(error.response?.data?.message || "Authentication failed.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <LogoMark />
          <Link className="btn-secondary" to="/"><ArrowLeft size={17} /> Home</Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1fr_0.9fr]">
        <form className="card space-y-4" onSubmit={submit}>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-950">{isRegister ? "Create B Donor account" : "Login to B Donor"}</h1>
            <p className="mt-1 text-sm text-slate-600">One account can be patient and donor. Doctors and hospitals need admin approval.</p>
          </div>

          {isRegister && (
            <div>
              <p className="label mb-2">Account type</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  ["patient", "Patient / Normal User"],
                  ["donor", "Become Donor"],
                  ["doctor", "Doctor"],
                  ["hospital", "Hospital"]
                ].map(([value, label]) => (
                  <button
                    className={`rounded-lg border px-3 py-2 text-left text-sm font-bold ${form.accountType === value ? "border-donor-red bg-red-50 text-donor-red" : "border-slate-200 bg-white text-slate-700"}`}
                    key={value}
                    type="button"
                    onClick={() => setField("accountType", value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isRegister && <input className="field" placeholder="Full name" value={form.name} onChange={(e) => setField("name", e.target.value)} required />}
          <input className="field" placeholder="Email" type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} required />
          <input className="field" placeholder="Password" type="password" value={form.password} onChange={(e) => setField("password", e.target.value)} required />

          {isRegister && (
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="field" placeholder="Phone" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
              <select className="field" value={form.bloodGroup} onChange={(e) => setField("bloodGroup", e.target.value)}>
                <option value="">Blood group</option>
                {BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}
              </select>
            </div>
          )}

          {isRegister && form.accountType === "doctor" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="field" placeholder="Specialization" value={form.specialization} onChange={(e) => setField("specialization", e.target.value)} />
              <input className="field" placeholder="Medical registration number" value={form.medicalRegistrationNumber} onChange={(e) => setField("medicalRegistrationNumber", e.target.value)} />
            </div>
          )}

          {isRegister && form.accountType === "hospital" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="field" placeholder="Hospital name" value={form.hospitalName} onChange={(e) => setField("hospitalName", e.target.value)} />
              <input className="field" placeholder="Registration number" value={form.registrationNumber} onChange={(e) => setField("registrationNumber", e.target.value)} />
            </div>
          )}

          {isRegister && (
            <div className="space-y-3">
              <PatientConsentBox checked={form.privacyAccepted && form.medicalDataAccepted} onChange={(checked) => {
                setField("privacyAccepted", checked);
                setField("medicalDataAccepted", checked);
              }} />
              {(form.accountType === "donor") && (
                <DonorConsentBox checked={form.donorConsentAccepted} onChange={(checked) => setField("donorConsentAccepted", checked)} />
              )}
              <label className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                <input type="checkbox" className="mt-1" checked={form.whatsappSmsConsentAccepted} onChange={(e) => setField("whatsappSmsConsentAccepted", e.target.checked)} />
                <span>I agree to receive in-app and manual WhatsApp/SMS alert coordination when needed.</span>
              </label>
            </div>
          )}

          {message && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{message}</p>}
          <button className="btn-primary w-full">{isRegister ? <UserPlus size={17} /> : <LogIn size={17} />} {isRegister ? "Register" : "Login"}</button>
          <p className="text-center text-sm text-slate-600">
            {isRegister ? "Already registered?" : "New to B Donor?"}{" "}
            <Link className="font-bold text-donor-red" to={isRegister ? "/login" : "/register"}>
              {isRegister ? "Login" : "Create account"}
            </Link>
          </p>
        </form>

        <aside className="space-y-4">
          <SafetyDisclaimer />
          <div className="card">
            <h2 className="font-bold text-slate-950">Admin account</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Admins are manually created only. Use the backend script in README after MongoDB is configured.</p>
          </div>
        </aside>
      </main>
    </div>
  );
}
