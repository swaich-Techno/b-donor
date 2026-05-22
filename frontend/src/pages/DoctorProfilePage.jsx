import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BadgeCheck, CalendarDays, Languages, Phone, Stethoscope } from "lucide-react";
import {
  EmptyState,
  RoleBasedLayout,
  SafetyDisclaimer
} from "../components/PortalComponents";
import api from "../api/client";

export default function DoctorProfilePage() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [message, setMessage] = useState("Loading doctor profile...");

  useEffect(() => {
    api.get(`/doctors/${id}`)
      .then((res) => {
        setDoctor(res.data.doctor);
        setMessage("");
      })
      .catch((error) => {
        setDoctor(null);
        setMessage(error.response?.data?.message || "Could not load doctor profile.");
      });
  }, [id]);

  if (!doctor) {
    return (
      <RoleBasedLayout>
        <EmptyState title="Doctor profile" text={message} />
      </RoleBasedLayout>
    );
  }

  const profile = doctor.doctorProfile || {};

  return (
    <RoleBasedLayout>
      <div className="space-y-5">
        <div className="card bg-slate-950 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-red-200">Verified care profile</p>
              <h1 className="mt-1 text-3xl font-black">Dr. {doctor.name}</h1>
              <p className="mt-2 text-sm text-slate-300">{profile.specialization || "General medicine"} - {profile.qualification || "Qualification pending"}</p>
            </div>
            {profile.verifiedBadge && (
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
                <BadgeCheck size={16} />
                Verified
              </span>
            )}
          </div>
        </div>

        <SafetyDisclaimer />

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            <div className="card space-y-4">
              <span className="grid h-12 w-12 place-items-center rounded-lg bg-red-50 text-donor-red">
                <Stethoscope size={24} />
              </span>
              <div>
                <p className="font-extrabold text-slate-950">{profile.currentHospitalClinic || "Clinic not listed"}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {doctor.location?.address || doctor.location?.city || profile.currentWorkingCity || "Address not listed"}
                </p>
              </div>
              {profile.about && <p className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">{profile.about}</p>}
              <div className="flex flex-wrap gap-2">
                {profile.appointmentEnabled && (
                  <Link className="btn-primary" to={`/appointments/request/doctor/${doctor._id}`}>
                    <CalendarDays size={16} />
                    Request appointment
                  </Link>
                )}
                {(profile.directCallEnabled || !profile.appointmentEnabled) && doctor.phone && (
                  <a className="btn-secondary" href={`tel:${doctor.phone}`}>
                    <Phone size={16} />
                    Call clinic
                  </a>
                )}
              </div>
            </div>

            <div className="card">
              <h2 className="font-extrabold text-slate-950">Appointment readiness</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Appointment requests are interest requests in Phase 1. Confirmed appointment status appears only after the doctor accepts.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Specialization" value={profile.specialization} />
            <Info label="Experience" value={profile.experience ? `${profile.experience} years` : ""} />
            <Info label="Registration number" value={profile.medicalRegistrationNumber} />
            <Info label="Medical council" value={profile.issuingMedicalCouncil} />
            <Info label="Fee shown" value={`Rs ${profile.consultationFee || 0}`} />
            <Info label="Consultation modes" value={profile.consultationModes?.join(", ") || "Clinic"} />
            <Info label="Available days" value={profile.availableDays?.join(", ") || "Not listed"} />
            <Info label="Timings" value={profile.availableTimings || "Not listed"} />
            <Info icon={Languages} label="Languages" value={profile.languagesSpoken?.join(", ") || "Not listed"} />
          </div>
        </section>
      </div>
    </RoleBasedLayout>
  );
}

function Info({ label, value, icon: Icon }) {
  return (
    <div className="card">
      {Icon && <Icon className="mb-2 text-donor-red" size={18} />}
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-950">{value || "Not listed"}</p>
    </div>
  );
}
