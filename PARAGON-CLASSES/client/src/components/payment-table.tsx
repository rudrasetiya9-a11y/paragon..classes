import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Payment, User } from "@shared/schema";

interface PaymentWithStudent extends Payment {
  student?: User;
}

interface PaymentTableProps {
  payments: PaymentWithStudent[];
  showStudentInfo?: boolean;
}

export default function PaymentTable({ payments, showStudentInfo = true }: PaymentTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const markPaidMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      await apiRequest('PATCH', `/api/payments/${paymentId}/status`, { status: 'paid' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      toast({
        title: "Payment Updated",
        description: "Payment has been marked as paid successfully.",
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-secondary/10 text-secondary">Paid</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-600 border-yellow-200">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'online':
        return <Badge className="bg-primary/10 text-primary">Online</Badge>;
      case 'cash':
        return <Badge className="bg-orange-100 text-orange-600">Cash</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200">
            {showStudentInfo && (
              <th className="text-left py-3 px-4 font-medium text-neutral-500 text-sm">Student</th>
            )}
            <th className="text-left py-3 px-4 font-medium text-neutral-500 text-sm">Amount</th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500 text-sm">Method</th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500 text-sm">Status</th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500 text-sm">Due Date</th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500 text-sm">Paid Date</th>
            <th className="text-left py-3 px-4 font-medium text-neutral-500 text-sm">Action</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="border-b border-neutral-100 hover:bg-neutral-50">
              {showStudentInfo && (
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={payment.student?.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {(payment.student?.firstName?.[0] || '') + (payment.student?.lastName?.[0] || '')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-neutral-900">
                      {payment.student?.firstName && payment.student?.lastName
                        ? `${payment.student.firstName} ${payment.student.lastName}`
                        : payment.student?.email || 'Unknown Student'
                      }
                    </span>
                  </div>
                </td>
              )}
              <td className="py-3 px-4 font-medium text-neutral-900">
                ₹{parseFloat(payment.amount).toLocaleString('en-IN')}
              </td>
              <td className="py-3 px-4">
                {getMethodBadge(payment.method)}
              </td>
              <td className="py-3 px-4">
                {getStatusBadge(payment.status)}
              </td>
              <td className="py-3 px-4 text-sm text-neutral-600">
                {formatDate(payment.dueDate)}
              </td>
              <td className="py-3 px-4 text-sm text-neutral-600">
                {formatDate(payment.paidAt)}
              </td>
              <td className="py-3 px-4">
                {payment.status === 'pending' && payment.method === 'cash' ? (
                  <Button
                    size="sm"
                    className="bg-secondary hover:bg-secondary/90"
                    onClick={() => markPaidMutation.mutate(payment.id)}
                    disabled={markPaidMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Mark Paid
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {payments.length === 0 && (
        <div className="text-center py-8 text-neutral-500">
          No payments found
        </div>
      )}
    </div>
  );
}
