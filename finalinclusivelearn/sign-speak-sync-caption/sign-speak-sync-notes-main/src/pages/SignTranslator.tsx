
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SignLanguageTranslator from "@/components/SignLanguageTranslator";

const SignTranslator = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <SignLanguageTranslator />
      </main>
      <Footer />
    </div>
  );
};

export default SignTranslator;
