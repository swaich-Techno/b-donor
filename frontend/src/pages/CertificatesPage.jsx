import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Award, BadgeCheck, ExternalLink, QrCode, ShieldAlert } from "lucide-react";
import {
  EmptyState,
  RoleBasedLayout,
  SafetyDisclaimer
} from "../components/PortalComponents";
import api from "../api/client";

const TYPE_LABELS = {
  verified_donor: "Verified Donor Certificate",
  voluntary_donation: "Voluntary Donation Certificate",
  no_money_declaration: "No-Money Declaration Certificate",
  recovery_completed: "Recovery Completed Badge",
  emergency_responder: "Emergency Responder Badge",
  doctor_verified: "Doctor Verified Badge",
  hospital_verified: "Hospital Verified Partner Badge",
  camp_participation: "Blood Camp Participation Certificate"
};

function CertificateCard({ certificate }) {
  const verifyPath = `/verify/certificate/${certificate.certificateId}`;
  const statusTone = certificate.status === "valid"
    ? "bg-emerald-100 text-emerald-700"
    : certificate.status === "disputed"
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";

  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-red-50 text-donor-red">
            <Award size={22} />
          </span>
          <div>
            <p className="font-extrabold text-slate-950">{certificate.title || TYPE_LABELS[certificate.type]}</p>
            <p className="text-sm text-slate-600">{TYPE_LABELS[certificate.type] || certificate.type}</p>
            <p className="mt-1 text-xs text-slate-500">ID: {certificate.certificateId}</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusTone}`}>
          {certificate.status}
        </span>
      </div>

      <div className="grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-3">
        <span className="rounded-lg bg-slate-50 px-2.5 py-2">{certificate.bloodGroup || "Blood group hidden"}</span>
        <span className="rounded-lg bg-slate-50 px-2.5 py-2">{certificate.city || certificate.district || "Location masked"}</span>
        <span className="rounded-lg bg-slate-50 px-2.5 py-2">
          {certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString() : "Date pending"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link className="btn-primary" to={verifyPath}>
          <QrCode size={16} />
          Verify QR record
        </Link>
        {certificate.pdfUrl && (
          <a className="btn-secondary" href={certificate.pdfUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={16} />
            Open PDF
          </a>
        )}
      </div>
    </div>
  );
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/certificates/mine")
      .then((res) => setCertificates(res.data.certificates || []))
      .catch((error) => setMessage(error.response?.data?.message || "Could not load certificates."));
  }, []);

  const counts = useMemo(() => ({
    valid: certificates.filter((item) => item.status === "valid").length,
    disputed: certificates.filter((item) => item.status === "disputed").length,
    revoked: certificates.filter((item) => item.status === "revoked").length
  }), [certificates]);

  return (
    <RoleBasedLayout>
      <div className="space-y-5">
        <div className="card bg-slate-950 text-white">
          <p className="text-sm font-bold text-red-200">Verified records</p>
          <h1 className="mt-1 text-3xl font-black">Certificates and QR verification</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Certificates verify B Donor platform records only. They do not replace hospital, blood bank, or medical professional documentation.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="card">
            <p className="text-sm font-semibold text-slate-500">Valid</p>
            <p className="mt-1 text-3xl font-black text-emerald-600">{counts.valid}</p>
          </div>
          <div className="card">
            <p className="text-sm font-semibold text-slate-500">Disputed</p>
            <p className="mt-1 text-3xl font-black text-amber-600">{counts.disputed}</p>
          </div>
          <div className="card">
            <p className="text-sm font-semibold text-slate-500">Revoked</p>
            <p className="mt-1 text-3xl font-black text-red-600">{counts.revoked}</p>
          </div>
        </div>

        <SafetyDisclaimer />

        {message && (
          <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">{message}</div>
        )}

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <BadgeCheck className="text-donor-red" size={20} />
            <h2 className="text-xl font-extrabold text-slate-950">My certificates</h2>
          </div>
          {certificates.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {certificates.map((certificate) => (
                <CertificateCard certificate={certificate} key={certificate._id} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ShieldAlert}
              title="No certificates yet"
              text="Verified donor, voluntary donation, and no-money declaration certificates appear here after approval or completion."
            />
          )}
        </section>
      </div>
    </RoleBasedLayout>
  );
}
