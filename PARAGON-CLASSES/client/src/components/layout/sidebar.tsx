import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Home, 
  Users, 
  GraduationCap, 
  IndianRupee, 
  BookOpen, 
  Bell,
  ArrowLeftRight
} from "lucide-react";

interface SidebarProps {
  onToggleView?: () => void;
}

export default function Sidebar({ onToggleView }: SidebarProps) {
  const { user } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const isTeacher = user.role === 'teacher';

  const teacherNavItems = [
    { path: "/", icon: Home, label: "Dashboard", active: location === "/" },
    { path: "/students", icon: Users, label: "Student Management", active: location === "/students" },
    { path: "/batches", icon: GraduationCap, label: "Batch Management", active: location === "/batches" },
    { path: "/fees", icon: IndianRupee, label: "Fee Management", active: location === "/fees" },
    { path: "/materials", icon: BookOpen, label: "Study Materials", active: location === "/materials" },
    { path: "/notifications", icon: Bell, label: "Notifications", active: location === "/notifications" },
  ];

  const studentNavItems = [
    { path: "/", icon: Home, label: "Dashboard", active: location === "/" },
    { path: "/materials", icon: BookOpen, label: "Study Materials", active: location === "/materials" },
    { path: "/notifications", icon: Bell, label: "Notifications", active: location === "/notifications" },
  ];

  const navItems = isTeacher ? teacherNavItems : studentNavItems;

  const getBatchName = (batchId: number | null) => {
    if (batchId === 1) return "Class 11th Physics";
    if (batchId === 2) return "Class 12th Physics";
    return "No Batch Assigned";
  };

  return (
    <div className="w-64 bg-card shadow-lg border-r border-border flex flex-col">
      {/* Logo/Branding */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="text-primary-foreground text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">PARAGON</h1>
            <p className="text-sm text-muted-foreground">CLASSES</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.profileImageUrl || undefined} />
            <AvatarFallback>
              {(user.firstName?.[0] || '') + (user.lastName?.[0] || '')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.email
              }
            </p>
            <p className="text-xs text-neutral-500 truncate">
              {isTeacher ? "Faculty" : getBatchName(user.batchId)}
            </p>
          </div>
          <Badge variant={isTeacher ? "default" : "secondary"} className="text-xs">
            {isTeacher ? "Teacher" : "Student"}
          </Badge>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link href={item.path}>
                  <a className={`sidebar-nav-item ${item.active ? 'active' : ''}`}>
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Interface Toggle */}
      {onToggleView && (
        <div className="p-4 border-t border-neutral-200">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={onToggleView}
          >
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            Switch to {isTeacher ? 'Student' : 'Teacher'} View
          </Button>
        </div>
      )}
    </div>
  );
}
