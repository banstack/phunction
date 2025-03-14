import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { loginUser, registerUser } from "@/services/authService";
import "@/styles/animations.css";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // Only for sign-up
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const toggleForm = () => {
    setIsSignup(!isSignup);
    setError(null); // Reset error when switching forms
  };

  const handleAuth = async () => {
    try {
      if (isSignup) {
        if (!username.trim()) {
          setError("Username is required");
          return;
        }
        await registerUser(email, password, username);
      } else {
        await loginUser(email, password);
      }
      navigate("/dashboard"); // Redirect to dashboard after successful auth
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message === 'Username already taken') {
          setError('This username is already taken. Please choose another one.');
        } else {
          formatFirebaseError(error.message);
        }
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  const formatFirebaseError = (errorCode: string) => {
    const errorMessages: Record<string, string> = {
      "Firebase: Error auth/user-not-found.": "User not found. Please check your credentials.",
      "Firebase: Error (auth/invalid-email).": "Invalid email format. Please check again.",
      "Firebase: Error (auth/invalid-credential).": "Incorrect password. Try again.",
      "Firebase: Error (auth/missing-email).": "Email is required.",
      "Firebase: Error (auth/missing-password).": "Password is required.",
      "Firebase: Error (auth/email-already-in-use).": "This email is already in use.",
      "Firebase: Password should be at least 6 characters (auth/weak-password).": "Password should be at least 6 characters.",
      "Firebase: Error auth/invalid-email.": "Invalid email format. Please check again.",
      "Firebase: Error auth/network-request-failed.": "Network error. Please try again.",
    };

    setError(errorMessages[errorCode] || "An unknown error occurred.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-900 to-purple-800 animate-gradient-x flex items-center justify-center relative">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '6s' }}></div>
      </div>

      {/* Back to Home Link */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 text-white/80 hover:text-white transition-colors flex items-center gap-2 group"
      >
        <span className="transform transition-transform group-hover:-translate-x-1">&larr;</span>
        Back to Home
      </Link>

      <motion.div
        key={isSignup ? "signup" : "login"}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md p-8 relative"
      >
        <div className="bg-gray-900/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold text-white text-center mb-6"
          >
            {isSignup ? "Create an Account" : "Welcome Back"}
          </motion.h2>

          {/* Error Alert */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error-message"
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="mb-6"
              >
                <div className="bg-[#2A1B3D] rounded-lg p-4 border border-red-500/20">
                  <div className="flex flex-col items-center text-center space-y-1">
                    <div className="flex items-center justify-center gap-2 text-red-400">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="currentColor" 
                        className="w-5 h-5"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                      <span className="font-medium">Error</span>
                    </div>
                    <p className="text-red-200/70 text-sm">
                      {error}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-5">
            <AnimatePresence mode="wait">
              {isSignup && (
                <motion.div
                  key="signup-username"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <input
                    type="text"
                    placeholder="Username"
                    className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <input
                type="email"
                placeholder="Email"
                className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
                onChange={(e) => setEmail(e.target.value)}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <input
                type="password"
                placeholder="Password"
                className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
                onChange={(e) => setPassword(e.target.value)}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 rounded-lg text-lg font-medium transition-all hover:scale-[1.02] duration-200"
                onClick={handleAuth}
              >
                {isSignup ? "Create Account" : "Sign In"}
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center mt-6"
          >
            <p className="text-gray-300">
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <span
                onClick={toggleForm}
                className="text-purple-400 hover:text-purple-300 cursor-pointer transition-colors"
              >
                {isSignup ? "Sign in here" : "Create one here"}
              </span>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
