import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import PortfolioView from './pages/PortfolioView';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import AuthLayout from './components/AuthLayout';

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
        {/* Public Auth Routes — no chatbot */}
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/dashboard" />} />

        {/* Public Portfolio Route — no chatbot for unauthenticated visitors */}
        <Route path="/portfolio" element={<PortfolioView />} />

        {/* Protected Routes — wrapped in AuthLayout which injects the ChatBot */}
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

        {/* Default */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;