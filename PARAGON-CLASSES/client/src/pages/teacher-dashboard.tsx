import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StatsCard from "@/components/stats-card";
import PaymentTable from "@/components/payment-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  IndianRupee, 
  AlertTriangle, 
  BookOpen,
  Upload,
  UserPlus,
  Megaphone,
  BarChart3,
  Clock
} from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function TeacherDashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

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

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    retry: false,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["/api/payments"],
    retry: false,
  });

  const { data: batches = [] } = useQuery({
    queryKey: ["/api/batches"],
    retry: false,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const recentPayments = payments.slice(0, 5);
  const recentNotifications = notifications.slice(0, 3);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const quickActions = [
    {
      title: "Upload Material",
      description: "Add new study content",
      icon: Upload,
      color: "bg-primary text-white hover:bg-primary/90",
      href: "/materials"
    },
    {
      title: "Add Student",
      description: "Register new student",
      icon: UserPlus,
      color: "bg-secondary text-white hover:bg-secondary/90",
      href: "/students"
    },
    {
      title: "Send Notice",
      description: "Notify all students",
      icon: Megaphone,
      color: "bg-purple-600 text-white hover:bg-purple-700",
      href: "/notifications"
    },
    {
      title: "View Reports",
      description: "Analytics & insights",
      icon: BarChart3,
      color: "bg-orange-600 text-white hover:bg-orange-700",
      href: "/fees"
    }
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Teacher Dashboard" 
          subtitle="Manage your physics coaching classes"
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Students"
              value={stats?.totalStudents || 0}
              icon={Users}
              iconColor="bg-primary/10 text-primary"
              change={{
                value: "+2",
                label: "this month",
                positive: true
              }}
            />
            <StatsCard
              title="Monthly Revenue"
              value={formatCurrency(stats?.monthlyRevenue || 0)}
              icon={IndianRupee}
              iconColor="bg-secondary/10 text-secondary"
              change={{
                value: "+12%",
                label: "from last month",
                positive: true
              }}
            />
            <StatsCard
              title="Pending Fees"
              value={formatCurrency(stats?.pendingFees || 0)}
              icon={AlertTriangle}
              iconColor="bg-accent/10 text-accent"
              change={{
                value: `${payments.filter(p => p.status === 'pending').length} students`,
                label: "pending"
              }}
            />
            <StatsCard
              title="Study Materials"
              value={stats?.materialsCount || 0}
              icon={BookOpen}
              iconColor="bg-purple-100 text-purple-600"
              change={{
                value: "+4",
                label: "this week",
                positive: true
              }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Batch Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Batch Overview</CardTitle>
                  <CardDescription>Active physics batches</CardDescription>
                </div>
                <Link href="/batches">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {batches.map((batch) => (
                    <div key={batch.id} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            batch.className === '11th' ? 'bg-primary/10' : 'bg-purple-100'
                          }`}>
                            <span className={`font-semibold text-sm ${
                              batch.className === '11th' ? 'text-primary' : 'text-purple-600'
                            }`}>
                              {batch.className === '11th' ? '11' : '12'}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-neutral-900">{batch.name}</h4>
                            <p className="text-sm text-neutral-500">{batch.schedule}</p>
                          </div>
                        </div>
                        <Badge className="bg-secondary/10 text-secondary">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-500">
                          Fee: <span className="font-medium text-neutral-900">₹{parseFloat(batch.fee).toLocaleString('en-IN')}</span>
                        </span>
                        <span className="text-neutral-500">
                          Students: <span className="font-medium text-secondary">Active</span>
                        </span>
                      </div>
                    </div>
                  ))}
                  {batches.length === 0 && (
                    <div className="text-center py-4 text-neutral-500">
                      No batches found. <Link href="/batches"><Button variant="link" className="p-0">Create your first batch</Button></Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Notifications */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Notifications</CardTitle>
                  <CardDescription>Latest announcements sent</CardDescription>
                </div>
                <Link href="/notifications">
                  <Button className="bg-primary hover:bg-primary/90" size="sm">
                    <Megaphone className="w-4 h-4 mr-2" />
                    Send New
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentNotifications.map((notification) => (
                    <div key={notification.id} className="flex items-start space-x-3 p-3 bg-neutral-50 rounded-lg">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                        <Megaphone className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-neutral-900">{notification.title}</h4>
                        <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{notification.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-neutral-500">
                            Sent to: {notification.targetBatchId ? `Batch ${notification.targetBatchId}` : 'All Students'}
                          </span>
                          <span className="text-xs text-neutral-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="text-center py-4 text-neutral-500">
                      No notifications sent yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Payments */}
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Latest fee payments from students</CardDescription>
              </div>
              <Link href="/fees">
                <Button variant="outline" size="sm">View All Payments</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <PaymentTable payments={recentPayments} />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} href={action.href}>
                  <button className={`${action.color} p-4 rounded-xl transition-colors text-left w-full`}>
                    <div className="flex items-center space-x-3">
                      <Icon className="w-6 h-6" />
                      <span className="font-medium">{action.title}</span>
                    </div>
                    <p className="text-sm opacity-90 mt-2">{action.description}</p>
                  </button>
                </Link>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
