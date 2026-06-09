"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Mail, LogOut } from "lucide-react";

export default function PendingApprovalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    
    // Check approval status from database
    const checkApprovalStatus = async () => {
      if (session?.user?.email) {
        try {
          const res = await fetch(`/api/user/profile`);
          if (res.ok) {
            const data = await res.json();
            if (data.user?.isApproved) {
              // User is approved but session is stale
              // Force sign out and redirect to login to refresh session
              await signOut({ redirect: false });
              router.push("/login?message=approved");
            }
          }
        } catch (error) {
          console.error("Error checking approval status:", error);
        }
      }
    };

    if (session?.user?.isApproved) {
      router.push("/dashboard");
    } else if (session?.user && !session.user.isApproved) {
      // Double-check with database in case session is stale
      checkApprovalStatus();
    }
  }, [status, session, router]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
            <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">Account Pending Approval</CardTitle>
          <CardDescription className="text-base">
            Your account has been created successfully!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Waiting for Admin Approval</p>
                <p className="text-sm text-muted-foreground">
                  An administrator needs to approve your account and assign you a role before you can access the system.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">You'll be notified</p>
                <p className="text-sm text-muted-foreground">
                  Once approved, you'll receive an email at <strong>{session?.user?.email}</strong> and can log in to access the platform.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-center text-muted-foreground">
              This usually takes a few hours. Please check back later.
            </p>
            
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-center text-muted-foreground">
              Need help? Contact your system administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
