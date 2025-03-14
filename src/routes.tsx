import { Routes, Route } from "react-router-dom";
import Landing from "./presentation/pages/Landing";
import Login from "./presentation/pages/Login";
import Dashboard from "./presentation/pages/Dashboard";
import CreateEvent from "./presentation/pages/CreateEvent";
import EventDetails from "./presentation/pages/EventDetails";
import Profile from "./presentation/pages/Profile";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/create-event" element={<CreateEvent />} />
      <Route path="/event/:eventId" element={<EventDetails />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/user/:userId" element={<Profile />} />
    </Routes>
  );
} 