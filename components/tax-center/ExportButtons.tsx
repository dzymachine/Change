"use client";

import { useState } from "react";

interface ExportButtonsProps {
  year: number;
}

export function ExportButtons({ year }: ExportButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleExport = async (format: "pdf" | "csv") => {
    setIsExporting(format);
    try {
      if (format === "pdf") {
        // Open PDF in new tab - user can print/save as PDF from there
        window.open(`/api/tax-summary/export/pdf?year=${year}`, "_blank");
      } else {
        // Download CSV directly
        const response = await fetch(`/api/tax-summary/export/csv?year=${year}`);
        
        if (!response.ok) {
          throw new Error("Export failed");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `change-tax-summary-${year}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export. Please try again.");
    } finally {
      setIsExporting(null);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{
          backgroundColor: "var(--accent-foreground)",
          color: "var(--background)",
        }}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
        Export
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div
            className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg overflow-hidden z-20"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <button
              onClick={() => handleExport("pdf")}
              disabled={isExporting !== null}
              className="w-full px-4 py-3 text-left flex items-center gap-3 transition-colors hover:opacity-80 disabled:opacity-50"
              style={{ 
                backgroundColor: "var(--card)",
                color: "var(--foreground)",
              }}
            >
              <svg
                className="w-5 h-5 text-red-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zm-3 9h2v1h-2v2h2v1H8v-7h4v1h-2v2zm5 4v-1h2v-1h-2v-1h2v-1h-2v-1h3v5h-3z"/>
              </svg>
              <div>
                <p className="font-medium">PDF Summary</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  Opens printable page
                </p>
              </div>
              {isExporting === "pdf" && (
                <span className="ml-auto animate-spin">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </span>
              )}
            </button>
            
            <div style={{ borderTop: "1px solid var(--border)" }} />
            
            <button
              onClick={() => handleExport("csv")}
              disabled={isExporting !== null}
              className="w-full px-4 py-3 text-left flex items-center gap-3 transition-colors hover:opacity-80 disabled:opacity-50"
              style={{ 
                backgroundColor: "var(--card)",
                color: "var(--foreground)",
              }}
            >
              <svg
                className="w-5 h-5 text-green-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8 13h8v2H8v-2zm0 4h8v2H8v-2zm0-8h3v2H8V9z"/>
              </svg>
              <div>
                <p className="font-medium">CSV Spreadsheet</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  Import to tax software
                </p>
              </div>
              {isExporting === "csv" && (
                <span className="ml-auto animate-spin">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </span>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
