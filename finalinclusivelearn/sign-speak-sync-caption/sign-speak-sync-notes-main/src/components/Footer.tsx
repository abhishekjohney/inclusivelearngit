
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-50 pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-gradient-to-r from-ocean-blue to-purple rounded-full w-8 h-8 flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="font-bold text-xl">SignSpeakSync</span>
            </div>
            <p className="text-gray-600 mb-4">
              Breaking communication barriers through technology.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Features</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/sign-translator" className="text-gray-600 hover:text-ocean-blue transition-colors">
                  Sign Language Translation
                </Link>
              </li>
              <li>
                <Link to="/video-captioning" className="text-gray-600 hover:text-ocean-blue transition-colors">
                  Video Captioning
                </Link>
              </li>
              <li>
                <Link to="/notes" className="text-gray-600 hover:text-ocean-blue transition-colors">
                  Lecture Notes
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Connect</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-600 hover:text-ocean-blue transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-ocean-blue transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-ocean-blue transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6 text-center text-gray-500 text-sm">
          <p>&copy; {currentYear} SignSpeakSync. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
