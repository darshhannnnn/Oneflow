"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, ShieldAlert } from "lucide-react";
import { canAccessPage, hasPermission } from "@/lib/rbac-client";

/**
 * Higher-order component for page-level access control
 * Wraps pages that require specific role permissions
 */
export function withPageAccess(Component, requiredPage) {
  return function ProtectedPage(props) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === "unauthenticated") {
        router.push("/login");
      }
    }, [status, router]);

    if (status === "loading") {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!session?.user) {
      return null;
    }

    if (!canAccessPage(session.user, requiredPage)) {
      return (
        <div className="container mx-auto p-6 max-w-2xl">
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <ShieldAlert className="h-5 w-5" />
                Access Denied
              </CardTitle>
              <CardDescription>
                <p className="text-muted-foreground">You don&apos;t have permission to access this page.</p>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This page requires specific permissions that your current role ({session.user.role}) doesn&apos;t have.
              </p>
              <p className="text-muted-foreground">Please contact your administrator if you believe you should have access to this page.</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Button onClick={() => router.push("/dashboard")}>
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return <Component {...props} user={session.user} />;
  };
}

/**
 * Component-level access control
 * Shows/hides UI elements based on permissions
 */
export function AccessControl({ 
  children, 
  resource, 
  action, 
  fallback = null,
  requireAll = false 
}) {
  const { data: session } = useSession();

  if (!session?.user) {
    return fallback;
  }

  // If resource and action are arrays, check if user has any/all permissions
  if (Array.isArray(resource) && Array.isArray(action)) {
    const checks = resource.map((res, idx) => 
      hasPermission(session.user, res, action[idx])
    );
    
    const hasAccess = requireAll 
      ? checks.every(check => check)
      : checks.some(check => check);
    
    return hasAccess ? children : fallback;
  }

  // Single resource/action check
  if (!hasPermission(session.user, resource, action)) {
    return fallback;
  }

  return children;
}

/**
 * Role-based component rendering
 * Shows content only for specific roles
 */
export function RoleGuard({ children, roles, fallback = null }) {
  const { data: session } = useSession();

  if (!session?.user || !roles.includes(session.user.role)) {
    return fallback;
  }

  return children;
}

/**
 * Inverse role guard - hide content for specific roles
 */
export function HideForRoles({ children, roles }) {
  const { data: session } = useSession();

  if (session?.user && roles.includes(session.user.role)) {
    return null;
  }

  return children;
}
