import { useEffect, useState } from "react";
import {
  BLOOD_GROUPS,
  BloodRequestCard,
  DonorCoinCard,
  DonorAlertCard,
  DonorConsentBox,
  EmptyState,
  LocationPicker,
  MedicalReportUploader,
  ProfileSummary,
  QuickActionGrid,
  RecoveryCard,
  ReportsList,
  RoleBasedLayout,
  SafetyDisclaimer,
  useReports
} from "../components/PortalComponents";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const { reports, loadReports } = useReports();
  const [requests, setRequests] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [donorForm, setDonorForm] = useState({
    bloodGroup: user?.bloodGroup || "",
    donorConsentAccepted: false,
    whatsappSmsConsentAccepted: true,
    preferredRadiusKm: 10
  });
  const [location, setLocation] = useState({});
  const [doctorForm, setDoctorForm] = useState({
    qualification: "",
    specialization: "",
    experience: "",
    medicalRegistrationNumber: "",
    issuingMedicalCouncil: "",
    currentHospitalClinic: "",
    currentWorkingCity: "",
    consultationFee: "",
    about: ""
  });
  const [hospitalForm, setHospitalForm] = useState({
    hospitalName: "",
    registrationNumber: "",
    hospitalType: "",
    contactPerson: "",
    emergencyPhone: "",
    bloodBankAvailable: false,
    about: ""
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const [requestRes, alertRes, walletRes] = await Promise.allSettled([
      api.get("/blood-requests/mine"),
      api.get("/donor-alerts/mine"),
      api.get("/donor-coin/wallet")
    ]);

    if (requestRes.status === "fulfilled") setRequests(requestRes.value.data.requests || []);
    if (alertRes.status === "fulfilled") setAlerts(alertRes.value.data.alerts || []);
    if (walletRes.status === "fulfilled") setWallet(walletRes.value.data.wallet || null);
  }

  async function saveLocation(e) {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/users/location", location);
      await refreshUser();
      setMessage("Location saved.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not save location.");
    }
  }

  async function activateDonor(e) {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/donors/activate", donorForm);
      await refreshUser();
      setMessage("Donor profile submitted for admin approval.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not activate donor profile.");
    }
  }

  async function toggleAvailability() {
    setMessage("");
    try {
      await api.put("/donors/availability", { isAvailable: !user.donorProfile?.isAvailable });
      await refreshUser();
      setMessage("Donor availability updated.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Availability update failed.");
    }
  }

  async function respondToAlert(alertId, action) {
    await api.post(`/donor-alerts/${alertId}/${action}`);
    await loadDashboard();
  }

  async function applyDoctor(e) {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/doctors/apply", doctorForm);
      await refreshUser();
      setMessage("Doctor profile submitted for admin approval.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Doctor application failed.");
    }
  }

  async function applyHospital(e) {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/hospitals/apply", hospitalForm);
      await refreshUser();
      setMessage("Hospital profile submitted for admin approval.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Hospital application failed.");
    }
  }

  return (
    <RoleBasedLayout>
      <div className="space-y-6">
        <ProfileSummary user={user} />
        <QuickActionGrid />
        {message && <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">{message}</p>}
        <SafetyDisclaimer />

        <section className="grid gap-4 lg:grid-cols-3">
          <RecoveryCard donorProfile={user?.donorProfile} />
          <DonorCoinCard wallet={wallet || user?.donorCoin} compact />
          <div className="card">
            <p className="text-sm font-semibold text-slate-500">Emergency mode</p>
            <h2 className="mt-1 text-xl font-extrabold text-slate-950">Need Blood, Donate Blood, Ask AI</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Use the first three actions for urgent help. B Donor keeps exact-match priority and only shows compatible groups as emergency fallback.</p>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="card">
              <h2 className="text-xl font-extrabold text-slate-950">My blood requests</h2>
              <div className="mt-4 space-y-3">
                {requests.length ? requests.map((request) => <BloodRequestCard key={request._id} request={request} />) : <EmptyState title="No requests yet" text="Create one when a patient or hospital needs voluntary donor support." />}
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-extrabold text-slate-950">Medical reports</h2>
              <div className="mt-4 space-y-3">
                <MedicalReportUploader onUploaded={loadReports} />
                <ReportsList reports={reports} />
              </div>
            </div>
          </div>

          <div className="space-y-4" id="donor">
            <form className="card space-y-3" onSubmit={saveLocation}>
              <h2 className="text-xl font-extrabold text-slate-950">Location</h2>
              <p className="text-sm text-slate-600">GPS helps donor matching. Manual location is supported when GPS is not available.</p>
              <LocationPicker value={location} onChange={setLocation} />
              <button className="btn-primary">Save location</button>
            </form>

            <form className="card space-y-3" onSubmit={activateDonor}>
              <h2 className="text-xl font-extrabold text-slate-950">Become donor</h2>
              <select className="field" value={donorForm.bloodGroup} onChange={(e) => setDonorForm({ ...donorForm, bloodGroup: e.target.value })}>
                <option value="">Blood group</option>
                {BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}
              </select>
              <input className="field" type="number" min="2" max="50" placeholder="Preferred radius km" value={donorForm.preferredRadiusKm} onChange={(e) => setDonorForm({ ...donorForm, preferredRadiusKm: e.target.value })} />
              <DonorConsentBox checked={donorForm.donorConsentAccepted} onChange={(checked) => setDonorForm({ ...donorForm, donorConsentAccepted: checked })} />
              <label className="flex gap-3 text-sm text-slate-700">
                <input type="checkbox" checked={donorForm.whatsappSmsConsentAccepted} onChange={(e) => setDonorForm({ ...donorForm, whatsappSmsConsentAccepted: e.target.checked })} />
                I agree to in-app and manual WhatsApp/SMS alert coordination.
              </label>
              <button className="btn-primary">Submit donor profile</button>
              {user?.donorProfile?.enabled && (
                <button type="button" className="btn-secondary w-full" onClick={toggleAvailability}>
                  Availability: {user.donorProfile.isAvailable ? "ON" : "OFF"}
                </button>
              )}
            </form>

            <div className="card">
              <h2 className="text-xl font-extrabold text-slate-950">Donor alerts</h2>
              <div className="mt-4 space-y-3">
                {alerts.length ? alerts.map((alert) => <DonorAlertCard key={alert._id} alert={alert} onRespond={respondToAlert} />) : <EmptyState title="No alerts" text="Approved available donors receive nearby alerts here." />}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <form className="card space-y-3" onSubmit={applyDoctor}>
            <h2 className="text-xl font-extrabold text-slate-950">Doctor profile</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="field" placeholder="Qualification" value={doctorForm.qualification} onChange={(e) => setDoctorForm({ ...doctorForm, qualification: e.target.value })} />
              <input className="field" placeholder="Specialization" value={doctorForm.specialization} onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })} />
              <input className="field" placeholder="Experience years" value={doctorForm.experience} onChange={(e) => setDoctorForm({ ...doctorForm, experience: e.target.value })} />
              <input className="field" placeholder="Medical registration number" value={doctorForm.medicalRegistrationNumber} onChange={(e) => setDoctorForm({ ...doctorForm, medicalRegistrationNumber: e.target.value })} />
              <input className="field" placeholder="Medical council" value={doctorForm.issuingMedicalCouncil} onChange={(e) => setDoctorForm({ ...doctorForm, issuingMedicalCouncil: e.target.value })} />
              <input className="field" placeholder="Working city" value={doctorForm.currentWorkingCity} onChange={(e) => setDoctorForm({ ...doctorForm, currentWorkingCity: e.target.value })} />
            </div>
            <textarea className="field min-h-20" placeholder="About" value={doctorForm.about} onChange={(e) => setDoctorForm({ ...doctorForm, about: e.target.value })} />
            <button className="btn-primary">Submit doctor profile</button>
          </form>

          <form className="card space-y-3" onSubmit={applyHospital}>
            <h2 className="text-xl font-extrabold text-slate-950">Hospital profile</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="field" placeholder="Hospital name" value={hospitalForm.hospitalName} onChange={(e) => setHospitalForm({ ...hospitalForm, hospitalName: e.target.value })} />
              <input className="field" placeholder="Registration number" value={hospitalForm.registrationNumber} onChange={(e) => setHospitalForm({ ...hospitalForm, registrationNumber: e.target.value })} />
              <input className="field" placeholder="Hospital type" value={hospitalForm.hospitalType} onChange={(e) => setHospitalForm({ ...hospitalForm, hospitalType: e.target.value })} />
              <input className="field" placeholder="Emergency phone" value={hospitalForm.emergencyPhone} onChange={(e) => setHospitalForm({ ...hospitalForm, emergencyPhone: e.target.value })} />
            </div>
            <label className="flex gap-3 text-sm text-slate-700">
              <input type="checkbox" checked={hospitalForm.bloodBankAvailable} onChange={(e) => setHospitalForm({ ...hospitalForm, bloodBankAvailable: e.target.checked })} />
              Licensed blood bank available
            </label>
            <textarea className="field min-h-20" placeholder="About" value={hospitalForm.about} onChange={(e) => setHospitalForm({ ...hospitalForm, about: e.target.value })} />
            <button className="btn-primary">Submit hospital profile</button>
          </form>
        </section>
      </div>
    </RoleBasedLayout>
  );
}
