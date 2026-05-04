import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { Suspense, lazy } from "react";

import AppShell from "./components/AppShell";
import PageLoader from "./components/PageLoader";
import { isLoggedIn } from "./store/auth";

// Pages
const LoginPage = lazy(() => import("./pages/Login"));
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const AppointmentsPage = lazy(() => import("./pages/Appointments"));
const BookingPage = lazy(() => import("./pages/Booking"));
const LabReportsPage = lazy(() => import("./pages/LabReports"));
const MedicalRecordsPage = lazy(() => import("./pages/MedicalRecords"));
const BillingPage = lazy(() => import("./pages/Billing"));
const ProfilePage = lazy(() => import("./pages/Profile"));

function PrivateRoute() {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function Wrap({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <Wrap>
        <LoginPage />
      </Wrap>
    ),
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            index: true,
            element: (
              <Wrap>
                <DashboardPage />
              </Wrap>
            ),
          },
          {
            path: "appointments",
            element: (
              <Wrap>
                <AppointmentsPage />
              </Wrap>
            ),
          },
          {
            path: "book",
            element: (
              <Wrap>
                <BookingPage />
              </Wrap>
            ),
          },
          {
            path: "lab-reports",
            element: (
              <Wrap>
                <LabReportsPage />
              </Wrap>
            ),
          },
          {
            path: "records",
            element: (
              <Wrap>
                <MedicalRecordsPage />
              </Wrap>
            ),
          },
          {
            path: "billing",
            element: (
              <Wrap>
                <BillingPage />
              </Wrap>
            ),
          },
          {
            path: "profile",
            element: (
              <Wrap>
                <ProfilePage />
              </Wrap>
            ),
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default router;
