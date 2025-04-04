import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define user roles
export type UserRole = 'student' | 'teacher';

// Extend the User type to include role
interface ExtendedUser extends User {
  role?: UserRole;
}

interface AuthContextType {
  session: Session | null;
  user: ExtendedUser | null;
  userRole: UserRole | null;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Function to fetch user role from the database
  const fetchUserRole = async (userId: string) => {
    try {
      console.log("Fetching user role for:", userId);
      
      // First try to fetch from user_profiles table
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error("Error fetching user role from user_profiles:", error);
        
        // If the table doesn't exist, try to create it
        if (error.code === '42P01') { // Table doesn't exist
          console.log("user_profiles table doesn't exist, defaulting to 'student' role");
          return 'student' as UserRole;
        }
        
        // If the user doesn't exist in the table, try to create a profile
        if (error.code === 'PGRST116') { // No rows returned
          console.log("User not found in user_profiles, creating profile");
          
          // Get user email from auth.users
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error("Error getting user data:", userError);
            return 'student' as UserRole;
          }
          
          // Create user profile with a delay to avoid race conditions
          setTimeout(async () => {
            try {
              console.log("Attempting to create user profile for:", userId);
              const { error: insertError } = await supabase
                .from('user_profiles')
                .insert([
                  { 
                    id: userId,
                    email: userData.user.email,
                    role: 'student'
                  }
                ]);
              
              if (insertError) {
                console.error("Error creating user profile:", insertError);
                // If we get a duplicate key error, the profile was created by the trigger
                if (insertError.code === '23505') {
                  console.log("Profile already exists (created by trigger)");
                }
              } else {
                console.log("User profile created successfully");
              }
            } catch (profileError) {
              console.error("Exception creating user profile:", profileError);
            }
          }, 2000); // Increased delay to 2 seconds
          
          return 'student' as UserRole;
        }
        
        return null;
      }
      
      console.log("User role data:", data);
      return data?.role as UserRole || 'student' as UserRole;
    } catch (error) {
      console.error("Exception fetching user role:", error);
      return 'student' as UserRole;
    }
  };

  // Set up auth state listener
  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        setIsLoading(true);
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log("Initial session check:", initialSession ? "Found" : "Not found");
        
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user as ExtendedUser);
          
          // Fetch user role
          const role = await fetchUserRole(initialSession.user.id);
          console.log("Initial user role:", role);
          setUserRole(role);
        } else {
          setSession(null);
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
        // Reset state on error
        setSession(null);
        setUser(null);
        setUserRole(null);
      } finally {
        // Ensure loading state is reset with a timeout
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      }
    };
    
    getInitialSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession?.user?.email);
        
        try {
          if (event === 'SIGNED_IN' && currentSession) {
            setSession(currentSession);
            setUser(currentSession.user as ExtendedUser);
            
            // Fetch user role
            const role = await fetchUserRole(currentSession.user.id);
            console.log("User role on sign in:", role);
            setUserRole(role);
          } else if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
            setUserRole(null);
          } else if (event === 'TOKEN_REFRESHED' && currentSession) {
            setSession(currentSession);
            setUser(currentSession.user as ExtendedUser);
            
            // Fetch user role if not already set
            if (!userRole) {
              const role = await fetchUserRole(currentSession.user.id);
              console.log("User role on token refresh:", role);
              setUserRole(role);
            }
          }
        } catch (error) {
          console.error("Error handling auth state change:", error);
          // Reset state on error
          setSession(null);
          setUser(null);
          setUserRole(null);
        } finally {
          // Ensure loading state is reset with a timeout
          setTimeout(() => {
            setIsLoading(false);
          }, 1000);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Explicitly set the user and session after successful sign in
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user as ExtendedUser);
        
        // Fetch user role
        const role = await fetchUserRole(data.session.user.id);
        setUserRole(role);
      }
      
      toast({
        title: "Success",
        description: "You have been signed in successfully.",
      });
    } catch (error: any) {
      console.error("Error signing in:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to sign in",
      });
      throw error;
    } finally {
      // Ensure loading state is reset with a timeout
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };

  const signUpWithEmail = async (email: string, password: string, role: UserRole) => {
    try {
      setIsLoading(true);
      
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?tab=signin`,
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        // We'll let the trigger handle profile creation instead of doing it here
        // This avoids race conditions and database errors
        console.log("User created successfully:", data.user.id);
        
        // Set the user role in state for immediate use
        setUserRole(role);
      }
      
      toast({
        title: "Success",
        description: "Your account has been created successfully. Please check your email to verify your account.",
      });
    } catch (error: any) {
      console.error("Error signing up:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to sign up",
      });
      throw error;
    } finally {
      // Ensure loading state is reset with a timeout
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };

  const signOut = async () => {
    try {
      console.log("Starting sign out process");
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Supabase sign out error:", error);
        throw error;
      }
      
      console.log("Supabase sign out successful, cleaning up state");
      // Explicitly set user and session to null
      setSession(null);
      setUser(null);
      setUserRole(null);
      
      toast({
        title: "Success",
        description: "You have been signed out successfully.",
      });
    } catch (error: any) {
      console.error("Error in sign out process:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to sign out",
      });
      throw error;
    } finally {
      // Ensure loading state is reset with a timeout
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };

  const value = {
    session,
    user,
    userRole,
    isLoading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
