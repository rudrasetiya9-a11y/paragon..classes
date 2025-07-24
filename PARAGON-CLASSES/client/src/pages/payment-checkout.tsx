import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  IndianRupee, 
  Calendar, 
  ArrowLeft,
  CheckCircle,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Payment } from "@shared/schema";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

interface CheckoutFormProps {
  paymentId: number;
  amount: number;
}

const CheckoutForm = ({ paymentId, amount }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/`,
      },
    });

    setIsProcessing(false);

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Your fee payment has been processed successfully!",
      });
      // Redirect to dashboard after successful payment
      setTimeout(() => {
        setLocation("/");
      }, 1500);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full bg-primary hover:bg-primary/90"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Pay ₹{amount.toLocaleString('en-IN')}
          </>
        )}
      </Button>
    </form>
  );
};

export default function PaymentCheckout() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  
  // Extract payment ID from URL
  const path = window.location.pathname;
  const paymentId = parseInt(path.split('/').pop() || '0');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
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

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
    retry: false,
  });

  const payment = payments.find(p => p.id === paymentId);

  const createPaymentIntentMutation = useMutation({
    mutationFn: async ({ amount, paymentId }: { amount: number; paymentId: number }) => {
      const response = await apiRequest("POST", "/api/create-payment-intent", { 
        amount, 
        paymentId 
      });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (payment && user) {
      // Verify this payment belongs to the current user
      if (payment.studentId !== user.id) {
        toast({
          title: "Access Denied",
          description: "You can only pay for your own fees.",
          variant: "destructive",
        });
        setLocation("/");
        return;
      }

      // Check if payment is already paid
      if (payment.status === 'paid') {
        toast({
          title: "Already Paid",
          description: "This payment has already been completed.",
        });
        setLocation("/");
        return;
      }

      // Create payment intent
      createPaymentIntentMutation.mutate({
        amount: parseFloat(payment.amount),
        paymentId: payment.id,
      });
    }
  }, [payment, user]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show message if Stripe is not configured
  if (!stripePromise) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Payment Configuration Needed</CardTitle>
            <CardDescription>
              Online payment processing is not yet configured. Please contact the administrator to set up Stripe payment integration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Payment Not Found</h1>
            <p className="text-neutral-600 mb-4">
              The payment you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => setLocation("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (payment.status === 'paid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-secondary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Already Paid</h1>
            <p className="text-neutral-600 mb-4">
              This payment has already been completed successfully.
            </p>
            <Button onClick={() => setLocation("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <h1 className="text-lg font-medium text-neutral-900 mb-2">Initializing Payment</h1>
            <p className="text-neutral-600">
              Setting up secure payment processing...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="outline" onClick={() => setLocation("/")} size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Fee Payment</h1>
            <p className="text-neutral-600">Complete your monthly fee payment securely</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <IndianRupee className="w-5 h-5" />
                <span>Payment Summary</span>
              </CardTitle>
              <CardDescription>Review your payment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Student</span>
                <span className="font-medium">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.email
                  }
                </span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Amount</span>
                <span className="text-2xl font-bold text-neutral-900">
                  ₹{parseFloat(payment.amount).toLocaleString('en-IN')}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Due Date</span>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-neutral-500" />
                  <span>{formatDate(payment.dueDate)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Status</span>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-600 border-yellow-200">
                  {payment.status}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="bg-primary/5 p-4 rounded-lg">
                <h4 className="font-medium text-neutral-900 mb-2">Payment Method</h4>
                <div className="flex items-center space-x-2 text-sm text-neutral-600">
                  <CreditCard className="w-4 h-4" />
                  <span>Secure online payment via Stripe</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>
                Enter your payment information to complete the transaction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#1E40AF',
                    },
                  },
                }}
              >
                <CheckoutForm 
                  paymentId={payment.id} 
                  amount={parseFloat(payment.amount)} 
                />
              </Elements>
            </CardContent>
          </Card>
        </div>

        {/* Security Notice */}
        <Card className="mt-8 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900 mb-1">Secure Payment</h4>
                <p className="text-sm text-green-800">
                  Your payment is processed securely through Stripe. We never store your card details, 
                  and all transactions are encrypted with industry-standard security.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
