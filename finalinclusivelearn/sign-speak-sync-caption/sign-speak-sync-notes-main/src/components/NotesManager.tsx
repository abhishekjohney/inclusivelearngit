
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Search, 
  CloudDownload, 
  Image
} from "lucide-react";

// Sample notes data for demonstration
const sampleNotes = [
  {
    id: "note-1",
    title: "Introduction to Quantum Physics",
    date: "2023-04-02",
    content: "In this lecture, we covered the fundamental principles of quantum mechanics, including wave-particle duality and Heisenberg's uncertainty principle...",
    source: "Video Lecture"
  },
  {
    id: "note-2",
    title: "American Sign Language Basics",
    date: "2023-03-28",
    content: "Today we learned basic ASL greetings, introducing yourself, and common phrases used in everyday conversation...",
    source: "Sign Language Translation"
  },
  {
    id: "note-3",
    title: "Machine Learning Fundamentals",
    date: "2023-03-15",
    content: "This lecture covered supervised vs. unsupervised learning, common algorithms including linear regression, decision trees, and neural networks...",
    source: "Video Lecture"
  },
  {
    id: "note-4",
    title: "Web Accessibility Guidelines",
    date: "2023-03-10",
    content: "Key takeaways about making web content accessible to people with disabilities, including WCAG standards and practical implementation techniques...",
    source: "Sign Language Translation"
  }
];

const NotesManager = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNote, setSelectedNote] = useState<(typeof sampleNotes)[0] | null>(null);
  
  const filteredNotes = sampleNotes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleNoteClick = (note: (typeof sampleNotes)[0]) => {
    setSelectedNote(note);
  };
  
  const handleDownload = (note: (typeof sampleNotes)[0]) => {
    const noteText = `# ${note.title}\nDate: ${note.date}\nSource: ${note.source}\n\n${note.content}`;
    const blob = new Blob([noteText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title.replace(/\s+/g, "-").toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 gradient-heading text-center">Lecture Notes</h1>
      
      <div className="flex mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search your notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Your Notes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredNotes.length > 0 ? (
                <div className="divide-y">
                  {filteredNotes.map(note => (
                    <div 
                      key={note.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedNote?.id === note.id ? "bg-soft-blue" : ""
                      }`}
                      onClick={() => handleNoteClick(note)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{note.title}</h3>
                        <span className="text-xs text-gray-500">{note.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{note.content}</p>
                      <div className="mt-2 flex items-center">
                        <span className="text-xs text-ocean-blue bg-blue-50 px-2 py-1 rounded">
                          {note.source}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No notes found matching your search
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          {selectedNote ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold">{selectedNote.title}</h2>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-sm text-gray-500">{selectedNote.date}</span>
                      <span className="text-sm text-ocean-blue bg-blue-50 px-2 py-1 rounded">
                        {selectedNote.source}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownload(selectedNote)}
                    className="flex items-center"
                  >
                    <CloudDownload className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
                
                <Tabs defaultValue="text">
                  <TabsList className="mb-4">
                    <TabsTrigger value="text">Text</TabsTrigger>
                    <TabsTrigger value="visual">Visual Summary</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="text">
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-line">{selectedNote.content}</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="visual">
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Visual summaries help you understand complex topics at a glance.</p>
                      <Button className="bg-ocean-blue hover:bg-blue-600">
                        Generate Visual Summary
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Select a note to view</h3>
                <p className="text-gray-600">
                  Choose a lecture note from the list to view its content
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesManager;
