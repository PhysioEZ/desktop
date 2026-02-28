import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "sonner";
import SplashScreen from "./components/SplashScreen";
import LoginScreen from "./screens/LoginScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import ReceptionDashboard from "./reception/Dashboard";
import DashboardNew from "./reception/Dashboard";
import Schedule from "./reception/Schedule";
import TestSchedule from "./reception/TestSchedule";
import GlobalSearchOverlay from "./components/GlobalSearchOverlay";

import Inquiry from "./reception/Inquiry";
import Registration from "./reception/Registration";
import CancelledRegistrations from "./reception/CancelledRegistrations";
import CancelledTests from "./reception/CancelledTests";
import Patients from "./reception/Patients";
import Billing from "./reception/Billing";
import Profile from "./reception/Profile";

import ServiceManager from "./admin/ServiceManager";
import RegistrationSimulator from "./admin/RegistrationSimulator";
import AdminDashboard from "./admin/Dashboard";
import SystemStatusManager from "./components/SystemStatusManager";
import { useThemeStore } from "./store/useThemeStore";
import Attendance from "./reception/Attendance";
import Tests from "./reception/Tests";
import Feedback from "./reception/Feedback";
import Expenses from "./reception/Expenses";
import Support from "./reception/Support";
import Reports from "./reception/Reports";
import Settings from "./reception/Settings";
import ReceptionAnalytics from "./reception/ReceptionAnalytics";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const { isDark } = useThemeStore();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  // Check session storage to see if splash has already been shown this session
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem("splashShown");
  });

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem("splashShown", "true");
  };

  // Just in case, ensure it doesn't get stuck if no onComplete is called (failsafe)
  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        // Fallback if splash component doesn't call onComplete
        // But ideally Splash component handles its own timing and calls the prop.
        // We'll let the component drive it, but we can sync state here if needed.
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <SystemStatusManager />
      <GlobalSearchOverlay />
      <Toaster richColors position="top-right" closeButton />
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route
          path="/welcome"
          element={
            <ProtectedRoute>
              <WelcomeScreen />
            </ProtectedRoute>
          }
        />

        {/* Protected Reception Routes */}
        <Route
          path="/reception/*"
          element={
            <ProtectedRoute>
              <Routes>
                <Route path="dashboard" element={<ReceptionDashboard />} />
                <Route path="dashboard-new" element={<DashboardNew />} />
                <Route path="schedule" element={<Schedule />} />
                <Route path="test-schedule" element={<TestSchedule />} />
                <Route path="inquiry" element={<Inquiry />} />
                <Route path="registration" element={<Registration />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="tests" element={<Tests />} />
                <Route path="feedback" element={<Feedback />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="support" element={<Support />} />
                <Route path="reports" element={<Reports />} />
                <Route
                  path="registration/cancelled"
                  element={<CancelledRegistrations />}
                />
                <Route path="tests/cancelled" element={<CancelledTests />} />
                <Route path="patients" element={<Patients />} />
                <Route path="billing" element={<Billing />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route
                  path="reception-analytics"
                  element={<ReceptionAnalytics />}
                />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="services" element={<ServiceManager />} />
                <Route path="simulator" element={<RegistrationSimulator />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
