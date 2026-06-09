"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import RoleSelectionModal from "@/components/RoleSelectionModal";

export default function RoleSetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (status === "loading") {
      setIsChecking(true);
      return;
    }

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      // Check if user has a role
      if (session?.user?.role) {
        // User already has a role, check approval status
        if (session.user.isApproved) {
          router.push("/dashboard");
        } else {
          router.push("/auth/pending-approval");
        }
      } else {
        // User has no role, show role selection modal
        setIsChecking(false);
        setShowModal(true);
      }
    }
  }, [status, session, router]);

  const handleClose = () => {
    setShowModal(false);
    // The RoleSelectionModal will handle the redirect based on approval status
  };

  if (status === "loading" || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <RoleSelectionModal
        isOpen={showModal}
        onClose={handleClose}
        userEmail={session?.user?.email}
        userName={session?.user?.name}
      />
    </div>
  );
}
