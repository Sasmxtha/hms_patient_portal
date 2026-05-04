# HFlow Patient Portal

A standalone patient-facing app built with React + Vite + TailwindCSS.  
Connects to the existing `hms_be_fast` FastAPI backend.

## Features

| Page | Description |
|------|-------------|
| **Login** | Email OTP authentication — no password needed |
| **Dashboard** | Patient summary, upcoming appointments, quick actions |
| **Appointments** | View upcoming / past / cancelled appointments, cancel bookings |
| **Book Appointment** | Select doctor → date → available slot → confirm |
| **Lab Reports** | View lab results grouped by section, abnormal values highlighted |
| **Health Records** | Diagnoses with vitals, symptoms, prescriptions, lab orders; uploaded files |
| **Billing** | Payment history with totals, line-item breakdown |
| **Profile** | View & edit personal details, sign out |

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Set your backend URL (edit .env)
VITE_API_BASE_URL=http://localhost:8000

# 3. Start dev server
npm run dev
# Opens at http://localhost:5200

# 4. Build for production
npm run build
```

## Backend Requirements

The app uses these existing backend endpoints:

- `POST /patient/auth/send-otp` — send login OTP
- `POST /patient/auth/verify-otp` — verify OTP, get patient info
- `GET /appointments/patient/{patient_id}` — list patient appointments
- `POST /appointments/{id}/cancel` — cancel appointment
- `GET /doctors/` — list doctors for facility
- `GET /doctor-schedule/availability/{doctor_id}/{start}/{end}` — available slots
- `POST /new_booking/book-existing` — book appointment
- `GET /lab-results/` — lab results by token
- `GET /patient_reports/` — uploaded report files
- `GET /patient_reports/file` — download/view a file
- `GET /appointments/patient/visit-reports` — billing history
- `GET /patient_diagnosis/by-appointment` — diagnosis details

No backend changes required.

## Tech Stack

- React 18 + React Router v6
- TailwindCSS 3
- Axios
- dayjs
- lucide-react icons
- Vite 7
