
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NotesManager from "@/components/NotesManager";

const Notes = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <NotesManager />
      </main>
      <Footer />
    </div>
  );
};

export default Notes;
