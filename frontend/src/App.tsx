import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import SplashScreen from './components/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import ReceptionDashboard from './reception/Dashboard';
import DashboardNew from './reception/DashboardNew';
import Schedule from './reception/Schedule';

import Inquiry from './reception/Inquiry';
import Registration from './reception/Registration';
import CancelledRegistrations from './reception/CancelledRegistrations';
import Patients from './reception/Patients';

import ServiceManager from './admin/ServiceManager';
import RegistrationSimulator from './admin/RegistrationSimulator';
import AdminDashboard from './admin/Dashboard';

function App() {
  // Check session storage to see if splash has already been shown this session
  const [showSplash, setShowSplash] = useState(() => {
     return !sessionStorage.getItem('splashShown');
  });

  const handleSplashComplete = () => {
      setShowSplash(false);
      sessionStorage.setItem('splashShown', 'true');
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
      <Toaster richColors position="top-right" closeButton />
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/welcome" element={<WelcomeScreen />} />
        <Route path="/reception/dashboard" element={<ReceptionDashboard />} />
        <Route path="/reception/dashboard-new" element={<DashboardNew />} />
        <Route path="/reception/schedule" element={<Schedule />} />
        <Route path="/reception/inquiry" element={<Inquiry />} />
        <Route path="/reception/registration" element={<Registration />} />
        <Route path="/reception/registration/cancelled" element={<CancelledRegistrations />} />
        <Route path="/reception/patients" element={<Patients />} />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/services" element={<ServiceManager />} />
        <Route path="/admin/simulator" element={<RegistrationSimulator />} />
        
        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
