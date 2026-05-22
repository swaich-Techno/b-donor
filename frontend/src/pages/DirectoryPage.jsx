import { useState } from "react";
import {
  DoctorCard,
  EmptyState,
  HospitalCard,
  LocationPicker,
  RoleBasedLayout
} from "../components/PortalComponents";
import api from "../api/client";

export default function DirectoryPage() {
  const [location, setLocation] = useState({});
  const [filters, setFilters] = useState({
    specialization: "",
    department: "",
    city: "",
    district: "",
    consultationMode: "",
    language: "",
    maxFee: "",
    bloodBankAvailable: false
  });
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [message, setMessage] = useState("");
  const [searchMode, setSearchMode] = useState("nearby");

  async function search() {
    setMessage("");
    try {
      const doctorParams = new URLSearchParams();
      const hospitalParams = new URLSearchParams();

      if (searchMode === "nearby" && location.lat && location.lng) {
        doctorParams.set("lat", location.lat);
        doctorParams.set("lng", location.lng);
        doctorParams.set("radiusKm", "20");
        hospitalParams.set("lat", location.lat);
        hospitalParams.set("lng", location.lng);
        hospitalParams.set("radiusKm", "20");
      }

      if (searchMode === "search") {
        ["city", "district"].forEach((field) => {
          if (filters[field]) {
            doctorParams.set(field, filters[field]);
            hospitalParams.set(field, filters[field]);
          }
        });
        if (filters.specialization) doctorParams.set("specialization", filters.specialization);
        if (filters.department) hospitalParams.set("department", filters.department);
        if (filters.consultationMode) doctorParams.set("consultationMode", filters.consultationMode);
        if (filters.language) doctorParams.set("language", filters.language);
        if (filters.maxFee) doctorParams.set("maxFee", filters.maxFee);
        if (filters.bloodBankAvailable) hospitalParams.set("bloodBankAvailable", "true");
      }

      const doctorPath = searchMode === "search" ? "/doctors/search" : "/doctors/nearby";
      const hospitalPath = searchMode === "search" ? "/hospitals/search" : "/hospitals/nearby";
      const [doctorRes, hospitalRes] = await Promise.all([
        api.get(`${doctorPath}?${doctorParams.toString()}`),
        api.get(`${hospitalPath}?${hospitalParams.toString()}`)
      ]);
      setDoctors(doctorRes.data.doctors || []);
      setHospitals(hospitalRes.data.hospitals || []);
      setMessage("Showing approved doctors and hospitals. Appointment requests are confirmed only after provider acceptance.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not load care directory.");
    }
  }

  function setFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  return (
    <RoleBasedLayout>
      <div className="space-y-5">
        <div className="card space-y-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-950">Find doctors and hospitals</h1>
            <p className="mt-1 text-sm text-slate-600">Search approved profiles. Use GPS for nearby care or filters for city, specialization, language, fee, and hospital services.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button className={searchMode === "nearby" ? "btn-primary" : "btn-secondary"} type="button" onClick={() => setSearchMode("nearby")}>Nearby search</button>
            <button className={searchMode === "search" ? "btn-primary" : "btn-secondary"} type="button" onClick={() => setSearchMode("search")}>Filter search</button>
          </div>
          {searchMode === "nearby" ? (
            <LocationPicker value={location} onChange={setLocation} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input className="field" placeholder="Specialization" value={filters.specialization} onChange={(e) => setFilter("specialization", e.target.value)} />
              <input className="field" placeholder="Hospital department" value={filters.department} onChange={(e) => setFilter("department", e.target.value)} />
              <input className="field" placeholder="City" value={filters.city} onChange={(e) => setFilter("city", e.target.value)} />
              <input className="field" placeholder="District" value={filters.district} onChange={(e) => setFilter("district", e.target.value)} />
              <select className="field" value={filters.consultationMode} onChange={(e) => setFilter("consultationMode", e.target.value)}>
                <option value="">Any mode</option>
                <option value="clinic">Clinic</option>
                <option value="phone">Phone</option>
                <option value="video">Video</option>
              </select>
              <input className="field" placeholder="Language" value={filters.language} onChange={(e) => setFilter("language", e.target.value)} />
              <input className="field" placeholder="Max fee" type="number" value={filters.maxFee} onChange={(e) => setFilter("maxFee", e.target.value)} />
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={filters.bloodBankAvailable} onChange={(e) => setFilter("bloodBankAvailable", e.target.checked)} />
                Blood bank listed
              </label>
            </div>
          )}
          <button className="btn-primary" onClick={search}>Search care</button>
          {message && <p className="text-sm text-slate-600">{message}</p>}
        </div>

        <section className="grid gap-5 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-xl font-extrabold text-slate-950">Doctors</h2>
            <div className="space-y-3">
              {doctors.length ? doctors.map((doctor) => <DoctorCard key={doctor._id} doctor={doctor} />) : <EmptyState title="No doctors loaded" text="Run search after approved doctor profiles exist." />}
            </div>
          </div>
          <div>
            <h2 className="mb-3 text-xl font-extrabold text-slate-950">Hospitals</h2>
            <div className="space-y-3">
              {hospitals.length ? hospitals.map((hospital) => <HospitalCard key={hospital._id} hospital={hospital} />) : <EmptyState title="No hospitals loaded" text="Run search after approved hospital profiles exist." />}
            </div>
          </div>
        </section>
      </div>
    </RoleBasedLayout>
  );
}
