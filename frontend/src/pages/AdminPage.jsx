import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  FileCheck2,
  ListChecks,
  RadioTower,
  ShieldAlert,
  WalletCards
} from "lucide-react";
import {
  BloodGroupBadge,
  EmptyState,
  MiniMap,
  RoleBasedLayout,
  StatCard
} from "../components/PortalComponents";
import api from "../api/client";

function StatusPill({ status }) {
  const tone = {
    active: "bg-emerald-100 text-emerald-700",
    valid: "bg-emerald-100 text-emerald-700",
    accepted: "bg-emerald-100 text-emerald-700",
    completed: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    draft: "bg-slate-100 text-slate-600",
    disputed: "bg-amber-100 text-amber-700",
    rejected: "bg-red-100 text-red-700",
    revoked: "bg-red-100 text-red-700",
    cancelled: "bg-slate-100 text-slate-600",
    expired: "bg-slate-100 text-slate-600"
  }[status] || "bg-slate-100 text-slate-600";

  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${tone}`}>{status || "unknown"}</span>;
}

function PanelHeader({ icon: Icon, title, text }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-red-50 text-donor-red">
        <Icon size={20} />
      </span>
      <div>
        <h2 className="text-xl font-extrabold text-slate-950">{title}</h2>
        {text && <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [pending, setPending] = useState({ donors: [], doctors: [], hospitals: [] });
  const [analytics, setAnalytics] = useState(null);
  const [liveRequests, setLiveRequests] = useState([]);
  const [tracking, setTracking] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [partners, setPartners] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [message, setMessage] = useState("");
  const [certificateForm, setCertificateForm] = useState({ userId: "", type: "verified_donor" });
  const [subscriptionForm, setSubscriptionForm] = useState({ userId: "", planId: "", amount: "", endDate: "" });
  const [csrForm, setCsrForm] = useState({
    organizationName: "",
    contactPerson: "",
    phone: "",
    email: "",
    sponsorshipType: "awareness_drive",
    campaignTitle: "",
    campaignArea: "",
    amountCommitted: "",
    publicVisibility: false
  });

  useEffect(() => {
    loadAdmin();
  }, []);

  async function loadAdmin() {
    const requests = await Promise.allSettled([
      api.get("/admin/pending-approvals"),
      api.get("/admin/analytics"),
      api.get("/admin/live-requests"),
      api.get("/admin/live-tracking"),
      api.get("/admin/disputed-consents"),
      api.get("/admin/certificates"),
      api.get("/admin/subscriptions"),
      api.get("/subscriptions/plans"),
      api.get("/admin/csr"),
      api.get("/admin/appointments"),
      api.get("/audit-logs")
    ]);

    if (requests[0].status === "fulfilled") setPending(requests[0].value.data);
    if (requests[1].status === "fulfilled") setAnalytics(requests[1].value.data);
    if (requests[2].status === "fulfilled") setLiveRequests(requests[2].value.data.requests || []);
    if (requests[3].status === "fulfilled") setTracking(requests[3].value.data.sessions || []);
    if (requests[4].status === "fulfilled") setDisputes(requests[4].value.data.consents || []);
    if (requests[5].status === "fulfilled") setCertificates(requests[5].value.data.certificates || []);
    if (requests[6].status === "fulfilled") setSubscriptions(requests[6].value.data.subscriptions || []);
    if (requests[7].status === "fulfilled") setPlans(requests[7].value.data.plans || []);
    if (requests[8].status === "fulfilled") setPartners(requests[8].value.data.partners || []);
    if (requests[9].status === "fulfilled") setAppointments(requests[9].value.data.appointments || []);
    if (requests[10].status === "fulfilled") setAuditLogs(requests[10].value.data.logs || []);
  }

  async function approve(type, id) {
    setMessage("");
    await api.post(`/admin/approve-${type}/${id}`);
    setMessage(`${type} approved. Certificates and audit logs were updated where applicable.`);
    await loadAdmin();
  }

  async function reject(type, id) {
    const reason = window.prompt("Reason for rejection?") || "Rejected by admin.";
    await api.post(`/admin/reject-${type}/${id}`, { reason });
    setMessage(`${type} rejected.`);
    await loadAdmin();
  }

  async function generateCertificate(e) {
    e.preventDefault();
    if (!certificateForm.userId) return setMessage("Enter a user ID before generating a certificate.");
    await api.post("/certificates/generate", certificateForm);
    setCertificateForm({ userId: "", type: "verified_donor" });
    setMessage("Certificate generated.");
    await loadAdmin();
  }

  async function updateCertificate(id, action) {
    const body = action === "revoke"
      ? { reason: window.prompt("Reason for revocation?") || "Revoked by admin." }
      : { note: window.prompt("Dispute note?") || "Marked disputed by admin." };
    await api.post(`/certificates/${id}/${action === "revoke" ? "revoke" : "mark-disputed"}`, body);
    setMessage(`Certificate ${action === "revoke" ? "revoked" : "marked disputed"}.`);
    await loadAdmin();
  }

  async function activateSubscription(e) {
    e.preventDefault();
    if (!subscriptionForm.userId || !subscriptionForm.planId) {
      return setMessage("User ID and plan are required for manual subscription activation.");
    }
    await api.post("/subscriptions/manual-activate", {
      userId: subscriptionForm.userId,
      planId: subscriptionForm.planId,
      amount: Number(subscriptionForm.amount || 0),
      endDate: subscriptionForm.endDate || undefined,
      notes: "Manual Phase 1 billing. Not related to blood donation."
    });
    setSubscriptionForm({ userId: "", planId: "", amount: "", endDate: "" });
    setMessage("Subscription activated manually.");
    await loadAdmin();
  }

  async function createCsrPartner(e) {
    e.preventDefault();
    if (!csrForm.organizationName) return setMessage("CSR organization name is required.");
    await api.post("/csr", {
      ...csrForm,
      amountCommitted: Number(csrForm.amountCommitted || 0),
      status: "active"
    });
    setCsrForm({
      organizationName: "",
      contactPerson: "",
      phone: "",
      email: "",
      sponsorshipType: "awareness_drive",
      campaignTitle: "",
      campaignArea: "",
      amountCommitted: "",
      publicVisibility: false
    });
    setMessage("CSR partner added.");
    await loadAdmin();
  }

  const commandStats = useMemo(() => ({
    certificates: certificates.length,
    appointments: appointments.length,
    subscriptions: subscriptions.filter((item) => item.status === "active").length,
    disputes: disputes.length
  }), [appointments, certificates, disputes, subscriptions]);

  function ApprovalList({ title, type, users }) {
    return (
      <div className="card">
        <h2 className="text-xl font-extrabold text-slate-950">{title}</h2>
        <div className="mt-4 space-y-3">
          {users?.length ? users.map((user) => (
            <div className="rounded-lg border border-slate-200 p-3" key={user._id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-950">{user.name}</p>
                  <p className="text-sm text-slate-600">{user.email} {user.phone ? `- ${user.phone}` : ""}</p>
                  <p className="mt-1 text-xs text-slate-400">User ID: {user._id}</p>
                  {user.bloodGroup && <div className="mt-2"><BloodGroupBadge group={user.bloodGroup} /></div>}
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary" onClick={() => approve(type, user._id)}>Approve</button>
                  <button className="btn-secondary" onClick={() => reject(type, user._id)}>Reject</button>
                </div>
              </div>
            </div>
          )) : <EmptyState title="Nothing pending" text={`No pending ${type} approvals.`} />}
        </div>
      </div>
    );
  }

  return (
    <RoleBasedLayout>
      <div className="space-y-6">
        <div className="card bg-slate-950 text-white">
          <p className="text-sm font-bold text-red-200">B Donor Command Center</p>
          <h1 className="mt-1 text-3xl font-black">Live emergency operations</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Monitor critical requests, consent-based tracking, approvals, certificates, disputes, subscriptions, CSR partners, appointments, analytics, and audit logs.
          </p>
        </div>
        {message && <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">{message}</p>}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total patients" value={analytics?.totalPatients} />
          <StatCard label="Total donors" value={analytics?.totalDonors} />
          <StatCard label="Active requests" value={analytics?.activeRequests} />
          <StatCard label="Critical requests" value={analytics?.criticalRequests} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Certificates" value={commandStats.certificates} icon={BadgeCheck} />
          <StatCard label="Appointments" value={commandStats.appointments} icon={CalendarDays} />
          <StatCard label="Active subscriptions" value={commandStats.subscriptions} icon={WalletCards} />
          <StatCard label="Disputes" value={commandStats.disputes} icon={ShieldAlert} />
        </div>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card">
            <PanelHeader icon={RadioTower} title="Active critical requests" text="Emergency flow remains free and cannot be influenced by sponsorship, subscription, or paid ranking." />
            <div className="space-y-3">
              {liveRequests.length ? liveRequests.slice(0, 6).map((request) => (
                <div className="rounded-lg bg-slate-50 p-3" key={request._id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-950">{request.patientName}</p>
                      <p className="text-sm text-slate-500">{request.hospitalName || request.city || "Location pending"}</p>
                    </div>
                    <BloodGroupBadge group={request.bloodGroupRequired} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-donor-red">{request.urgency}</span>
                    <StatusPill status={request.status} />
                  </div>
                </div>
              )) : <EmptyState title="No live requests" text="Active emergency requests appear here." />}
            </div>
          </div>
          <div className="space-y-4">
            <MiniMap etaMinutes={tracking.length ? 12 : null} distanceKm={tracking.length ? 3.8 : null} />
            <div className="card">
              <h2 className="font-extrabold text-slate-950">Live tracking sessions</h2>
              <p className="mt-2 text-3xl font-black text-donor-red">{tracking.length}</p>
              <p className="text-sm text-slate-500">Visible only after donor consent and request acceptance.</p>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-3">
          <ApprovalList title="Pending donor approvals" type="donor" users={pending.donors} />
          <ApprovalList title="Pending doctor approvals" type="doctor" users={pending.doctors} />
          <ApprovalList title="Pending hospital approvals" type="hospital" users={pending.hospitals} />
        </div>

        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="card">
            <PanelHeader icon={FileCheck2} title="Certificate controls" text="Generate, revoke, or dispute platform certificates. Public QR pages are masked by default." />
            <form className="grid gap-3 sm:grid-cols-[1fr_0.7fr_auto]" onSubmit={generateCertificate}>
              <input className="field" placeholder="User ID" value={certificateForm.userId} onChange={(e) => setCertificateForm({ ...certificateForm, userId: e.target.value })} />
              <select className="field" value={certificateForm.type} onChange={(e) => setCertificateForm({ ...certificateForm, type: e.target.value })}>
                <option value="verified_donor">Verified donor</option>
                <option value="voluntary_donation">Voluntary donation</option>
                <option value="no_money_declaration">No-money declaration</option>
                <option value="doctor_verified">Doctor verified</option>
                <option value="hospital_verified">Hospital verified</option>
                <option value="camp_participation">Camp participation</option>
              </select>
              <button className="btn-primary">Generate</button>
            </form>
            <div className="mt-4 space-y-3">
              {certificates.slice(0, 6).map((certificate) => (
                <div className="rounded-lg bg-slate-50 p-3" key={certificate._id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-950">{certificate.title}</p>
                      <p className="text-sm text-slate-600">{certificate.userId?.name || "User"} - {certificate.certificateId}</p>
                    </div>
                    <StatusPill status={certificate.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="btn-secondary" onClick={() => updateCertificate(certificate._id, "dispute")}>Mark disputed</button>
                    <button className="btn-secondary" onClick={() => updateCertificate(certificate._id, "revoke")}>Revoke</button>
                  </div>
                </div>
              ))}
              {!certificates.length && <EmptyState title="No certificates" text="Generated certificates appear here." />}
            </div>
          </div>

          <div className="card">
            <PanelHeader icon={CalendarDays} title="Appointment requests overview" text="Phase 1 appointment requests have no platform payment and are not guaranteed until accepted." />
            <div className="space-y-3">
              {appointments.slice(0, 8).map((appointment) => (
                <div className="rounded-lg bg-slate-50 p-3" key={appointment._id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-950">{appointment.patientId?.name || "Patient"}</p>
                      <p className="text-sm text-slate-600">
                        {appointment.doctorId?.name ? `Dr. ${appointment.doctorId.name}` : appointment.hospitalId?.hospitalProfile?.hospitalName || appointment.hospitalId?.name || "Provider"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{appointment.preferredTime || "Time pending"} - {appointment.consultationMode}</p>
                    </div>
                    <StatusPill status={appointment.status} />
                  </div>
                </div>
              ))}
              {!appointments.length && <EmptyState title="No appointments" text="Patient appointment interest requests appear here." />}
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <div className="card">
            <PanelHeader icon={WalletCards} title="Manual subscriptions" text="Legal monetization is for software services only. Never charge for donor contact, blood units, or emergency donor matching." />
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={activateSubscription}>
              <input className="field" placeholder="User ID" value={subscriptionForm.userId} onChange={(e) => setSubscriptionForm({ ...subscriptionForm, userId: e.target.value })} />
              <select className="field" value={subscriptionForm.planId} onChange={(e) => setSubscriptionForm({ ...subscriptionForm, planId: e.target.value })}>
                <option value="">Choose plan</option>
                {plans.map((plan) => (
                  <option value={plan._id} key={plan._id}>{plan.name} - Rs {plan.priceMonthly}/mo</option>
                ))}
              </select>
              <input className="field" placeholder="Manual amount" type="number" value={subscriptionForm.amount} onChange={(e) => setSubscriptionForm({ ...subscriptionForm, amount: e.target.value })} />
              <input className="field" type="date" value={subscriptionForm.endDate} onChange={(e) => setSubscriptionForm({ ...subscriptionForm, endDate: e.target.value })} />
              <button className="btn-primary sm:col-span-2">Activate manual subscription</button>
            </form>
            <div className="mt-4 space-y-3">
              {subscriptions.slice(0, 5).map((subscription) => (
                <div className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 p-3" key={subscription._id}>
                  <div>
                    <p className="font-bold text-slate-950">{subscription.userId?.name || "User"}</p>
                    <p className="text-sm text-slate-600">{subscription.planId?.name || "Plan"} - Rs {subscription.amount || 0}</p>
                  </div>
                  <StatusPill status={subscription.status} />
                </div>
              ))}
              {!subscriptions.length && <EmptyState title="No subscriptions" text="Manual SaaS subscriptions appear here." />}
            </div>
          </div>

          <div className="card">
            <PanelHeader icon={BriefcaseBusiness} title="CSR partners" text="Sponsors can support awareness and certificates, but cannot access private data or influence emergency matching." />
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={createCsrPartner}>
              <input className="field" placeholder="Organization name" value={csrForm.organizationName} onChange={(e) => setCsrForm({ ...csrForm, organizationName: e.target.value })} />
              <input className="field" placeholder="Contact person" value={csrForm.contactPerson} onChange={(e) => setCsrForm({ ...csrForm, contactPerson: e.target.value })} />
              <input className="field" placeholder="Phone" value={csrForm.phone} onChange={(e) => setCsrForm({ ...csrForm, phone: e.target.value })} />
              <input className="field" placeholder="Email" value={csrForm.email} onChange={(e) => setCsrForm({ ...csrForm, email: e.target.value })} />
              <select className="field" value={csrForm.sponsorshipType} onChange={(e) => setCsrForm({ ...csrForm, sponsorshipType: e.target.value })}>
                <option value="awareness_drive">Awareness drive</option>
                <option value="certificate_sponsor">Certificate sponsor</option>
                <option value="district_campaign">District campaign</option>
                <option value="blood_camp">Blood camp</option>
                <option value="technology_access">Technology access</option>
              </select>
              <input className="field" placeholder="Amount committed" type="number" value={csrForm.amountCommitted} onChange={(e) => setCsrForm({ ...csrForm, amountCommitted: e.target.value })} />
              <input className="field" placeholder="Campaign title" value={csrForm.campaignTitle} onChange={(e) => setCsrForm({ ...csrForm, campaignTitle: e.target.value })} />
              <input className="field" placeholder="Campaign area" value={csrForm.campaignArea} onChange={(e) => setCsrForm({ ...csrForm, campaignArea: e.target.value })} />
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={csrForm.publicVisibility} onChange={(e) => setCsrForm({ ...csrForm, publicVisibility: e.target.checked })} />
                Public visibility
              </label>
              <button className="btn-primary sm:col-span-2">Add CSR partner</button>
            </form>
            <div className="mt-4 space-y-3">
              {partners.slice(0, 5).map((partner) => (
                <div className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 p-3" key={partner._id}>
                  <div>
                    <p className="font-bold text-slate-950">{partner.organizationName}</p>
                    <p className="text-sm text-slate-600">{partner.campaignTitle || partner.sponsorshipType}</p>
                  </div>
                  <StatusPill status={partner.status} />
                </div>
              ))}
              {!partners.length && <EmptyState title="No CSR partners" text="Awareness and certificate sponsorship partners appear here." />}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="card">
            <h2 className="font-bold text-slate-950">Donors by blood group</h2>
            <div className="mt-3 space-y-2">
              {analytics?.donorsByBloodGroup?.map((item) => (
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2" key={item._id || "unknown"}>
                  <span>{item._id || "Unknown"}</span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h2 className="font-bold text-slate-950">Alert acceptance rate</h2>
            <p className="mt-4 text-4xl font-black text-donor-red">{analytics?.alertAcceptanceRate || 0}%</p>
            <p className="mt-1 text-sm text-slate-600">Disputed consent forms: {disputes.length}</p>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="card">
            <PanelHeader icon={ShieldAlert} title="Disputed consent forms" text="Disputes block rewards and certificates until admin investigation." />
            <div className="space-y-3">
              {disputes.slice(0, 6).map((consent) => (
                <div className="rounded-lg bg-slate-50 p-3" key={consent._id}>
                  <p className="font-bold text-slate-950">{consent.bloodRequestId?.patientName || "Blood request"}</p>
                  <p className="text-sm text-slate-600">Donor: {consent.donorId?.name || "Unknown"} - Patient: {consent.patientId?.name || "Unknown"}</p>
                  <StatusPill status={consent.finalStatus} />
                </div>
              ))}
              {!disputes.length && <EmptyState title="No disputes" text="Disputed no-money declarations appear here." />}
            </div>
          </div>

          <div className="card">
            <PanelHeader icon={ListChecks} title="Audit log" text="Approvals, tracking, consent, certificate, subscription, and appointment actions are logged." />
            <div className="space-y-3">
              {auditLogs.slice(0, 8).map((log) => (
                <div className="rounded-lg bg-slate-50 p-3" key={log._id}>
                  <p className="font-bold text-slate-950">{log.action}</p>
                  <p className="text-sm text-slate-600">{log.actorId?.name || "System"} - {log.targetType || "Record"}</p>
                  <p className="mt-1 text-xs text-slate-500">{log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}</p>
                </div>
              ))}
              {!auditLogs.length && <EmptyState title="No audit logs" text="Admin and safety events appear here." />}
            </div>
          </div>
        </section>
      </div>
    </RoleBasedLayout>
  );
}
