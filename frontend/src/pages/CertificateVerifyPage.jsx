import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BadgeCheck, QrCode, ShieldAlert } from "lucide-react";
import { LogoMark } from "../components/PortalComponents";
import api from "../api/client";

export default function CertificateVerifyPage() {
  const { certificateId } = useParams();
  const [record, setRecord] = useState(null);
  const [message, setMessage] = useState("Verifying certificate...");

  useEffect(() => {
    api.get(`/certificates/verify/${certificateId}`)
      .then((res) => {
        setRecord(res.data);
        setMessage("");
      })
      .catch((error) => {
        setRecord(null);
        setMessage(error.response?.data?.message || "Certificate could not be verified.");
      });
  }, [certificateId]);

  const statusTone = record?.status === "valid"
    ? "bg-emerald-100 text-emerald-700"
    : record?.status === "disputed"
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";

  return (
    <main className="app-shell min-h-screen px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <LogoMark />
          <Link className="btn-secondary" to="/">Home</Link>
        </div>

        <div className="card bg-slate-950 text-white">
          <div className="mb-5 grid h-14 w-14 place-items-center rounded-xl bg-white/10 text-red-100">
            <QrCode size={28} />
          </div>
          <p className="text-sm font-bold text-red-200">Public QR verification</p>
          <h1 className="mt-1 text-3xl font-black">B Donor certificate record</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            This page confirms the status stored in B Donor records. It does not verify medical eligibility on the donation date.
          </p>
        </div>

        {message && (
          <div className="card flex items-start gap-3">
            <ShieldAlert className="text-donor-red" size={22} />
            <p className="text-sm font-semibold text-slate-700">{message}</p>
          </div>
        )}

        {record && (
          <div className="card space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">Certificate status</p>
                <h2 className="mt-1 flex items-center gap-2 text-2xl font-black text-slate-950">
                  <BadgeCheck className="text-donor-red" />
                  {record.title}
                </h2>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusTone}`}>
                {record.status}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Certificate type" value={record.certificateType} />
              <Info label="Verified name" value={record.recipientName || "Masked"} />
              <Info label="City / district" value={[record.city, record.district].filter(Boolean).join(", ") || "Masked"} />
              <Info label="Issue date" value={record.issueDate ? new Date(record.issueDate).toLocaleDateString() : "Not listed"} />
              <Info label="Issuing authority" value={record.issuingAuthority} />
              <Info label="Verified at" value={record.verificationTimestamp ? new Date(record.verificationTimestamp).toLocaleString() : "Now"} />
            </div>

            <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm leading-6 text-slate-700">
              <strong className="text-donor-red">Disclaimer:</strong> {record.disclaimer}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-950">{value || "Not listed"}</p>
    </div>
  );
}
