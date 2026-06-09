"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, Loader2, CheckCircle2, Clock } from "lucide-react";

export default function RoleSelectionModal({ isOpen, onClose, userEmail, userName }) {
  const router = useRouter();
  const { update } = useSession();
  const [selectedRole, setSelectedRole] = useState("TEAM_MEMBER");
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    {
      value: "TEAM_MEMBER",
      label: "Team Member",
      description: "View assigned tasks, update status, log hours",
      color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
      needsApproval: true,
    },
    {
      value: "PROJECT_MANAGER",
      label: "Project Manager",
      description: "Create projects, assign people, manage tasks",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      needsApproval: true,
    },
    {
      value: "SALES",
      label: "Sales",
      description: "Create Sales Orders, Customer Invoices",
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      needsApproval: true,
    },
    {
      value: "FINANCE",
      label: "Finance",
      description: "Manage invoices, bills, and expenses",
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      needsApproval: true,
    },
    {
      value: "ADMIN",
      label: "Admin",
      description: "Full access to all features and settings",
      color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      needsApproval: true,
    },
  ];

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: userName,
          role: selectedRole 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const isApproved = data.user?.isApproved;
        
        // Update the session with new role and approval status
        await update({
          user: {
            role: selectedRole,
            name: userName,
            isApproved: isApproved,
          },
        });
        
        onClose();
        
        // Since all roles now need approval, always redirect to pending approval
        router.push("/auth/pending-approval");
        router.refresh();
      } else {
        const error = await response.json();
        console.error("Role selection failed:", error);
        alert("Failed to update role. Please try again.");
      }
    } catch (error) {
      console.error("Role selection error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4 border-border/40 backdrop-blur-xl bg-card/95 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl ivy-font flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-500" />
            Select Your Role
          </CardTitle>
          <CardDescription className="ivy-font">
            Choose the role that best describes your position in the organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {roles.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => setSelectedRole(role.value)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  selectedRole === role.value
                    ? "border-emerald-500 bg-emerald-500/5"
                    : "border-border/40 hover:border-border bg-card/50 hover:bg-card/70"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={role.color}>
                        {role.label}
                      </Badge>
                      {selectedRole === role.value && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      )}
                      {role.needsApproval && (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          Requires Approval
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground ivy-font">
                      {role.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-400 flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                All roles require admin approval. After submitting, you'll need to wait for an administrator to approve your account before accessing the system.
              </span>
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white ivy-font"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Continue with {roles.find(r => r.value === selectedRole)?.label}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
