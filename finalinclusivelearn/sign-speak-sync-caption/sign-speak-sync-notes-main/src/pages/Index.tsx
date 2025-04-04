
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LandingPage from "@/components/LandingPage";

const Index = () => {
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
