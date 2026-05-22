# B Donor

**Every Life Matters**

B Donor is a MERN health-tech donor connection portal. It helps patients and hospitals connect with nearby approved voluntary blood donors, while also offering AI health summaries, report upload, doctor/hospital discovery, appointment interest requests, prescriptions from approved doctors, certificates, privacy controls, and admin operations.

## Legal Positioning

B Donor is **not** a blood bank. It does not buy, sell, collect, store, test, process, distribute, or transfuse blood. It only connects voluntary donors with patients or hospitals.

Blood collection, testing, storage, transfusion, and all medical procedures must be handled only by licensed hospitals, blood banks, and medical professionals.

Forbidden in this project:

- Selling blood
- Buying blood
- Charging per blood unit
- Charging for donor contact
- Paying donors
- Paid priority emergency matching
- Selling donor, patient, or medical report data
- Donor Coin as crypto, cash, coupon, discount, or tradable reward

## Tech Stack

- Frontend: React 18, Vite, React Router, Tailwind CSS, Framer Motion, Lucide React, Axios
- Backend: Node.js, Express.js, MongoDB Atlas, Mongoose, JWT, Multer
- AI: Gemini API-ready MedBot integration with safety fallback
- Live tracking: request-scoped polling APIs, ready for Socket.IO/SSE later
- Database: MongoDB Atlas

## Folder Structure

```text
frontend/   React app UI
backend/    Express API
docs/       API and safety notes
README.md
.gitignore
```

## Deployment Structure

- Frontend: deploy `/frontend` on Vercel
- Backend: deploy `/backend` on Render or Railway
- Database: MongoDB Atlas
- Production frontend talks to backend through `VITE_API_URL` or `REACT_APP_API_URL`
- Backend CORS allows the deployed frontend URL through `FRONTEND_URL`
- Keep `.env.example` files in GitHub
- Never commit real `.env` files or secrets

## Package Scripts

Frontend `/frontend/package.json`:

```bash
npm run dev
npm run build
npm run preview
```

Backend `/backend/package.json`:

```bash
npm run dev
npm start
npm run create-admin
```

## Core Features

- Patient registration and login; patients are auto approved
- One user can be both patient and donor
- Admin approval for donors, doctors, and hospitals
- Blood request system with 2km, 5km, 10km, 20km, and 50km radius search
- Exact blood group matching first
- Compatible donor groups only for urgent/critical emergency fallback
- Donor alerts with in-app status and manual WhatsApp testing links
- Donor accept/decline workflow
- Consent-based live tracking after donor accepts
- Donation completion and no-money declaration flow
- 90-day donor cooldown after verified donation
- Recovery tips
- Certificate generation with public QR verification
- DONOR COIN Impact Points as non-cash recognition only
- AI Health Assistant for symptoms, reports, red flags, and doctor discussion summaries
- Medical report upload using Multer
- Doctor and hospital discovery
- Appointment interest/request flow without payment in Phase 1
- Doctor-only prescription module
- Privacy center and consent controls
- Audit logs
- Admin command center with approvals, live requests, certificates, disputes, subscriptions, CSR, appointments, analytics, and audit logs

## MongoDB Atlas Setup

1. Create a free MongoDB Atlas cluster.
2. Create a database user in **Database Access**.
3. Add your IP in **Network Access** for local testing.
4. For Render/Railway, add the hosting IP rule or use `0.0.0.0/0` if needed.
5. Copy your `mongodb+srv://...` connection string.
6. Add it to `backend/.env` as `MONGO_URI`.
7. Add the same value as `MONGO_URI` in Render/Railway environment variables.

Example:

```env
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/b-donor?retryWrites=true&w=majority
```

## Backend Setup

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Required local backend env:

```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=use_a_long_random_secret
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=
```

Backend health check:

```text
http://localhost:5000/api/health
```

## Frontend Setup

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open:

```text
http://localhost:3000
```

Frontend env:

```env
VITE_API_URL=http://localhost:5000/api
# Optional compatibility alias, supported by Vite config:
REACT_APP_API_URL=http://localhost:5000/api
```

## Environment Variables

Backend `backend/.env`:

```env
PORT=5000
MONGO_URI=
JWT_SECRET=replace_with_long_random_secret
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=
WHATSAPP_PROVIDER=manual
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
SMS_PROVIDER=
SMS_API_KEY=
GEOAPIFY_API_KEY=
GOOGLE_MAPS_API_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

Never hardcode secrets.

`JWT_SECRET` is required for auth. The backend does not use a hardcoded production fallback.

## GitHub Preparation

Before pushing:

```bash
cd frontend
npm install
npm run build

