import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LandingPage from "@/components/LandingPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, GraduationCap, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const { user, userRole, isLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  // Log authentication state for debugging
  useEffect(() => {
    console.log("Auth state:", { user, userRole, isLoading });
    
    // Set a small delay to ensure auth state is fully loaded
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [user, userRole, isLoading]);

  // Show loading state
  if (isLoading && !isReady) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-ocean-blue mx-auto mb-4" />
            <p className="text-gray-500">Loading your dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {user ? (
          <div className="container mx-auto py-8 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.email?.split('@')[0]}</h1>
                  <div className="flex items-center mt-2">
                    <Badge variant={userRole === 'teacher' ? "default" : "secondary"} className="mr-2">
                      {userRole === 'teacher' ? (
                        <GraduationCap className="h-3 w-3 mr-1" />
                      ) : (
                        <User className="h-3 w-3 mr-1" />
                      )}
                      {userRole === 'teacher' ? 'Teacher' : 'Student'}
                    </Badge>
                    <span className="text-sm text-gray-500">Signed in as {user.email}</span>
                  </div>
                </div>
                <Button asChild>
                  <Link to="/profile">
                    View Profile
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Sign Translator</CardTitle>
                    <CardDescription>
                      Translate text to sign language in real-time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Use our advanced sign language translator to convert text to sign language animations.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link to="/sign-translator">
                        Open Translator <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Video Captioning</CardTitle>
                    <CardDescription>
                      Add captions to your videos automatically
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Upload videos and get automatic captions with our AI-powered captioning tool.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link to="/video-captioning">
                        Start Captioning <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {userRole === 'student' ? (
                <Card>
                  <CardHeader>
                    <CardTitle>My Notes</CardTitle>
                    <CardDescription>
                      Access your saved notes and transcripts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      View and manage all your saved notes and transcripts from your learning sessions.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link to="/notes">
                        View My Notes <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>All Notes</CardTitle>
                      <CardDescription>
                        Manage all student notes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">
                        View and manage notes from all your students in one place.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link to="/notes">
                          View All Notes <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Students</CardTitle>
                      <CardDescription>
                        Manage your students
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">
                        View and manage your students, track their progress, and add new students.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link to="/students">
                          Manage Students <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}
            </div>
          </div>
        ) : (
          <LandingPage />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
