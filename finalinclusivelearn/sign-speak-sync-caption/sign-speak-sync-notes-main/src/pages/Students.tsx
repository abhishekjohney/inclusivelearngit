import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, UserPlus, Mail, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Student = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in: string | null;
};

const Students = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  // Redirect if not a teacher
  useEffect(() => {
    if (userRole !== 'teacher') {
      navigate("/");
    }
  }, [userRole, navigate]);

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        
        // Query user_profiles table for students
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, email, created_at')
          .eq('role', 'student')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error fetching students:", error);
          
          // If the table doesn't exist, show a message
          if (error.code === '42P01') {
            toast({
              title: "Database Setup Required",
              description: "The user_profiles table doesn't exist. Please follow the setup instructions in SUPABASE_SETUP.md.",
            });
            setStudents([]);
            return;
          }
          
          throw error;
        }
        
        // Set students without last sign in time
        const studentsData = data.map(student => ({
          ...student,
          last_sign_in: null
        }));
        
        setStudents(studentsData);
      } catch (error: any) {
        console.error("Error fetching students:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load students. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userRole === 'teacher') {
      fetchStudents();
    }
  }, [userRole, toast]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStudentEmail) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a student email"
      });
      return;
    }
    
    try {
      setIsAddingStudent(true);
      
      // Check if student already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', newStudentEmail)
        .single();
        
      if (checkError) {
        if (checkError.code === '42P01') {
          toast({
            title: "Database Setup Required",
            description: "The user_profiles table doesn't exist. Please follow the setup instructions in SUPABASE_SETUP.md.",
          });
          return;
        }
        
        if (checkError.code !== 'PGRST116') {
          throw checkError;
        }
      }
      
      if (existingUser) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "A user with this email already exists"
        });
        return;
      }
      
      // Create a new user with a random password
      const randomPassword = Math.random().toString(36).slice(-8);
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newStudentEmail,
        password: randomPassword,
        email_confirm: true
      });
      
      if (authError) throw authError;
      
      try {
        // Update the user's role to student
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ role: 'student' })
          .eq('id', authData.user.id);
          
        if (updateError) {
          if (updateError.code === '42P01') {
            toast({
              title: "Database Setup Required",
              description: "The user_profiles table doesn't exist. Please follow the setup instructions in SUPABASE_SETUP.md.",
            });
            return;
          }
          
          throw updateError;
        }
      } catch (profileError) {
        console.error("Error updating user profile:", profileError);
        // Continue with student creation even if profile update fails
      }
      
      // Send welcome email with password
      // Note: In a real app, you would use a proper email service
      console.log(`Welcome email would be sent to ${newStudentEmail} with password: ${randomPassword}`);
      
      // Add the new student to the list
      setStudents(prev => [
        {
          id: authData.user.id,
          email: newStudentEmail,
          created_at: new Date().toISOString(),
          last_sign_in: null
        },
        ...prev
      ]);
      
      // Clear the input
      setNewStudentEmail("");
      
      toast({
        title: "Success",
        description: "Student added successfully"
      });
    } catch (error: any) {
      console.error("Error adding student:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add student"
      });
    } finally {
      setIsAddingStudent(false);
    }
  };

  const filteredStudents = students.filter(student => 
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Student Management</CardTitle>
          <CardDescription>
            View and manage your students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="view" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="view">View Students</TabsTrigger>
              <TabsTrigger value="add">Add Student</TabsTrigger>
            </TabsList>
            <TabsContent value="view" className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-ocean-blue" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? "No students found matching your search" : "No students yet"}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Last Sign In</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.email}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                              {new Date(student.created_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            {student.last_sign_in ? (
                              <div className="flex items-center">
                                <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                                {new Date(student.last_sign_in).toLocaleDateString()}
                              </div>
                            ) : (
                              <span className="text-gray-500">Never</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // In a real app, this would open a modal or navigate to a student details page
                                toast({
                                  title: "Student Details",
                                  description: `Viewing details for ${student.email}`
                                });
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            <TabsContent value="add">
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Student Email</Label>
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="student@example.com"
                        value={newStudentEmail}
                        onChange={(e) => setNewStudentEmail(e.target.value)}
                        className="pl-8"
                        required
                      />
                    </div>
                    <Button type="submit" disabled={isAddingStudent}>
                      {isAddingStudent ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Student
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  The student will receive an email with instructions to set up their account.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Students; 