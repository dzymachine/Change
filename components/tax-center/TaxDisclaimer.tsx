"use client";

export function TaxDisclaimer() {
  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      <span className="text-xl shrink-0 mt-0.5">
        <svg
          className="w-5 h-5"
          style={{ color: "var(--muted)" }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
      </span>
      <div>
        <p 
          className="font-medium"
          style={{ color: "var(--foreground)" }}
        >
          This summary is for personal record-keeping
        </p>
        <p 
          className="text-sm mt-1"
          style={{ color: "var(--muted)" }}
        >
          Official tax receipts and acknowledgment letters come directly from the charities you support. 
          Consult a tax professional for advice on claiming deductions. 
          Donations to qualified 501(c)(3) organizations may be tax-deductible.
        </p>
      </div>
    </div>
  );
}
