# B Donor API Overview

Base URL:

```text
http://localhost:5000/api
```

## Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

## Users And Privacy

- `PUT /users/profile`
- `POST /users/location`
- `PUT /users/medical-history`
- `GET /users/prescriptions`
- `GET /users/privacy-center/summary`
- `PUT /users/privacy-center/consent`
- `POST /users/privacy-center/delete-request`

## Donors

- `POST /donors/activate`
- `PUT /donors/profile`
- `PUT /donors/availability`
- `GET /donors/alerts`
- `GET /donors/search?bloodGroup=A%2B&lat=30.7&lng=76.7&radiusKm=5&urgency=critical`

Donor search uses approved, available donors only and excludes donors in active cooldown.

## Blood Requests

- `POST /blood-requests`
- `GET /blood-requests/mine`
- `GET /blood-requests/:id`
- `POST /blood-requests/:id/search-donors`
- `POST /blood-requests/:id/expand-radius`
- `POST /blood-requests/:id/cancel`
- `POST /blood-requests/:id/mark-donated`
- `POST /blood-requests/:id/fulfill`

Matching searches exact blood groups first. Urgent and critical requests can use compatible donor groups only when exact donors are unavailable and emergency fallback is enabled.

## Donor Alerts

- `GET /donor-alerts/mine`
- `POST /donor-alerts/:id/accept`
- `POST /donor-alerts/:id/decline`

Donor contact is hidden until the donor accepts. Live tracking remains hidden until the donor starts tracking with consent.

## Tracking

- `POST /tracking/:bloodRequestId/start`
- `POST /tracking/:bloodRequestId/location`
- `GET /tracking/:bloodRequestId/live`
- `POST /tracking/:bloodRequestId/stop`
- `POST /tracking/:bloodRequestId/complete`

Tracking is request-scoped and expires after stop, completion, cancellation, or expiry.

## Donation Consents

- `POST /donation-consents/:bloodRequestId/donor-confirm`
- `POST /donation-consents/:bloodRequestId/patient-confirm`
- `POST /donation-consents/:bloodRequestId/hospital-confirm`
- `POST /donation-consents/:bloodRequestId/admin-verify`
- `GET /donation-consents/mine`
- `GET /donation-consents/:id`

Consent forms include no-money, no-gift, no-crypto, no-coupon declaration language.

## Certificates

- `GET /certificates/mine`
- `GET /certificates/:id`
- `GET /certificates/verify/:certificateId`
- `POST /certificates/generate`
- `POST /certificates/:id/revoke`
- `POST /certificates/:id/mark-disputed`

Public QR verification route on the frontend:

```text
/verify/certificate/:certificateId
```

## Donor Coin

- `GET /donor-coin/wallet`
- `GET /donor-coin/ledger`
- `POST /donor-coin/admin-adjust`

DONOR COIN Impact Points have no cash value and are not transferable or withdrawable.

## Doctors And Hospitals

- `POST /doctors/apply`
- `PUT /doctors/profile`
- `GET /doctors/search`
- `GET /doctors/nearby`
- `GET /doctors/:id`
- `POST /hospitals/apply`
- `PUT /hospitals/profile`
- `GET /hospitals/search`
- `GET /hospitals/nearby`
- `GET /hospitals/:id`

## Appointments

- `POST /appointments/request`
- `GET /appointments/mine`
- `GET /appointments/doctor`
- `GET /appointments/hospital`
- `POST /appointments/:id/accept`
- `POST /appointments/:id/reject`
- `POST /appointments/:id/cancel`
- `POST /appointments/:id/complete`

Phase 1 has no required payment. A request is confirmed only after provider acceptance.

## Prescriptions

- `POST /prescriptions`
- `GET /prescriptions/mine`
- `GET /prescriptions/patient/:patientId`
- `GET /prescriptions/:id`

Only approved doctors can create prescriptions.

## AI And Reports

- `POST /medbot/chat`
- `POST /medbot/doctor-summary`
- `POST /medical-reports/upload`
- `GET /medical-reports/mine`
- `GET /medical-reports/:id`
- `POST /medical-reports/:id/analyze`

AI can summarize and flag concerns. It cannot diagnose or prescribe.

## Subscriptions And CSR

- `GET /subscriptions/plans`
- `GET /subscriptions/mine`
- `POST /subscriptions/manual-activate`
- `POST /subscriptions/cancel`
- `GET /csr`
- `POST /csr`
- `PUT /csr/:id`

Subscriptions are manual Phase 1 billing for software/services only, not blood donation or emergency matching.

## Admin

- `GET /admin/pending-approvals`
- `POST /admin/approve-donor/:userId`
- `POST /admin/reject-donor/:userId`
- `POST /admin/approve-doctor/:userId`
- `POST /admin/reject-doctor/:userId`
- `POST /admin/approve-hospital/:userId`
- `POST /admin/reject-hospital/:userId`
- `GET /admin/live-requests`
- `GET /admin/live-tracking`
- `GET /admin/disputed-consents`
- `GET /admin/subscriptions`
- `GET /admin/csr`
- `GET /admin/appointments`
- `GET /admin/certificates`
- `GET /admin/analytics`

## Audit Logs

- `GET /audit-logs`

Audit logs track approvals, consent, tracking, certificates, subscriptions, appointments, and admin actions.
