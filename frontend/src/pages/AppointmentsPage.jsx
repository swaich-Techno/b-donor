import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, CheckCircle2, Clock, Stethoscope, XCircle } from "lucide-react";
import {
  EmptyState,
  RoleBasedLayout,
  SafetyDisclaimer
} from "../components/PortalComponents";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

function StatusPill({ status }) {
  const tone = {
    pending: "bg-amber-100 text-amber-700",
    accepted: "bg-emerald-100 text-emerald-700",
    completed: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    cancelled: "bg-slate-100 text-slate-600",
    no_show: "bg-slate-100 text-slate-600"
  }[status] || "bg-slate-100 text-slate-600";

  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${tone}`}>{status}</span>;
}

function AppointmentCard({ appointment, mode, onStatus }) {
  const doctor = appointment.doctorId;
  const hospital = appointment.hospitalId;
  const patient = appointment.patientId;
  const providerName = doctor
    ? `Dr. ${doctor.name}`
    : hospital?.hospitalProfile?.hospitalName || hospital?.name || "Provider";

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-extrabold text-slate-950">{mode === "provider" ? patient?.name || "Patient" : providerName}</p>
          <p className="text-sm text-slate-600">{appointment.specialization || appointment.consultationMode || "Care request"}</p>
          <p className="mt-1 text-xs text-slate-500">
            {appointment.preferredDate ? new Date(appointment.preferredDate).toLocaleDateString() : "Date pending"} at {appointment.preferredTime || "time pending"}
          </p>
        </div>
        <StatusPill status={appointment.status} />
      </div>

      <p className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">
        {appointment.symptomsSummary || "No symptom summary shared."}
      </p>

      <div className="grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-3">
        <span className="rounded-lg bg-slate-50 px-2.5 py-2 capitalize">{appointment.consultationMode || "clinic"}</span>
        <span className="rounded-lg bg-slate-50 px-2.5 py-2">Fee shown: Rs {appointment.consultationFeeShown || 0}</span>
        <span className="rounded-lg bg-slate-50 px-2.5 py-2">Payment: {appointment.paymentStatus || "not_required"}</span>
      </div>

      {mode === "provider" && appointment.status === "pending" && (
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => onStatus(appointment._id, "accept")}>
            <CheckCircle2 size={16} />
            Accept
          </button>
          <button className="btn-secondary" onClick={() => onStatus(appointment._id, "reject")}>
            <XCircle size={16} />
            Reject
          </button>
        </div>
      )}

      {mode === "provider" && appointment.status === "accepted" && (
        <button className="btn-secondary w-full" onClick={() => onStatus(appointment._id, "complete")}>
          Mark completed
        </button>
      )}
    </div>
  );
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [mine, setMine] = useState([]);
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  const [hospitalAppointments, setHospitalAppointments] = useState([]);
  const [message, setMessage] = useState("");

  const canManageDoctor = user?.doctorProfile?.enabled;
  const canManageHospital = user?.hospitalProfile?.enabled;

  useEffect(() => {
    loadAppointments();
  }, []);

  async function loadAppointments() {
    setMessage("");
    const calls = [api.get("/appointments/mine")];
    if (canManageDoctor) calls.push(api.get("/appointments/doctor"));
    if (canManageHospital) calls.push(api.get("/appointments/hospital"));

    const results = await Promise.allSettled(calls);
    if (results[0]?.status === "fulfilled") setMine(results[0].value.data.appointments || []);
    let index = 1;
    if (canManageDoctor) {
      if (results[index]?.status === "fulfilled") setDoctorAppointments(results[index].value.data.appointments || []);
      index += 1;
    }
    if (canManageHospital && results[index]?.status === "fulfilled") {
      setHospitalAppointments(results[index].value.data.appointments || []);
    }
  }

  async function updateStatus(id, action) {
    const body = {};
    if (action === "reject") body.reason = window.prompt("Reason for rejection?") || "Provider unavailable.";
    await api.post(`/appointments/${id}/${action}`, body);
    const label = action === "accept" ? "accepted" : action === "reject" ? "rejected" : "completed";
    setMessage(`Appointment ${label}.`);
    await loadAppointments();
  }

  const providerAppointments = useMemo(() => (
    [...doctorAppointments, ...hospitalAppointments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  ), [doctorAppointments, hospitalAppointments]);

  return (
    <RoleBasedLayout>
      <div className="space-y-5">
        <div className="card bg-slate-950 text-white">
          <p className="text-sm font-bold text-red-200">Appointment readiness</p>
          <h1 className="mt-1 text-3xl font-black">Requests without Phase 1 payment</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Patients can request preferred time slots and share summaries by consent. A request is confirmed only after the doctor or hospital accepts it.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="card">
            <Clock className="mb-2 text-donor-red" size={20} />
            <p className="text-sm font-semibold text-slate-500">My requests</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{mine.length}</p>
          </div>
          <div className="card">
            <Stethoscope className="mb-2 text-donor-red" size={20} />
            <p className="text-sm font-semibold text-slate-500">Provider inbox</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{providerAppointments.length}</p>
          </div>
          <div className="card">
            <CalendarDays className="mb-2 text-donor-red" size={20} />
            <p className="text-sm font-semibold text-slate-500">Platform fee</p>
            <p className="mt-1 text-3xl font-black text-slate-950">Off</p>
          </div>
        </div>

        <SafetyDisclaimer />

        {message && <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">{message}</div>}

        <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold text-slate-950">My appointment requests</h2>
              <Link className="btn-secondary" to="/find-care">Find care</Link>
            </div>
            {mine.length ? mine.map((appointment) => (
              <AppointmentCard appointment={appointment} key={appointment._id} mode="patient" />
            )) : (
              <EmptyState title="No requests yet" text="Search doctors or hospitals, then send appointment interest with consent." />
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-extrabold text-slate-950">Doctor / hospital inbox</h2>
            {providerAppointments.length ? providerAppointments.map((appointment) => (
              <AppointmentCard
                appointment={appointment}
                key={appointment._id}
                mode="provider"
                onStatus={updateStatus}
              />
            )) : (
              <EmptyState title="No provider requests" text="Approved active doctor or hospital profiles receive patient requests here." />
            )}
          </div>
        </section>
      </div>
    </RoleBasedLayout>
  );
}
