import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, LocateFixed, Phone, ShieldCheck } from "lucide-react";
import {
  LiveStatusCard,
  MiniMap,
  RequestTimeline,
  RoleBasedLayout,
  SafetyDisclaimer
} from "../components/PortalComponents";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function TrackingPage() {
  const { bloodRequestId } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(bloodRequestId !== "demo");

  const isDemo = bloodRequestId === "demo";
  const request = data?.request || {
    _id: "demo",
    patientName: "Emergency request preview",
    bloodGroupRequired: "A+",
    urgency: "critical",
    hospitalName: "City Care Hospital",
    status: "tracking",
    acceptedDonor: { name: "Approved donor", phone: "Visible after accept", bloodGroup: "A+" }
  };

  useEffect(() => {
    if (isDemo) {
      setData({ request, session: { status: "active" }, etaMinutes: 14, distanceKm: 4.2 });
      setLoading(false);
      return;
    }

    loadTracking();
    const timer = window.setInterval(loadTracking, 8000);
    return () => window.clearInterval(timer);
  }, [bloodRequestId]);

  async function loadTracking() {
    try {
      const res = await api.get(`/tracking/${bloodRequestId}/live`);
      setData(res.data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Tracking is not available yet.");
    } finally {
      setLoading(false);
    }
  }

  function getGps() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("GPS is not available on this device."));
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
    });
  }

  async function startTracking() {
    setMessage("Getting your location...");
    try {
      const position = await getGps();
      await api.post(`/tracking/${bloodRequestId}/start`, {
        donorConsentGiven: true,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed,
        heading: position.coords.heading
      });
      setMessage("Live tracking started for this request only.");
      await loadTracking();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Could not start tracking.");
    }
  }

  async function updateLocation() {
    setMessage("Updating donor location...");
    try {
      const position = await getGps();
      await api.post(`/tracking/${bloodRequestId}/location`, {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed,
        heading: position.coords.heading
      });
      setMessage("Location updated.");
      await loadTracking();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Could not update location.");
    }
  }

  async function stopTracking() {
    await api.post(`/tracking/${bloodRequestId}/stop`);
    setMessage("Live tracking stopped.");
    await loadTracking();
  }

  async function markDonated() {
    await api.post(`/blood-requests/${bloodRequestId}/mark-donated`);
    setMessage("Donation marked. Complete the no-money consent flow.");
    await loadTracking();
  }

  async function donorConfirm() {
    await api.post(`/donation-consents/${bloodRequestId}/donor-confirm`, { otpVerified: false });
    setMessage("Your no-money donor declaration is saved.");
    await loadTracking();
  }

  async function patientConfirm(disputed = false) {
    await api.post(`/donation-consents/${bloodRequestId}/patient-confirm`, { disputed, otpVerified: false });
    setMessage(disputed ? "Dispute opened for admin review." : "Patient confirmation saved.");
    await loadTracking();
  }

  if (loading) {
    return <RoleBasedLayout><div className="card">Loading live tracking...</div></RoleBasedLayout>;
  }

  const acceptedDonorId = request.acceptedDonor?._id || request.acceptedDonor;
  const isAcceptedDonor = String(acceptedDonorId) === String(user?._id);

  return (
    <RoleBasedLayout>
      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            <LiveStatusCard title="Live donor tracking" status={data?.session?.status || request.status}>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-red-50 px-3 py-1 font-bold text-donor-red">{request.bloodGroupRequired}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-bold capitalize text-slate-700">{request.urgency}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-bold capitalize text-slate-700">{request.status}</span>
              </div>
            </LiveStatusCard>
            <MiniMap
              donorLocation={data?.session?.lastLocation}
              requestLocation={request.location}
              etaMinutes={data?.etaMinutes}
              distanceKm={data?.distanceKm}
            />
          </div>
          <div className="space-y-4">
            <RequestTimeline status={request.status} />
            <SafetyDisclaimer />
          </div>
        </div>

        {message && <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">{message}</p>}

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="card">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-950"><ShieldCheck className="text-donor-red" /> Privacy lock</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Live location starts only after donor accepts and taps Share Live Location. It expires after completion, cancellation, or stop.</p>
          </div>
          <div className="card">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-950"><Phone className="text-donor-red" /> Emergency contact</h2>
            <p className="mt-2 text-sm text-slate-600">{request.hospitalName || "Hospital not listed"}</p>
            <a className="btn-secondary mt-4 w-full" href={`tel:${request.attendantPhone || ""}`}>Call attendant</a>
          </div>
          <div className="card">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-950"><AlertTriangle className="text-donor-red" /> Consent flow</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">After donation, donor and patient confirm that no money, gift, or cash-like benefit was requested.</p>
          </div>
        </section>

        {!isDemo && (
          <section className="card space-y-3">
            <h2 className="text-xl font-extrabold text-slate-950">Actions</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {isAcceptedDonor && <button className="btn-primary" onClick={startTracking}><LocateFixed size={16} /> Share Live Location</button>}
              {isAcceptedDonor && <button className="btn-secondary" onClick={updateLocation}>Update location</button>}
              {isAcceptedDonor && <button className="btn-secondary" onClick={stopTracking}>Stop tracking</button>}
              <button className="btn-secondary" onClick={markDonated}>Donation Given</button>
              {isAcceptedDonor && <button className="btn-secondary" onClick={donorConfirm}><CheckCircle2 size={16} /> Donor declaration</button>}
              <button className="btn-secondary" onClick={() => patientConfirm(false)}>Blood Received</button>
              <button className="btn-secondary" onClick={() => patientConfirm(true)}>Report money demand</button>
            </div>
          </section>
        )}

        {isDemo && (
          <div className="card">
            <p className="font-bold text-slate-950">Demo tracking preview</p>
            <p className="mt-1 text-sm text-slate-600">Create a real blood request and accept as a donor to use live GPS tracking.</p>
            <Link className="btn-primary mt-4" to="/need-blood">Create request</Link>
          </div>
        )}
      </div>
    </RoleBasedLayout>
  );
}
