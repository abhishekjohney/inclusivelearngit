
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { FcGoogle } from 'react-icons/fc';

const Auth = () => {
  const { user, isLoading, signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign in error:", error);
    }
  };

  // Redirect if user is already logged in
  if (user && !isLoading) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-soft-blue to-white py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold gradient-heading">
              Welcome to SignSpeakSync
            </h1>
            <p className="text-gray-600 mt-2">
              Sign in to access exclusive features
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <FcGoogle className="w-5 h-5" />
              {isLoading ? "Loading..." : "Sign in with Google"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
