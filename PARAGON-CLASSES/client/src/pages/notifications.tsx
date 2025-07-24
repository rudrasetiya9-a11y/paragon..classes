import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import NotificationForm from "@/components/notification-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Clock, 
  Users, 
  Megaphone,
  MessageSquare
} from "lucide-react";
import type { Notification, Batch } from "@shared/schema";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Notifications() {
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

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  const { data: batches = [] } = useQuery<Batch[]>({
    queryKey: ["/api/batches"],
    retry: false,
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const isTeacher = user.role === 'teacher';

  const getBatchName = (batchId: number | null) => {
    if (!batchId) return "All Students";
    const batch = batches.find(b => b.id === batchId);
    return batch?.name || `Batch ${batchId}`;
  };

  const getNotificationIcon = (targetBatchId: number | null) => {
    if (!targetBatchId) {
      return (
        <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
          <Users className="w-5 h-5 text-secondary" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
        <Megaphone className="w-5 h-5 text-primary" />
      </div>
    );
  };

  const getTargetBadge = (targetBatchId: number | null) => {
    if (!targetBatchId) {
      return <Badge className="bg-secondary/10 text-secondary">All Students</Badge>;
    }
    const batch = batches.find(b => b.id === targetBatchId);
    if (batch?.className === '11th') {
      return <Badge className="bg-primary/10 text-primary">Class 11th</Badge>;
    }
    if (batch?.className === '12th') {
      return <Badge className="bg-purple-100 text-purple-600">Class 12th</Badge>;
    }
    return <Badge variant="outline">{getBatchName(targetBatchId)}</Badge>;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      return notificationDate.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Notifications" 
          subtitle={isTeacher ? "Send announcements to students" : "View announcements from your teacher"}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Notification Form - Only for Teachers */}
            {isTeacher && (
              <div className="lg:col-span-1">
                <NotificationForm />
              </div>
            )}

            {/* Notifications List */}
            <div className={isTeacher ? "lg:col-span-2" : "lg:col-span-3"}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="w-5 h-5" />
                    <span>{isTeacher ? "Sent Notifications" : "Recent Notifications"}</span>
                  </CardTitle>
                  <CardDescription>
                    {isTeacher 
                      ? "All notifications you've sent to students"
                      : "Latest announcements from your teacher"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-neutral-900 mb-2">
                          No notifications found
                        </h3>
                        <p className="text-neutral-500">
                          {isTeacher 
                            ? "Send your first notification to communicate with students."
                            : "No notifications have been sent yet."
                          }
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div key={notification.id} className="flex items-start space-x-4 p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                          {getNotificationIcon(notification.targetBatchId)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-neutral-900 truncate">
                                {notification.title}
                              </h4>
                              {isTeacher && getTargetBadge(notification.targetBatchId)}
                            </div>
                            <p className="text-neutral-600 text-sm mb-3 leading-relaxed">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between text-xs text-neutral-500">
                              <div className="flex items-center space-x-4">
                                {isTeacher && (
                                  <span>
                                    Sent to: {getBatchName(notification.targetBatchId)}
                                  </span>
                                )}
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatDate(notification.createdAt)}
                                </span>
                              </div>
                              {!isTeacher && user.batchId && (
                                <Badge variant="outline" className="text-xs">
                                  {notification.targetBatchId === user.batchId ? "For Your Batch" : "General"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
