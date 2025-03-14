import { useState } from "react";
import { loginUser } from "../services/authService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await loginUser(email, password);
      alert("Login successful!");
    } catch (error) {
      alert("Login failed!");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} className="border p-2 rounded"/>
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} className="border p-2 rounded"/>
      <button onClick={handleLogin} className="bg-blue-500 text-white p-2 rounded">Login</button>
    </div>
  );
}
