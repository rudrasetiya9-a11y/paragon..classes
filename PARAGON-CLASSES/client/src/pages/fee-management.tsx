import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import PaymentTable from "@/components/payment-table";
import StatsCard from "@/components/stats-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  IndianRupee, 
  TrendingUp, 
  AlertTriangle, 
  Users,
  Plus,
  Filter
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Payment, User, Batch } from "@shared/schema";
import { useEffect } from "react";

const paymentSchema = z.object({
  studentId: z.string().min(1, "Student selection is required"),
  batchId: z.string().min(1, "Batch selection is required"),
  amount: z.string().min(1, "Amount is required"),
  method: z.enum(["online", "cash"]),
  dueDate: z.string().min(1, "Due date is required"),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentWithStudent extends Payment {
  student?: User;
  batch?: Batch;
}

export default function FeeManagement() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterBatch, setFilterBatch] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      method: "cash",
    },
  });

  const { data: payments = [] } = useQuery<PaymentWithStudent[]>({
    queryKey: ["/api/payments"],
    retry: false,
  });

  const { data: students = [] } = useQuery<User[]>({
    queryKey: ["/api/students"],
    retry: false,
  });

  const { data: batches = [] } = useQuery<Batch[]>({
    queryKey: ["/api/batches"],
    retry: false,
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      await apiRequest('POST', '/api/payments', {
        studentId: data.studentId,
        batchId: parseInt(data.batchId),
        amount: parseFloat(data.amount),
        method: data.method,
        dueDate: new Date(data.dueDate).toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      form.reset();
      setIsCreateDialogOpen(false);
      toast({
        title: "Payment Created",
        description: "Payment record has been created successfully.",
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

  // Add student and batch info to payments
  const paymentsWithDetails = payments.map(payment => ({
    ...payment,
    student: students.find(s => s.id === payment.studentId),
    batch: batches.find(b => b.id === payment.batchId),
  }));

  // Filter payments
  const filteredPayments = paymentsWithDetails.filter(payment => {
    const statusMatch = filterStatus === "all" || payment.status === filterStatus;
    const batchMatch = filterBatch === "all" || payment.batchId.toString() === filterBatch;
    return statusMatch && batchMatch;
  });

  // Calculate stats
  const totalRevenue = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const paidThisMonth = payments
    .filter(p => {
      const paymentDate = p.paidAt || p.createdAt;
      const isThisMonth = paymentDate && 
        new Date(paymentDate).getMonth() === new Date().getMonth() &&
        new Date(paymentDate).getFullYear() === new Date().getFullYear();
      return p.status === 'paid' && isThisMonth;
    }).length;

  const onSubmit = (data: PaymentFormData) => {
    createPaymentMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Fee Management" 
          subtitle="Track and manage student fee payments"
          actions={
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create Payment Record</DialogTitle>
                  <DialogDescription>
                    Add a new payment record for a student
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select student" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {students.map((student) => (
                                <SelectItem key={student.id} value={student.id}>
                                  {student.firstName && student.lastName
                                    ? `${student.firstName} ${student.lastName}`
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
                      name="batchId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select batch" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
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

                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="2000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="online">Online</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createPaymentMutation.isPending}
                      >
                        {createPaymentMutation.isPending ? "Creating..." : "Create Payment"}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Revenue"
              value={`₹${totalRevenue.toLocaleString('en-IN')}`}
              icon={IndianRupee}
              iconColor="bg-secondary/10 text-secondary"
              change={{
                value: `${paidThisMonth}`,
                label: "payments this month"
              }}
            />
            <StatsCard
              title="Pending Fees"
              value={`₹${pendingAmount.toLocaleString('en-IN')}`}
              icon={AlertTriangle}
              iconColor="bg-accent/10 text-accent"
              change={{
                value: `${payments.filter(p => p.status === 'pending').length}`,
                label: "pending payments"
              }}
            />
            <StatsCard
              title="Collection Rate"
              value={`${Math.round((payments.filter(p => p.status === 'paid').length / Math.max(payments.length, 1)) * 100)}%`}
              icon={TrendingUp}
              iconColor="bg-primary/10 text-primary"
              change={{
                value: "+5%",
                label: "from last month"
              }}
            />
            <StatsCard
              title="Active Students"
              value={students.length}
              icon={Users}
              iconColor="bg-purple-100 text-purple-600"
              change={{
                value: "+2",
                label: "new students"
              }}
            />
          </div>

          {/* Filters and Payments Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment Records</CardTitle>
                  <CardDescription>Manage all student payment records</CardDescription>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-neutral-500" />
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Select value={filterBatch} onValueChange={setFilterBatch}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Batches</SelectItem>
                      {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id.toString()}>
                          {batch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <PaymentTable payments={filteredPayments} />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
