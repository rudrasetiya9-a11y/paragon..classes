import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  GraduationCap, 
  Plus, 
  Users, 
  Clock, 
  IndianRupee,
  Calendar,
  Edit,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Batch, User } from "@shared/schema";
import { useEffect } from "react";

const batchSchema = z.object({
  name: z.string().min(1, "Batch name is required"),
  className: z.enum(["11th", "12th"]),
  schedule: z.string().min(1, "Schedule is required"),
  fee: z.string().min(1, "Fee is required"),
  isActive: z.boolean().default(true),
});

type BatchFormData = z.infer<typeof batchSchema>;

export default function BatchManagement() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

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

  const form = useForm<BatchFormData>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      name: "",
      className: "11th",
      schedule: "",
      fee: "",
      isActive: true,
    },
  });

  const { data: batches = [] } = useQuery<Batch[]>({
    queryKey: ["/api/batches"],
    retry: false,
  });

  const { data: students = [] } = useQuery<User[]>({
    queryKey: ["/api/students"],
    retry: false,
  });

  const createBatchMutation = useMutation({
    mutationFn: async (data: BatchFormData) => {
      await apiRequest('POST', '/api/batches', {
        name: data.name,
        className: data.className,
        schedule: data.schedule,
        fee: parseFloat(data.fee),
        isActive: data.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
      form.reset();
      setIsCreateDialogOpen(false);
      setEditingBatch(null);
      toast({
        title: "Batch Created",
        description: "New batch has been created successfully.",
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

  const updateBatchMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BatchFormData> }) => {
      await apiRequest('PATCH', `/api/batches/${id}`, {
        ...data,
        fee: data.fee ? parseFloat(data.fee) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
      toast({
        title: "Batch Updated",
        description: "Batch has been updated successfully.",
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

  const onSubmit = (data: BatchFormData) => {
    if (editingBatch) {
      updateBatchMutation.mutate({ id: editingBatch.id, data });
    } else {
      createBatchMutation.mutate(data);
    }
  };

  const handleEditBatch = (batch: Batch) => {
    setEditingBatch(batch);
    form.reset({
      name: batch.name,
      className: batch.className as "11th" | "12th",
      schedule: batch.schedule,
      fee: batch.fee,
      isActive: batch.isActive ?? true,
    });
    setIsCreateDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingBatch(null);
    form.reset();
  };

  const toggleBatchStatus = (batch: Batch) => {
    updateBatchMutation.mutate({
      id: batch.id,
      data: { isActive: !batch.isActive }
    });
  };

  const getStudentCount = (batchId: number) => {
    return students.filter(s => s.batchId === batchId).length;
  };

  const getBatchStats = () => {
    const activeBatches = batches.filter(b => b.isActive).length;
    const totalStudents = students.length;
    const class11Students = students.filter(s => {
      const batch = batches.find(b => b.id === s.batchId);
      return batch?.className === '11th';
    }).length;
    const class12Students = students.filter(s => {
      const batch = batches.find(b => b.id === s.batchId);
      return batch?.className === '12th';
    }).length;

    return { activeBatches, totalStudents, class11Students, class12Students };
  };

  const stats = getBatchStats();

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Batch Management" 
          subtitle="Manage physics batches and class schedules"
          actions={
            <Dialog open={isCreateDialogOpen} onOpenChange={handleCloseDialog}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Batch
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingBatch ? "Edit Batch" : "Create New Batch"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingBatch 
                      ? "Update batch details and settings"
                      : "Create a new physics batch for students"
                    }
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Class 11th Physics Morning" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="className"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select class" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="11th">Class 11th</SelectItem>
                              <SelectItem value="12th">Class 12th</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="schedule"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Schedule</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Mon, Wed, Fri - 4:00 PM" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Fee (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="2000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Active Status</FormLabel>
                            <div className="text-sm text-neutral-500">
                              Whether this batch is currently active
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={handleCloseDialog}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createBatchMutation.isPending || updateBatchMutation.isPending}
                      >
                        {createBatchMutation.isPending || updateBatchMutation.isPending
                          ? "Saving..." 
                          : editingBatch ? "Update Batch" : "Create Batch"
                        }
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
                    <GraduationCap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{stats.activeBatches}</p>
                    <p className="text-sm text-neutral-500">Active Batches</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{stats.totalStudents}</p>
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
          </div>

          {/* Batches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {batches.map((batch) => (
              <Card key={batch.id} className={`border ${batch.isActive ? 'border-neutral-200' : 'border-neutral-300 bg-neutral-50'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        batch.className === '11th' ? 'bg-primary/10' : 'bg-purple-100'
                      }`}>
                        <span className={`font-bold text-lg ${
                          batch.className === '11th' ? 'text-primary' : 'text-purple-600'
                        }`}>
                          {batch.className === '11th' ? '11' : '12'}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{batch.name}</CardTitle>
                        <CardDescription>Class {batch.className} Physics</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={batch.isActive ? "bg-secondary/10 text-secondary" : "bg-neutral-200 text-neutral-600"}>
                        {batch.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => handleEditBatch(batch)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 text-sm">
                      <Clock className="w-4 h-4 text-neutral-500" />
                      <span className="text-neutral-600">{batch.schedule}</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-sm">
                      <IndianRupee className="w-4 h-4 text-neutral-500" />
                      <span className="text-neutral-600">
                        ₹{parseFloat(batch.fee).toLocaleString('en-IN')} per month
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-sm">
                      <Users className="w-4 h-4 text-neutral-500" />
                      <span className="text-neutral-600">
                        {getStudentCount(batch.id)} students enrolled
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-sm">
                      <Calendar className="w-4 h-4 text-neutral-500" />
                      <span className="text-neutral-600">
                        Created {new Date(batch.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    
                    <div className="pt-2 border-t border-neutral-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600">Status</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleBatchStatus(batch)}
                          disabled={updateBatchMutation.isPending}
                          className="h-8 px-2"
                        >
                          {batch.isActive ? (
                            <ToggleRight className="w-5 h-5 text-secondary" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-neutral-400" />
                          )}
                          <span className="ml-2 text-xs">
                            {batch.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {batches.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <GraduationCap className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  No batches created yet
                </h3>
                <p className="text-neutral-500 mb-4">
                  Create your first batch to start organizing students by class and schedule.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Batch
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