cd ../backend
npm install
node --check server.js
```

Commit these:

```text
frontend/
backend/
docs/
README.md
.gitignore
```

Do not commit:

```text
frontend/.env
backend/.env
node_modules/
frontend/dist/
backend/uploads/*
```

The `.gitignore` already excludes local env files, dependencies, build output, logs, Vercel metadata, and development uploads.

## Admin Creation

Admins are manually created only.

Temporarily add to `backend/.env`:

```env
ADMIN_NAME=B Donor Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_this_password
```

Run:

```bash
cd backend
npm run create-admin
```

Remove or protect `ADMIN_PASSWORD` after creation.

## Manual WhatsApp Testing

Phase 1 uses free/manual WhatsApp links:

```text
https://wa.me/{phone}?text={encodedMessage}
```

No paid SMS, Twilio, MSG91, or WhatsApp Cloud API is required for testing. Future providers can be added through `WHATSAPP_PROVIDER`, Twilio, MSG91, or WhatsApp Cloud API environment variables.

## Donor Cooldown Rules

After a verified donation:

- Blood request becomes fulfilled after required verification.
- Donor availability is turned off.
- Donor `cooldownUntil` is set to 90 days after donation.
- Donor does not appear in matching while cooldown is active.
- Donor dashboard shows recovery mode and next eligible date.
- Recovery tips remind donors to hydrate, eat iron-rich foods, rest, avoid heavy exercise for 24 hours, and contact a doctor for severe symptoms.

## Certificate And QR Verification

Certificates are B Donor platform records only. They do not prove medical eligibility on a donation date.

Supported certificate types:

- Verified donor
- Voluntary donation
- No-money declaration
- Recovery completed
- Emergency responder
- Doctor verified
- Hospital verified partner
- Blood camp participation

Public QR verification route:

```text
/verify/certificate/:certificateId
```

Public verification shows masked names by default, certificate type, status, date, city/district, issuing authority, timestamp, and disclaimer.

## DONOR COIN Impact Points

DONOR COIN Impact Points are non-cash recognition points only.

- Not payment for blood donation
- Not cryptocurrency in Phase 1
- Not transferable
- Not withdrawable
- Not redeemable for cash, gifts, coupons, discounts, or benefits
- No monetary value
- No investment or profit promise

They can support badges, certificates, donor levels, impact profile, and future leaderboard opt-in.

## Legal Monetization Model

Allowed earning streams:

- Hospital SaaS subscription
- Doctor verified profile and appointment dashboard tools
- Patient health record premium plan
- AI medical report summary premium
- Blood camp dashboard for hospitals, NGOs, and corporates
- Certificate and QR verification dashboard for organizations
- CSR sponsorship for awareness and certificates
- Ethical ads only outside emergency flows
- White-label software
- Aggregated anonymized analytics reports only
- Implementation, training, and support services
- Future appointment platform fee only after confirmed booking system is live

Forbidden earning streams:

- Selling blood
- Buying blood
- Commission per unit
- Commission per successful donation
- Charging for donor contact
- Paying donors
- Crypto reward with market value
- Paid priority emergency blood access
- Selling donor database
- Selling patient data or medical reports
- Paid ranking in emergency donor matching
- Secret doctor referral kickbacks

## Appointment Phase 1 And Phase 2

Phase 1:

- Doctor/hospital listings are searchable.
- Consultation fee is informational only.
- Patient can send appointment interest with preferred date, time, mode, and symptoms.
- Patient must consent before sharing AI summaries or medical information.
- No payment is required.
- Request is confirmed only after active doctor/hospital accepts it.
- If provider is not active on B Donor, show call/contact only.

Phase 2 can add a small transparent convenience fee only after confirmed appointment booking exists, receipts/refunds are clear, and the fee is for booking software convenience, not blood donation or medical advice.

## Privacy And Consent

Privacy Center supports:

- View consent status
- Withdraw optional location, live tracking, WhatsApp/SMS, appointment sharing, and certificate visibility consent
- Download basic data summary
- Request account deletion
- Keep medical reports private by default
- Certificate visibility controls
- Request-scoped live tracking permissions

Audit logs are used for approvals, donor match views, phone reveal, tracking start/stop, consent signing, certificates, admin actions, subscription changes, appointment sharing, and prescriptions.

## AI Health Assistant Safety

The AI Health Assistant cannot diagnose, replace a doctor, or issue prescriptions. It can discuss symptoms, ask follow-up questions, summarize reports, flag possible concerns, warn about red flags, recommend doctor/hospital consultation, and prepare a doctor discussion summary.

If a user asks for a prescription, the assistant must state that only an approved doctor can provide prescription through B Donor.

Emergency symptoms such as chest pain, breathing trouble, stroke signs, severe bleeding, fainting, pregnancy emergency, or accident should be directed to emergency hospital care first.

## Frontend Vercel Deployment

1. Push the repo to GitHub.
2. Import in Vercel.
3. Set Root Directory to `frontend`.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Install command: `npm install`.
7. Add one frontend environment variable:

```env
VITE_API_URL=https://your-backend-url/api
```

`REACT_APP_API_URL` is also supported, but `VITE_API_URL` is preferred for Vite.

## Backend Render/Railway Deployment

1. Create a Web Service.
2. Set Root Directory to `backend`.
3. Build command: `npm install`.
4. Start command: `npm start`.
5. Add all backend environment variables.
6. Set `FRONTEND_URL` to your Vercel frontend URL.
7. Use MongoDB Atlas for database.
8. Confirm the health check works:

```text
https://your-backend-url/api/health
```

Minimum production backend env:

```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=long_random_secret
FRONTEND_URL=https://your-vercel-app.vercel.app
GEMINI_API_KEY=
WHATSAPP_PROVIDER=manual
```

If you have multiple allowed frontends, use comma-separated `FRONTEND_URL`:

```env
FRONTEND_URL=https://your-vercel-app.vercel.app,http://localhost:3000
```

## Why Live Tracking Should Not Be Only Serverless

The current implementation uses polling APIs, so Express can run normally on Render/Railway. If Socket.IO or WebSocket live tracking is added later, use Render/Railway or another long-running backend. Vercel serverless functions are not designed for persistent WebSocket sessions.

## Future Roadmap

- Socket.IO or SSE tracking stream
- Leaflet/OpenStreetMap map tiles or Google Maps integration
- Cloudinary/S3 medical report storage
- WhatsApp Cloud API/Twilio/MSG91 integration
- OTP verification for consent signatures
- Certificate PDF generation
- Blood camp organizer dashboard
- CSR campaign public pages
- Complaint workflow and suspicious activity scoring
- Razorpay manual-to-online billing upgrade for non-blood SaaS services
- Optional supporter/community token separate from blood donation activity
