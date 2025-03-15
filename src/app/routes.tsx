import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "@/presentation/pages/Landing";
import Login from "@/presentation/pages/Login";
import Dashboard from "@/presentation/pages/Dashboard";
import { auth } from "@/app/firebase";
import { useEffect } from "react";
import { useAuthStore } from "@/app/store";
import { UserService } from "@/application/services/UserService";
import { FirebaseUserRepository } from "@/infrastructure/repositories/FirebaseUserRepository";

const userService = new UserService(new FirebaseUserRepository());

export default function AppRoutes() {
  const { isAuthenticated, setAuth } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    setAuth: state.setAuth
  }));

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        try {
          const userData = await userService.getUserData(currentUser.uid);
          setAuth(true, userData);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setAuth(false, null);
        }
      } else {
        setAuth(false, null);
      }
    });
    return () => unsubscribe();
  }, [setAuth]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}
