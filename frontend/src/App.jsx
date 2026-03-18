import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import PortfolioView from './pages/PortfolioView';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import ApplicationTracker from './pages/ApplicationTracker';
import AuthLayout from './components/AuthLayout';
import Onboarding from './pages/Onboarding';
import Landing from './pages/Landing';
import Account from './pages/Account';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/onboarding" />} />
        <Route path="/onboarding" element={session ? <Onboarding /> : <Navigate to="/login" />} />

        {/* Public Portfolio Routes */}
        <Route path="/portfolio" element={<PortfolioView />} />
        <Route path="/p/:id" element={<PortfolioView />} />
        <Route path="/:username" element={<PortfolioView />} />

        {/* Protected Routes — wrapped in AuthLayout */}
        <Route
          path="/dashboard"
          element={session
            ? <AuthLayout><Dashboard session={session} /></AuthLayout>
            : <Navigate to="/login" />}
        />
        <Route
          path="/analyzer"
          element={session
            ? <AuthLayout><ResumeAnalyzer /></AuthLayout>
            : <Navigate to="/login" />}
        />
        <Route
          path="/tracker"
          element={session
            ? <AuthLayout><ApplicationTracker /></AuthLayout>
            : <Navigate to="/login" />}
        />
        <Route
          path="/account"
          element={session
            ? <AuthLayout><Account /></AuthLayout>
            : <Navigate to="/login" />}
        />

        {/* Home */}
        <Route path="/" element={<Landing />} />
      </Routes>
    </Router>
  );
}

export default App;