import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Monitor, 
  FileText, 
  Headphones,
  Menu,
  X,
  LogOut,
  LogIn,
  User,
  UserCircle,
  Settings,
  ChevronDown
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { user, userRole, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignIn = () => {
    navigate("/auth?tab=signin");
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      // Close the profile dropdown
      setIsProfileOpen(false);
      // Navigate to home page after a short delay
      setTimeout(() => {
        navigate("/");
      }, 500);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleProfileClick = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleProfileItemClick = (path: string) => {
    navigate(path);
    setIsProfileOpen(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close mobile menu when user signs out
  useEffect(() => {
    if (!user && isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [user, isMenuOpen]);

  // Render navigation links based on user role
  const renderNavLinks = () => {
    const commonLinks = [
      {
        to: "/sign-translator",
        icon: <Monitor className="w-5 h-5" />,
        text: "Sign Translator"
      },
      {
        to: "/video-captioning",
        icon: <Headphones className="w-5 h-5" />,
        text: "Video Captioning"
      }
    ];

    const studentLinks = [
      ...commonLinks,
      {
        to: "/notes",
        icon: <FileText className="w-5 h-5" />,
        text: "My Notes"
      }
    ];

    const teacherLinks = [
      ...commonLinks,
      {
        to: "/notes",
        icon: <FileText className="w-5 h-5" />,
        text: "All Notes"
      },
      {
        to: "/students",
        icon: <User className="w-5 h-5" />,
        text: "Students"
      }
    ];

    return userRole === 'teacher' ? teacherLinks : studentLinks;
  };

  return (
    <header className="w-full bg-white shadow-sm py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <div className="bg-gradient-to-r from-ocean-blue to-purple rounded-full w-8 h-8 flex items-center justify-center">
            <span className="text-white font-bold">S</span>
          </div>
          <span className="font-bold text-xl hidden md:block">SignSpeakSync</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {user && renderNavLinks().map((link) => (
            <Link 
              key={link.to} 
              to={link.to} 
              className="flex items-center space-x-2 text-gray-700 hover:text-ocean-blue transition-colors"
            >
              {link.icon}
              <span>{link.text}</span>
            </Link>
          ))}
          
          {user ? (
            <div className="flex items-center space-x-4">
              <DropdownMenu open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <UserCircle className="h-6 w-6 text-ocean-blue" />
                    <span className="sr-only">Open user menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" ref={profileRef}>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.email}</p>
                      <p className="text-xs leading-none text-muted-foreground capitalize">
                        {userRole}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleProfileItemClick("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleProfileItemClick("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="text-red-600 focus:text-red-600"
                    disabled={isSigningOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button 
              className="bg-ocean-blue hover:bg-blue-600 text-white"
              onClick={handleSignIn}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-gray-700"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-md mt-4 py-4 px-4">
          <nav className="flex flex-col space-y-4">
            {user && renderNavLinks().map((link) => (
              <Link 
                key={link.to} 
                to={link.to} 
                className="flex items-center space-x-2 text-gray-700 hover:text-ocean-blue transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.icon}
                <span>{link.text}</span>
              </Link>
            ))}
            
            {user ? (
              <>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center space-x-2 text-gray-700 py-2">
                    <UserCircle className="w-5 h-5 text-ocean-blue" />
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <div className="text-sm text-gray-500 capitalize mb-4">
                    {userRole || 'student'}
                  </div>
                  <Link 
                    to="/profile" 
                    className="flex items-center space-x-2 text-gray-700 hover:text-ocean-blue transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    <span>Profile</span>
                  </Link>
                  <Link 
                    to="/settings" 
                    className="flex items-center space-x-2 text-gray-700 hover:text-ocean-blue transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    {isSigningOut ? "Signing out..." : "Sign out"}
                  </Button>
                </div>
              </>
            ) : (
              <Button 
                className="w-full bg-ocean-blue hover:bg-blue-600 text-white"
                onClick={handleSignIn}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
