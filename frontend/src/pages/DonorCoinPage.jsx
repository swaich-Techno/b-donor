import { useEffect, useState } from "react";
import { Award, BadgeCheck, Coins, FileBadge, HeartHandshake } from "lucide-react";
import {
  DonorCoinCard,
  EmptyState,
  RoleBasedLayout,
  StatCard
} from "../components/PortalComponents";
import api from "../api/client";

export default function DonorCoinPage() {
  const [wallet, setWallet] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [meta, setMeta] = useState({});

  useEffect(() => {
    Promise.all([
      api.get("/donor-coin/wallet"),
      api.get("/donor-coin/ledger")
    ]).then(([walletRes, ledgerRes]) => {
      setWallet(walletRes.data.wallet);
      setLedger(ledgerRes.data.ledger || []);
      setMeta(walletRes.data);
    }).catch(() => {});
  }, []);

  return (
    <RoleBasedLayout>
      <div className="space-y-5">
        <DonorCoinCard wallet={wallet} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Impact points" value={wallet?.impactPoints || 0} icon={Coins} />
          <StatCard label="Completed donations" value={meta.completedDonations || 0} icon={HeartHandshake} />
          <StatCard label="Lives supported estimate" value={meta.livesSupportedEstimate || 0} icon={BadgeCheck} />
          <StatCard label="Certificates" value={wallet?.badges?.length || 0} icon={FileBadge} />
        </div>
        <div className="card">
          <h2 className="text-xl font-extrabold text-slate-950">Badges</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {wallet?.badges?.length ? wallet.badges.map((badge) => (
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-800" key={badge}>
                <Award size={16} />
                {badge}
              </span>
            )) : <span className="text-sm text-slate-500">Complete a verified voluntary donation to unlock badges.</span>}
          </div>
        </div>
        <div className="card">
          <h2 className="text-xl font-extrabold text-slate-950">Ledger</h2>
          <div className="mt-4 space-y-3">
            {ledger.length ? ledger.map((entry) => (
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3" key={entry._id}>
                <div>
                  <p className="font-bold text-slate-950">{entry.description || entry.type}</p>
                  <p className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</p>
                </div>
                <span className="font-black text-donor-red">{entry.points > 0 ? "+" : ""}{entry.points}</span>
              </div>
            )) : <EmptyState title="No ledger yet" text="Verified donations and admin recognition appear here." />}
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Donor Coin Impact Points are non-cash recognition points. They are not payment for blood donation, not cryptocurrency in Phase 1, not transferable, and have no monetary value.
        </div>
      </div>
    </RoleBasedLayout>
  );
}
