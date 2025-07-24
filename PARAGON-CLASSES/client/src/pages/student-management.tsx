import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter,
  GraduationCap,
  Mail,
  Calendar,
  MoreHorizontal
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, Batch } from "@shared/schema";
import { useEffect } from "react";

const updateRoleSchema = z.object({
  userId: z.string().min(1, "User selection is required"),
  role: z.enum(["teacher", "student"]),
  batchId: z.string().optional(),
});

type UpdateRoleFormData = z.infer<typeof updateRoleSchema>;

export default function StudentManagement() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBatch, setFilterBatch] = useState<string>("all");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  // Redirect if not authenticated or not teacher
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'teacher')) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  const form = useForm<UpdateRoleFormData>({
    resolver: zodResolver(updateRoleSchema),
    defaultValues: {
      role: "student",
    },
  });

  const { data: students = [] } = useQuery<User[]>({
    queryKey: ["/api/students"],
    retry: false,
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/auth/users"], 
    queryFn: async () => {
      // This would need to be implemented on the server side
      // For now, we'll use students data
      return students;
    },
    enabled: false, // Disable for now since we don't have this endpoint
  });

  const { data: batches = [] } = useQuery<Batch[]>({
    queryKey: ["/api/batches"],
    retry: false,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (data: UpdateRoleFormData) => {
      await apiRequest('POST', '/api/auth/setup-role', {
        userId: data.userId,
        role: data.role,
        batchId: data.batchId ? parseInt(data.batchId) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      form.reset();
      setIsAssignDialogOpen(false);
      toast({
        title: "User Updated",
        description: "User role and batch have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchTerm || 
      (student.firstName && student.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.lastName && student.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesBatch = filterBatch === "all" || 
      (filterBatch === "unassigned" && !student.batchId) ||
      (student.batchId && student.batchId.toString() === filterBatch);
    
    return matchesSearch && matchesBatch;
  });

  const getBatchName = (batchId: number | null) => {
    if (!batchId) return "Unassigned";
    const batch = batches.find(b => b.id === batchId);
    return batch?.name || `Batch ${batchId}`;
  };

  const getBatchBadge = (batchId: number | null) => {
    if (!batchId) {
      return <Badge variant="outline">Unassigned</Badge>;
    }
    const batch = batches.find(b => b.id === batchId);
    if (batch?.className === '11th') {
      return <Badge className="bg-primary/10 text-primary">Class 11th</Badge>;
    }
    if (batch?.className === '12th') {
      return <Badge className="bg-purple-100 text-purple-600">Class 12th</Badge>;
    }
    return <Badge className="bg-secondary/10 text-secondary">{getBatchName(batchId)}</Badge>;
  };

  const onSubmit = (data: UpdateRoleFormData) => {
    updateRoleMutation.mutate(data);
  };

  const getStudentStats = () => {
    const class11Students = students.filter(s => {
      const batch = batches.find(b => b.id === s.batchId);
      return batch?.className === '11th';
    }).length;
    
    const class12Students = students.filter(s => {
      const batch = batches.find(b => b.id === s.batchId);
      return batch?.className === '12th';
    }).length;
    
    const unassignedStudents = students.filter(s => !s.batchId).length;
    
    return { class11Students, class12Students, unassignedStudents };
  };

  const stats = getStudentStats();

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Student Management" 
          subtitle="Manage student registrations and batch assignments"
          actions={
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign Student
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Assign Student to Batch</DialogTitle>
                  <DialogDescription>
                    Assign a registered user to a student role and batch
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>User</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select user to assign" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {/* Note: This would need all users, not just students */}
                              {students.map((student) => (
                                <SelectItem key={student.id} value={student.id}>
                                  {student.firstName && student.lastName
                                    ? `${student.firstName} ${student.lastName} (${student.email})`
                                    : student.email
                                  }
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="teacher">Teacher</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="batchId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select batch" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">No Batch</SelectItem>
                              {batches.map((batch) => (
                                <SelectItem key={batch.id} value={batch.id.toString()}>
                                  {batch.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAssignDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={updateRoleMutation.isPending}
                      >
                        {updateRoleMutation.isPending ? "Assigning..." : "Assign Student"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          }
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{students.length}</p>
                    <p className="text-sm text-neutral-500">Total Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-primary font-bold">11</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{stats.class11Students}</p>
                    <p className="text-sm text-neutral-500">Class 11th</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 font-bold">12</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{stats.class12Students}</p>
                    <p className="text-sm text-neutral-500">Class 12th</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{stats.unassignedStudents}</p>
                    <p className="text-sm text-neutral-500">Unassigned</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Students Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Students</CardTitle>
                  <CardDescription>Manage student batch assignments and details</CardDescription>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-neutral-500" />
                    <Select value={filterBatch} onValueChange={setFilterBatch}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Batches</SelectItem>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {batches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id.toString()}>
                            {batch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={student.profileImageUrl || undefined} />
                            <AvatarFallback>
                              {(student.firstName?.[0] || '') + (student.lastName?.[0] || '')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-neutral-900">
                              {student.firstName && student.lastName
                                ? `${student.firstName} ${student.lastName}`
                                : 'Name not set'
                              }
                            </p>
                            <p className="text-sm text-neutral-500">Student ID: {student.id.slice(-8)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-neutral-400" />
                          <span>{student.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getBatchBadge(student.batchId)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 text-sm text-neutral-500">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(student.createdAt).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredStudents.length === 0 && (
                <div className="text-center py-8 text-neutral-500">
                  No students found matching your criteria
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
