import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StatsCard from "@/components/stats-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  BookOpen, 
  Bell,
  Download,
  FileText,
  Clock,
  IndianRupee
} from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { StudyMaterial, Notification, Payment } from "@shared/schema";

export default function StudentDashboard() {
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

  const { data: studyMaterials = [] } = useQuery<StudyMaterial[]>({
    queryKey: ["/api/study-materials"],
    retry: false,
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
    retry: false,
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const recentMaterials = studyMaterials.slice(0, 5);
  const recentNotifications = notifications.slice(0, 3);
  const latestPayment = payments[0];
  const unreadNotifications = notifications.filter(n => 
    new Date(n.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  const getBatchName = (batchId: number | null) => {
    if (batchId === 1) return "Class 11th Physics";
    if (batchId === 2) return "Class 12th Physics";
    return "No Batch Assigned";
  };

  const getNextDueDate = () => {
    const pendingPayment = payments.find(p => p.status === 'pending');
    if (pendingPayment) {
      return new Date(pendingPayment.dueDate).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    return "No pending dues";
  };

  const handleDownload = async (materialId: number, fileName: string) => {
    try {
      const response = await fetch(`/api/study-materials/${materialId}/download`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Started",
        description: `${fileName} is being downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Student Dashboard" 
          subtitle="Access your study materials and track progress"
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Student Info Card */}
          <Card className="mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Welcome, {user.firstName || user.email}!
                  </h3>
                  <p className="text-neutral-600">
                    {getBatchName(user.batchId)} • PARAGON CLASSES
                  </p>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  {user.role === 'student' ? 'Student' : 'Teacher'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatsCard
              title="Fee Status"
              value={latestPayment?.status === 'paid' ? 'Paid' : 'Pending'}
              icon={latestPayment?.status === 'paid' ? CheckCircle : IndianRupee}
              iconColor={latestPayment?.status === 'paid' ? "bg-secondary/10 text-secondary" : "bg-accent/10 text-accent"}
              change={{
                value: getNextDueDate(),
                label: latestPayment?.status === 'paid' ? 'Next due' : 'Due date'
              }}
            />
            
            <StatsCard
              title="Study Materials"
              value={studyMaterials.length}
              icon={BookOpen}
              iconColor="bg-primary/10 text-primary"
              change={{
                value: `${recentMaterials.length}`,
                label: "available materials"
              }}
            />
            
            <StatsCard
              title="Notifications"
              value={notifications.length}
              icon={Bell}
              iconColor="bg-accent/10 text-accent"
              change={{
                value: `${unreadNotifications}`,
                label: "recent updates"
              }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Recent Study Materials */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Study Materials</CardTitle>
                <CardDescription>Latest materials uploaded for your batch</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentMaterials.map((material) => (
                    <div key={material.id} className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50">
                      <div className="flex items-center space-x-3 flex-1">
                        <FileText className="w-5 h-5 text-red-500" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-neutral-900 truncate">{material.title}</p>
                          <div className="flex items-center space-x-2 text-sm text-neutral-500">
                            <span>{formatFileSize(material.fileSize)}</span>
                            <span>•</span>
                            <span>
                              <Clock className="w-3 h-3 inline mr-1" />
                              {new Date(material.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-primary hover:bg-primary/90"
                        onClick={() => handleDownload(material.id, material.fileName)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                  {studyMaterials.length === 0 && (
                    <div className="text-center py-6 text-neutral-500">
                      No study materials available yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Notifications</CardTitle>
                <CardDescription>Latest announcements from your teacher</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentNotifications.map((notification) => (
                    <div key={notification.id} className="p-3 bg-neutral-50 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                          <Bell className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-neutral-900">{notification.title}</h4>
                          <p className="text-sm text-neutral-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-neutral-500 mt-2">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="text-center py-6 text-neutral-500">
                      No notifications yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fee Status Card */}
          {latestPayment && (
            <Card>
              <CardHeader>
                <CardTitle>Fee Status</CardTitle>
                <CardDescription>Your current fee payment status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      latestPayment.status === 'paid' ? 'bg-secondary/10' : 'bg-accent/10'
                    }`}>
                      {latestPayment.status === 'paid' ? (
                        <CheckCircle className="w-6 h-6 text-secondary" />
                      ) : (
                        <IndianRupee className="w-6 h-6 text-accent" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">
                        ₹{parseFloat(latestPayment.amount).toLocaleString('en-IN')}
                      </p>
                      <p className="text-sm text-neutral-500">
                        Due: {new Date(latestPayment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={
                      latestPayment.status === 'paid' 
                        ? "bg-secondary/10 text-secondary" 
                        : "bg-yellow-100 text-yellow-600"
                    }>
                      {latestPayment.status === 'paid' ? 'Paid' : 'Pending'}
                    </Badge>
                    {latestPayment.status === 'pending' && (
                      <Button className="mt-2" size="sm">
                        Pay Now
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
