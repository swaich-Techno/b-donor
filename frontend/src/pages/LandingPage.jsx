import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Bot,
  Building2,
  Clock,
  Droplets,
  HeartHandshake,
  LocateFixed,
  Lock,
  MapPin,
  Navigation,
  ShieldCheck,
  Siren,
  Stethoscope
} from "lucide-react";
import {
  BloodGroupBadge,
  LogoMark,
  RadiusSelector,
  SafetyDisclaimer
} from "../components/PortalComponents";

export default function LandingPage() {
  const trust = [
    ["Admin-approved donors", ShieldCheck],
    ["Consent-based live tracking", Navigation],
    ["No blood selling", Lock],
    ["Hospital safety", Building2],
    ["Private medical records", Stethoscope],
    ["Verified certificates", BadgeCheck],
    ["Nearby verified care", MapPin]
  ];

  return (
    <div className="app-shell min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <LogoMark />
          <div className="flex gap-2">
            <Link className="btn-secondary hidden sm:inline-flex" to="/register">Register</Link>
            <Link className="btn-primary" to="/login">Login</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-14">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-100 bg-white/80 px-3 py-1.5 text-sm font-bold text-donor-red shadow-sm">
              <Siren size={16} />
              Emergency donor connection platform
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
              Find voluntary blood donors near you in emergencies.
            </h1>
            <p className="mt-3 text-xl font-extrabold text-donor-red">B Donor - Every Life Matters</p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              B Donor connects patients and hospitals with approved voluntary donors nearby. It is not a blood bank, and every donation must happen through licensed medical professionals.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link className="btn-primary min-h-14" to="/need-blood"><Droplets size={20} /> Need Blood Now</Link>
              <Link className="btn-secondary min-h-14" to="/register"><HeartHandshake size={20} /> Become a Donor</Link>
              <Link className="btn-secondary min-h-14" to="/ai-health-assistant"><Bot size={20} /> Ask AI</Link>
              <Link className="btn-secondary min-h-14" to="/find-care"><Stethoscope size={20} /> Find Care</Link>
            </div>
          </motion.div>

          <motion.div className="card space-y-4 p-5" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.08 }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">Live donor search</p>
                <h2 className="text-2xl font-black text-slate-950">Critical request</h2>
              </div>
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-donor-red">LIVE</span>
            </div>
            <div className="map-grid relative min-h-64 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              <div className="absolute left-5 top-5 rounded-2xl bg-white/90 p-3 shadow-soft">
                <BloodGroupBadge group="A+" />
                <p className="mt-2 text-xs font-semibold text-slate-500">Exact match first</p>
              </div>
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white bg-white/90 p-4 shadow-soft">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-700"><LocateFixed size={16} /> Radius</span>
                  <span className="text-sm font-black text-donor-red">5 km</span>
                </div>
                <RadiusSelector value={5} onChange={() => {}} />
              </div>
              <div className="absolute right-[20%] top-[30%] grid h-12 w-12 place-items-center rounded-full bg-donor-red text-white shadow-soft">
                <Navigation size={22} />
              </div>
              <div className="absolute left-[24%] top-[54%] grid h-10 w-10 place-items-center rounded-full bg-white text-donor-red shadow-soft">
                <MapPin size={20} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Request blood", Droplets],
                ["Donors get alert", Clock],
                ["Track safely", Navigation]
              ].map(([label, Icon]) => (
                <div className="rounded-2xl bg-slate-50 p-3 text-center" key={label}>
                  <Icon className="mx-auto text-donor-red" size={20} />
                  <p className="mt-2 text-xs font-black text-slate-700">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {trust.map(([label, Icon]) => (
              <div className="card flex items-center gap-3" key={label}>
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-red-50 text-donor-red"><Icon size={20} /></span>
                <p className="font-bold text-slate-950">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-3">
          {[
            ["Need Blood", "Enter blood group, urgency, hospital, location, and radius. B Donor searches approved nearby donors."],
            ["Donate Blood", "Submit donor profile, wait for admin approval, turn availability on, and accept only if healthy."],
            ["Ask AI Health Assistant", "Discuss symptoms and reports for a doctor-ready summary. AI never gives final diagnosis or prescription."]
          ].map(([title, text]) => (
            <div className="card" key={title}>
              <h2 className="text-xl font-extrabold text-slate-950">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8">
          <SafetyDisclaimer />
        </section>
      </main>
    </div>
  );
}
