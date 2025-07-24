import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Trophy, Zap, UserPlus, ArrowRight, CheckCircle, Download } from "lucide-react";
import { useState, useEffect } from "react";

export default function Landing() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallButton(false);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">PARAGON</h1>
                <p className="text-sm text-muted-foreground">CLASSES</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => window.location.href = '/api/login'}>
                Login
              </Button>
              <Button onClick={() => window.location.href = '/api/login'}>
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </header>
      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6">
            New Student Enrollment Open
          </Badge>
          
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-primary/30 mb-4 shadow-lg">
              <img 
                src={"/attached_assets/download (3)_1753330888206.jpeg"}
                alt="Nitin Mathur - Owner & Faculty"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Nitin Mathur - Owner & Faculty</p>
          </div>
          
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Master Physics with
            <span className="text-primary block">PARAGON CLASSES</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Expert physics coaching for Class 11th & 12th students with 25+ years of experience. 
            Comprehensive study materials, interactive sessions, and personalized guidance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => window.location.href = '/api/login'}>
              <UserPlus className="w-5 h-5 mr-2" />
              Join Now
            </Button>
            {showInstallButton && (
              <Button size="lg" variant="outline" onClick={handleInstallClick}>
                <Download className="w-5 h-5 mr-2" />
                Install App
              </Button>
            )}
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </section>
      {/* Sign Up Process Section */}
      <section className="py-16 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              How to Join PARAGON CLASSES
            </h2>
            <p className="text-lg text-muted-foreground">
              Simple 3-step process to start your physics journey
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="relative">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <CardTitle>Create Account</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="mb-4">
                  Click "Sign Up" to create your student account. It's quick and secure with Replit authentication.
                </CardDescription>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/api/login'}
                  className="w-full"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up Now
                </Button>
              </CardContent>
              <ArrowRight className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            </Card>

            <Card className="relative">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <CardTitle>Choose Your Batch</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="mb-4">
                  Select either Class 11th or 12th Physics batch based on your current academic level.
                </CardDescription>
                <div className="space-y-2">
                  <Badge variant="outline" className="w-full justify-center">Class 11th Physics</Badge>
                  <Badge variant="outline" className="w-full justify-center">Class 12th Physics</Badge>
                </div>
              </CardContent>
              <ArrowRight className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <CardTitle>Start Learning</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="mb-4">
                  Access study materials, join live sessions, track your progress, and get personalized guidance.
                </CardDescription>
                <div className="flex items-center justify-center text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Instant Access
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Why Choose PARAGON CLASSES?
            </h2>
            <p className="text-lg text-muted-foreground">
              Comprehensive physics education with modern tools and expert guidance
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardHeader>
                <BookOpen className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Expert Teaching</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Learn from Nitin Mathur's years of experience in physics education
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="w-12 h-12 text-secondary mb-4" />
                <CardTitle>Small Batches</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Personalized attention in focused Class 11th and 12th batches
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Trophy className="w-12 h-12 text-accent mb-4" />
                <CardTitle>Proven Results</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track record of students excelling in board exams and competitive tests
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Digital Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Access study materials, notifications, and fee management online
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* Batches Section */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Available Batches
            </h2>
            <p className="text-lg text-muted-foreground">
              Choose the right batch for your academic year
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-xl">11</span>
                </div>
                <CardTitle>Class 11th Physics</CardTitle>
                <CardDescription>Foundation building with comprehensive coverage</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-secondary/20">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-secondary font-bold text-xl">12</span>
                </div>
                <CardTitle>Class 12th Physics</CardTitle>
                <CardDescription>Advanced concepts with board exam focus</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">
            Ready to Excel in Physics?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of students who have achieved success with PARAGON CLASSES. 
            Start your physics journey today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={() => window.location.href = '/api/login'}
              className="bg-background text-foreground hover:bg-background/90"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Sign Up as Student
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => window.location.href = '/api/login'}
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              Login to Continue
            </Button>
          </div>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-foreground mb-2">25+</div>
              <div className="text-primary-foreground/80">Yrs of Exp</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-foreground mb-2">3000+</div>
              <div className="text-primary-foreground/80">Students Taught</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-foreground mb-2">95%</div>
              <div className="text-primary-foreground/80">Success Rate</div>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20">
              <img 
                src={"/attached_assets/download (3)_1753330888206.jpeg"}
                alt="Nitin Mathur - Owner & Faculty"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground">PARAGON CLASSES</h3>
              <p className="text-sm text-muted-foreground">Physics Coaching Excellence</p>
              <p className="text-sm font-medium text-primary">Owner & Faculty: Nitin Mathur</p>
            </div>
          </div>
          
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              <strong className="text-foreground">25+ Years of Expert Physics Coaching</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              © 2025 PARAGON CLASSES. Empowering students to excel in physics.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
