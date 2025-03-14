import { Loader2 } from "lucide-react";

interface LoadingProps {
  message?: string;
}

export function Loading({ message = "Loading..." }: LoadingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-900 to-purple-800 text-white">
      <div className="h-full flex flex-col items-center justify-center gap-4 p-4">
        <div className="relative">
          {/* Outer ring */}
          <div className="absolute inset-0 border-4 border-purple-400/20 rounded-full animate-pulse" />
          {/* Inner spinning loader */}
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
        </div>
        <p className="text-gray-300 animate-pulse">{message}</p>
      </div>
    </div>
  );
} 