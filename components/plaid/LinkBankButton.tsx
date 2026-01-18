"use client";

import { useState, useEffect } from "react";
import { usePlaidLink } from "@/hooks/use-plaid-link";
import { exchangePlaidToken } from "@/actions/plaid";

interface LinkBankButtonProps {
  size?: "default" | "large";
  variant?: "primary" | "secondary";
  onSuccess?: () => void;
}

export function LinkBankButton({ 
  size = "default", 
  variant = "primary",
  onSuccess 
}: LinkBankButtonProps) {
  const [isLinking, setIsLinking] = useState(false);
  const [shouldOpen, setShouldOpen] = useState(false);

  const { open, ready, loading } = usePlaidLink({
    onSuccess: async (publicToken, metadata) => {
      setIsLinking(true);
      
      const result = await exchangePlaidToken(publicToken, {
        institutionName: metadata.institution.name,
        institutionId: metadata.institution.institution_id,
      });

      setIsLinking(false);

      if (result.success) {
        onSuccess?.();
      } else {
        alert(result.error || "Failed to link bank account");
      }
    },
    onExit: () => {
      setIsLinking(false);
      setShouldOpen(false);
    },
  });

  // Open Plaid Link when ready and user clicked the button
  useEffect(() => {
    if (shouldOpen && ready) {
      open();
      setShouldOpen(false);
    }
  }, [shouldOpen, ready, open]);

  const handleClick = () => {
    if (ready) {
      // Already ready, open immediately
      open();
    } else {
      // Not ready yet, set flag to open when ready
      setShouldOpen(true);
    }
  };

  const isLoading = loading || isLinking || (shouldOpen && !ready);

  const baseStyles = "font-medium rounded-lg transition-colors disabled:opacity-50";
  
  const sizeStyles = {
    default: "px-4 py-2 text-sm",
    large: "px-6 py-3 text-base",
  };

  const variantStyles = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 border",
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]}`}
    >
      {isLoading ? (
        "Connecting..."
      ) : variant === "secondary" ? (
        "+ Link another account"
      ) : (
        "Link Bank Account"
      )}
    </button>
  );
}
