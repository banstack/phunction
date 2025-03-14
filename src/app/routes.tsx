import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "@/presentation/pages/Landing";
import Login from "@/presentation/pages/Login";
// import Dashboard from "@/presentation/pages/Dashboard";
import { auth } from "@/app/firebase";
import { useEffect, useState } from "react";

export default function AppRoutes() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}
