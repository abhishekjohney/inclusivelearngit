import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Monitor, FileText, Headphones } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-soft-blue to-white py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-heading">
                Breaking Communication Barriers
              </h1>
              <p className="text-lg text-gray-700 mb-8">
                SignSpeakSync translates sign language, captions videos, and saves lecture notes in one easy-to-use platform.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                {user ? (
                  <>
                    <Button className="bg-ocean-blue hover:bg-blue-600 text-white" asChild>
                      <Link to="/sign-translator">Try Sign Translator</Link>
                    </Button>
                    <Button variant="outline" className="border-ocean-blue text-ocean-blue hover:bg-soft-blue" asChild>
                      <Link to="/video-captioning">Caption Videos</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="bg-ocean-blue hover:bg-blue-600 text-white" asChild>
                      <Link to="/auth?tab=signin">Sign In</Link>
                    </Button>
                    <Button variant="outline" className="border-ocean-blue text-ocean-blue hover:bg-soft-blue" asChild>
                      <Link to="/auth?tab=signup">Create Account</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="bg-white rounded-lg shadow-xl overflow-hidden w-full max-w-md">
                <div className="bg-gradient-to-r from-ocean-blue to-purple p-1"></div>
                <div className="p-6">
                  <div className="bg-gray-100 rounded-lg p-6 mb-4 h-40 flex items-center justify-center">
                    <p className="text-gray-500 text-center">Sign language visualization placeholder</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-800">"Hello, welcome to SignSpeakSync. How can I help you today?"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 gradient-heading">Our Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="feature-card">
              <div className="bg-soft-blue w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Monitor className="text-ocean-blue w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Sign Language Translation</h3>
              <p className="text-gray-600">
                Translate sign language gestures into text and speech in real-time.
              </p>
            </div>
            <div className="feature-card">
              <div className="bg-soft-blue w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Headphones className="text-ocean-blue w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Video Captioning</h3>
              <p className="text-gray-600">
                Generate real-time captions for videos and live speech.
              </p>
            </div>
            <div className="feature-card">
              <div className="bg-soft-blue w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <FileText className="text-ocean-blue w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Lecture Notes</h3>
              <p className="text-gray-600">
                Store and organize transcriptions for easy review later.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 gradient-heading">How It Works</h2>
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 md:left-1/2 transform md:-translate-x-1/2 h-full w-1 bg-gradient-to-b from-ocean-blue to-purple"></div>
              
              {/* Steps */}
              <div className="space-y-12">
                {/* Step 1 */}
                <div className="relative flex flex-col md:flex-row items-center">
                  <div className="md:w-1/2 md:pr-8 mb-4 md:mb-0 md:text-right">
                    <h3 className="text-xl font-semibold mb-2">Capture</h3>
                    <p className="text-gray-600">Enable your camera or upload a video for processing.</p>
                  </div>
                  <div className="z-10 w-12 h-12 rounded-full bg-white border-4 border-ocean-blue flex items-center justify-center md:mx-4">
                    <span className="font-bold text-ocean-blue">1</span>
                  </div>
                  <div className="md:w-1/2 md:pl-8"></div>
                </div>
                
                {/* Step 2 */}
                <div className="relative flex flex-col md:flex-row items-center">
                  <div className="md:w-1/2 md:pr-8 md:order-1 md:order-none"></div>
                  <div className="z-10 w-12 h-12 rounded-full bg-white border-4 border-purple flex items-center justify-center md:mx-4">
                    <span className="font-bold text-purple">2</span>
                  </div>
                  <div className="md:w-1/2 md:pl-8 mb-4 md:mb-0">
                    <h3 className="text-xl font-semibold mb-2">Process</h3>
                    <p className="text-gray-600">Our AI analyzes sign language gestures or spoken words.</p>
                  </div>
                </div>
                
                {/* Step 3 */}
                <div className="relative flex flex-col md:flex-row items-center">
                  <div className="md:w-1/2 md:pr-8 mb-4 md:mb-0 md:text-right">
                    <h3 className="text-xl font-semibold mb-2">Translate</h3>
                    <p className="text-gray-600">Convert to text, speech, or save as formatted notes.</p>
                  </div>
                  <div className="z-10 w-12 h-12 rounded-full bg-white border-4 border-ocean-blue flex items-center justify-center md:mx-4">
                    <span className="font-bold text-ocean-blue">3</span>
                  </div>
                  <div className="md:w-1/2 md:pl-8"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-ocean-blue to-purple text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of users breaking communication barriers with SignSpeakSync.
          </p>
          {user ? (
            <Button className="bg-white text-ocean-blue hover:bg-gray-100" size="lg" asChild>
              <Link to="/sign-translator">Try It Now</Link>
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button className="bg-white text-ocean-blue hover:bg-gray-100" size="lg" asChild>
                <Link to="/auth?tab=signin">Sign In</Link>
              </Button>
              <Button className="bg-transparent border-2 border-white text-white hover:bg-white/10" size="lg" asChild>
                <Link to="/auth?tab=signup">Create Account</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
