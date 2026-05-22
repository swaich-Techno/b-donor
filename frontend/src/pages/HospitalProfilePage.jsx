import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BadgeCheck, Building2, CalendarDays, Phone } from "lucide-react";
import {
  EmptyState,
  RoleBasedLayout,
  SafetyDisclaimer
} from "../components/PortalComponents";
import api from "../api/client";

export default function HospitalProfilePage() {
  const { id } = useParams();
  const [hospital, setHospital] = useState(null);
  const [message, setMessage] = useState("Loading hospital profile...");

  useEffect(() => {
    api.get(`/hospitals/${id}`)
      .then((res) => {
        setHospital(res.data.hospital);
        setMessage("");
      })
      .catch((error) => {
        setHospital(null);
        setMessage(error.response?.data?.message || "Could not load hospital profile.");
      });
  }, [id]);

  if (!hospital) {
    return (
      <RoleBasedLayout>
        <EmptyState title="Hospital profile" text={message} />
      </RoleBasedLayout>
    );
  }

  const profile = hospital.hospitalProfile || {};
  const hospitalName = profile.hospitalName || hospital.name;
  const directPhone = profile.emergencyPhone || hospital.phone;

  return (
    <RoleBasedLayout>
      <div className="space-y-5">
        <div className="card bg-slate-950 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-red-200">Verified hospital profile</p>
              <h1 className="mt-1 text-3xl font-black">{hospitalName}</h1>
              <p className="mt-2 text-sm text-slate-300">{profile.hospitalType || "Hospital"} - {hospital.location?.city || "Location pending"}</p>
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
                <Building2 size={24} />
              </span>
              <div>
                <p className="font-extrabold text-slate-950">{hospitalName}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {hospital.location?.address || [hospital.location?.city, hospital.location?.district, hospital.location?.state].filter(Boolean).join(", ") || "Address not listed"}
                </p>
              </div>
              {profile.about && <p className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">{profile.about}</p>}
              <div className="flex flex-wrap gap-2">
                {profile.appointmentEnabled && (
                  <Link className="btn-primary" to={`/appointments/request/hospital/${hospital._id}`}>
                    <CalendarDays size={16} />
                    Request appointment
                  </Link>
                )}
                {(profile.directCallEnabled || !profile.appointmentEnabled) && directPhone && (
                  <a className="btn-secondary" href={`tel:${directPhone}`}>
                    <Phone size={16} />
                    Call hospital
                  </a>
                )}
              </div>
            </div>

            <div className="card border-red-100 bg-red-50">
              <p className="font-bold text-donor-red">Blood safety boundary</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                B Donor can list whether a hospital reports licensed blood bank availability, but all collection, testing, storage, and transfusion must be handled by licensed professionals.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Hospital type" value={profile.hospitalType} />
            <Info label="Registration number" value={profile.registrationNumber} />
            <Info label="Contact person" value={profile.contactPerson} />
            <Info label="Emergency phone" value={profile.emergencyPhone} />
            <Info label="Departments" value={profile.departments?.join(", ") || "Not listed"} />
            <Info label="Timings" value={profile.timings || "Not listed"} />
            <Info label="Blood bank available" value={profile.bloodBankAvailable ? "Yes, if licensed and verified" : "Not listed"} />
            <Info label="Appointment status" value={profile.appointmentEnabled ? "Requests enabled" : "Call/contact only"} />
          </div>
        </section>
      </div>
    </RoleBasedLayout>
  );
}

function Info({ label, value }) {
  return (
    <div className="card">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-950">{value || "Not listed"}</p>
    </div>
  );
}
