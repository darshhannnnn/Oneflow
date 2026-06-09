"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Copy } from "lucide-react";

export default function AdminTestPage() {
  const { data: session, status } = useSession();
  const [verifyResult, setVerifyResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      runVerification();
    }
  }, [status]);

  const runVerification = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/verify');
      const data = await res.json();
      setVerifyResult(data);
    } catch (error) {
      setVerifyResult({
        error: 'Failed to verify',
        details: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Not Authenticated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please login to test admin access.
            </p>
            <Button onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Access Verification</h1>
          <p className="text-muted-foreground mt-1">
            Debug tool to verify admin permissions
          </p>
        </div>
        <Button onClick={runVerification} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Re-verify
        </Button>
      </div>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current Session</CardTitle>
          <CardDescription>Your authentication status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{session?.user?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{session?.user?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge variant={session?.user?.role === 'ADMIN' ? 'default' : 'secondary'}>
                {session?.user?.role || 'NO ROLE'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">User ID</p>
              <p className="font-mono text-xs">{session?.user?.id || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Results */}
      {verifyResult && (
        <>
          <Card className={verifyResult.success ? 'border-green-500' : 'border-red-500'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {verifyResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Verification Result
              </CardTitle>
              <CardDescription>{verifyResult.message}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {verifyResult.roleCheck && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Permission Checks</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                      {verifyResult.roleCheck.isAdmin ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">Is Admin</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {verifyResult.roleCheck.hasAnalyticsPermission ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">Analytics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {verifyResult.roleCheck.hasDatabasePermission ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">Database</span>
                    </div>
                  </div>
                </div>
              )}

              {verifyResult.sqlCommand && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-600">Action Required</h4>
                  <p className="text-sm text-muted-foreground">
                    Run this SQL command in your database:
                  </p>
                  <div className="relative">
                    <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                      {verifyResult.sqlCommand}
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(verifyResult.sqlCommand)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {verifyResult.nextSteps && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Next Steps</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {verifyResult.nextSteps.map((step, index) => (
                      <li key={index} className="text-muted-foreground">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>

          {verifyResult.permissions && (
            <Card>
              <CardHeader>
                <CardTitle>Your Permissions</CardTitle>
                <CardDescription>Resources you can access</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(verifyResult.permissions).map(([resource, actions]) => (
                    <div key={resource} className="border rounded p-3">
                      <p className="font-medium text-sm capitalize mb-1">
                        {resource}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {actions.map((action) => (
                          <Badge key={action} variant="outline" className="text-xs">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Test admin features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard'}
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard/admin/comparison'}
            >
              Comparison
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                const res = await fetch('/api/admin/analytics?timeRange=30');
                console.log('Analytics Response:', await res.json());
                alert('Check browser console for response');
              }}
            >
              Test Analytics API
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                const res = await fetch('/api/admin/database');
                console.log('Database Response:', await res.json());
                alert('Check browser console for response');
              }}
            >
              Test Database API
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
          <CardDescription>Raw data for troubleshooting</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
            {JSON.stringify({ session, verifyResult }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
