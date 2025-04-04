import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LandingPage from "@/components/LandingPage";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { user, isLoading } = useAuth();

  // Log authentication state for debugging
  useEffect(() => {
    console.log("Index page - Auth state:", { user: user?.email, isLoading });
  }, [user, isLoading]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <LandingPage />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
