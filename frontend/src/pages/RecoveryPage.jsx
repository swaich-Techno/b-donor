import { AlertTriangle, Apple, Droplets, Dumbbell, HeartPulse } from "lucide-react";
import {
  RecoveryCard,
  RoleBasedLayout,
  SafetyDisclaimer
} from "../components/PortalComponents";
import { useAuth } from "../context/AuthContext";

export default function RecoveryPage() {
  const { user } = useAuth();
  const tips = [
    { icon: Droplets, title: "Hydrate", text: "Drink enough water after donation and continue fluids through the day." },
    { icon: Apple, title: "Iron-rich food", text: "Eat iron-rich foods such as leafy greens, beans, lentils, dates, eggs, or doctor-advised options." },
    { icon: HeartPulse, title: "Rest", text: "Rest after donation and avoid rushing back into stressful activity." },
    { icon: Dumbbell, title: "Avoid heavy exercise", text: "Avoid heavy exercise for at least 24 hours after donation." }
  ];

  return (
    <RoleBasedLayout>
      <div className="space-y-5">
        <RecoveryCard donorProfile={user?.donorProfile} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tips.map(({ icon: Icon, title, text }) => (
            <div className="card" key={title}>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-donor-red"><Icon size={22} /></span>
              <h2 className="mt-4 font-extrabold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <AlertTriangle className="mr-2 inline" size={17} />
          Contact a doctor urgently for severe weakness, dizziness, chest pain, fainting, fever, breathing trouble, or unusual symptoms. This is general guidance, not medical advice.
        </div>
        <SafetyDisclaimer />
      </div>
    </RoleBasedLayout>
  );
}
