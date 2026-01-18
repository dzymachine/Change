"use client";

import { useState, useEffect } from "react";
import { usePlaidLink } from "@/hooks/use-plaid-link";
import { exchangePlaidToken } from "@/actions/plaid";

interface LinkBankButtonProps {
  size?: "default" | "large";
  variant?: "primary" | "secondary";
  onSuccess?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function LinkBankButton({ 
  size = "default", 
  variant = "primary",
  onSuccess,
  className,
  style,
}: LinkBankButtonProps) {
  const [isLinking, setIsLinking] = useState(false);
  const [shouldOpen, setShouldOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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

  // Size configurations
  const sizeConfig = {
    default: { padding: "12px 24px", fontSize: "14px" },
    large: { padding: "16px 48px", fontSize: "16px" },
  };

  // Variant configurations using CSS variables
  const getVariantStyles = (): React.CSSProperties => {
    if (variant === "secondary") {
      return {
        backgroundColor: isHovered ? "rgba(162, 137, 108, 0.1)" : "transparent",
        color: "var(--foreground)",
        border: "1px solid var(--border)",
      };
    }
    return {
      backgroundColor: isHovered && !isLoading ? "var(--green-light)" : "var(--green)",
      color: "var(--white)",
      border: "none",
    };
  };

  const baseStyles: React.CSSProperties = {
    fontFamily: "var(--font-body), 'Roboto Serif', 'Times New Roman', Georgia, serif",
    fontWeight: 500,
    letterSpacing: "0.025em",
    transition: "all 0.2s ease",
    cursor: isLoading ? "wait" : "pointer",
    opacity: isLoading ? 0.6 : 1,
    ...sizeConfig[size],
    ...getVariantStyles(),
    ...style,
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={className}
      style={baseStyles}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isLoading ? (
        "Connecting..."
      ) : variant === "secondary" ? (
        "+ Link another account"
      ) : (
        "Connect Bank Account"
      )}
    </button>
  );
}
