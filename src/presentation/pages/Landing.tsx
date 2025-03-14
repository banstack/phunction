import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import "@/styles/animations.css";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-900 to-purple-800 animate-gradient-x">
      {/* Navbar */}
      <nav className="backdrop-blur-sm bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-xl font-bold text-white animate-fade-in-down">Phunction</div>
            <div className="hidden md:flex space-x-8 animate-fade-in-down" style={{ animationDelay: '200ms' }}>
              <a href="#" className="text-gray-300 hover:text-white transition-colors hover:scale-105 transform duration-200">About Us</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors hover:scale-105 transform duration-200">Blog</a>
            </div>
            <div className="flex items-center space-x-4 animate-fade-in-down" style={{ animationDelay: '400ms' }}>
              <Link 
                to="/login" 
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm transition-all hover:scale-105 duration-200"
              >
                Login
              </Link>
              <Link to="/login">
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 text-white transition-all hover:scale-105 duration-200"
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '4s' }}></div>
          <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '6s' }}></div>
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white opacity-0 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
              Make your functions{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-600 animate-gradient-text">
                the function
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-2xl mx-auto opacity-0 animate-fade-in-up" style={{ animationDelay: '800ms' }}>
              Plan, Create, Share, and Gamify your events with Phunction. 
              Join the community of event creators making unforgettable experiences.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '1000ms' }}>
              <Button
                variant="outline"
                className="w-full sm:w-auto text-white border-white hover:bg-white/10 bg-transparent px-8 py-6 text-lg transition-all hover:scale-105 duration-200"
              >
                Search events
              </Button>
              <Link to="/login" className="w-full sm:w-auto">
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700 px-8 py-6 text-lg transition-all hover:scale-105 duration-200"
                >
                  Create event
                </Button>
              </Link>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
              <div className="bg-gray-900/40 backdrop-blur-sm p-6 rounded-xl border border-white/10 opacity-0 animate-fade-in-up hover:transform hover:scale-105 transition-all duration-300" style={{ animationDelay: '1200ms' }}>
                <h3 className="text-xl font-semibold text-white mb-2">Easy Planning</h3>
                <p className="text-gray-300">Create and manage events with our intuitive multi-step form</p>
              </div>
              <div className="bg-gray-900/40 backdrop-blur-sm p-6 rounded-xl border border-white/10 opacity-0 animate-fade-in-up hover:transform hover:scale-105 transition-all duration-300" style={{ animationDelay: '1400ms' }}>
                <h3 className="text-xl font-semibold text-white mb-2">Game Modes</h3>
                <p className="text-gray-300">Choose from different game modes to make your events more engaging</p>
              </div>
              <div className="bg-gray-900/40 backdrop-blur-sm p-6 rounded-xl border border-white/10 opacity-0 animate-fade-in-up hover:transform hover:scale-105 transition-all duration-300" style={{ animationDelay: '1600ms' }}>
                <h3 className="text-xl font-semibold text-white mb-2">Community</h3>
                <p className="text-gray-300">Connect with others and build your network through shared experiences</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
