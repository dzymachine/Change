import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/tax-summary/export/pdf
 * 
 * Generates a PDF-style HTML document for donation tax summary.
 * This creates an HTML document that opens in a new tab for printing/saving as PDF.
 * 
 * Query params:
 * - year: The tax year to export (defaults to current year)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Parse year from query params
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();
    
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Fetch all processed transactions (roundups) for this year
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select(`
        id,
        donated_to_charity_id,
        roundup_amount,
        created_at,
        date
      `)
      .eq("user_id", user.id)
      .eq("processed_for_donation", true)
      .not("donated_to_charity_id", "is", null)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (transactionsError) {
      console.error("Failed to fetch transactions:", transactionsError);
      return NextResponse.json(
        { error: "Failed to fetch donations" },
        { status: 500 }
      );
    }

    // Transform transactions to donation-like format
    const donations = (transactions || []).map(tx => ({
      id: tx.id,
      charity_id: tx.donated_to_charity_id,
      amount: tx.roundup_amount,
      created_at: tx.created_at,
    }));

    // Fetch user charities for name lookup
    const { data: userCharities } = await supabase
      .from("user_charities")
      .select("charity_id, charity_name, charity_category")
      .eq("user_id", user.id);

    // Create charity lookup map
    const charityMap = new Map<string, { name: string; category: string | null }>();
    userCharities?.forEach((uc) => {
      charityMap.set(uc.charity_id, {
        name: uc.charity_name || "Unknown Charity",
        category: uc.charity_category || null,
      });
    });

    // Also fetch from charities table
    const charityIds = [...new Set(donations?.map((d) => d.charity_id) || [])];
    if (charityIds.length > 0) {
      const { data: charitiesData } = await supabase
        .from("charities")
        .select("id, name, category")
        .in("id", charityIds);

      charitiesData?.forEach((c) => {
        if (!charityMap.has(c.id)) {
          charityMap.set(c.id, { name: c.name, category: c.category });
        }
      });
    }

    // Aggregate by charity
    const charityAggregates = new Map<string, {
      name: string;
      category: string | null;
      totalAmount: number;
      donationCount: number;
      firstDonation: Date | null;
      lastDonation: Date | null;
    }>();

    donations?.forEach((donation) => {
      const charityId = donation.charity_id;
      const charityInfo = charityMap.get(charityId) || { 
        name: "Unknown Charity", 
        category: null 
      };
      const amount = parseFloat(String(donation.amount)) || 0;
      const donationDate = new Date(donation.created_at);

      const existing = charityAggregates.get(charityId) || {
        name: charityInfo.name,
        category: charityInfo.category,
        totalAmount: 0,
        donationCount: 0,
        firstDonation: null,
        lastDonation: null,
      };

      existing.totalAmount += amount;
      existing.donationCount += 1;

      if (!existing.firstDonation || donationDate < existing.firstDonation) {
        existing.firstDonation = donationDate;
      }
      if (!existing.lastDonation || donationDate > existing.lastDonation) {
        existing.lastDonation = donationDate;
      }

      charityAggregates.set(charityId, existing);
    });

    // Sort by amount descending
    const sortedCharities = Array.from(charityAggregates.entries())
      .sort(([, a], [, b]) => b.totalAmount - a.totalAmount);

    // Calculate totals
    const totalDonated = sortedCharities.reduce(
      (sum, [, data]) => sum + data.totalAmount, 
      0
    );
    const totalTransactions = sortedCharities.reduce(
      (sum, [, data]) => sum + data.donationCount, 
      0
    );

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    };

    // Format date
    const formatDate = (date: Date | null) => {
      if (!date) return "N/A";
      return date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric", 
        year: "numeric" 
      });
    };

    // Generate HTML document
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Donation Tax Summary - ${year}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: #fff;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    @media print {
      body {
        padding: 20px;
      }
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #a2896c;
    }
    
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #a2896c;
    }
    
    .doc-info {
      text-align: right;
      color: #666;
      font-size: 14px;
    }
    
    .doc-title {
      font-size: 24px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    
    .summary-box {
      background: #f8f6f3;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 32px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }
    
    .summary-item {
      text-align: center;
    }
    
    .summary-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
      margin-bottom: 4px;
    }
    
    .summary-value {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
    }
    
    .summary-value.highlight {
      color: #a2896c;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #1a1a1a;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
    }
    
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e5e5;
    }
    
    th {
      background: #f8f6f3;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
    }
    
    td {
      font-size: 14px;
    }
    
    .amount {
      text-align: right;
      font-weight: 600;
    }
    
    .total-row {
      background: #a2896c;
      color: white;
    }
    
    .total-row td {
      font-weight: 700;
      border-bottom: none;
    }
    
    .category-badge {
      display: inline-block;
      padding: 2px 8px;
      background: #e5e5e5;
      border-radius: 12px;
      font-size: 11px;
      color: #666;
    }
    
    .disclaimer {
      background: #f8f6f3;
      border-radius: 8px;
      padding: 16px 20px;
      margin-top: 32px;
      font-size: 12px;
      color: #666;
    }
    
    .disclaimer-title {
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
    
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background: #a2896c;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    
    .print-button:hover {
      background: #8a7459;
    }
    
    @media print {
      .print-button {
        display: none;
      }
    }
  </style>
</head>
<body>
  <button class="print-button" onclick="window.print()">Print / Save as PDF</button>

  <div class="header">
    <div>
      <div class="logo">Change</div>
      <div style="color: #666; font-size: 14px;">Micro-donation Platform</div>
    </div>
    <div class="doc-info">
      <div class="doc-title">Donation Tax Summary</div>
      <div>Tax Year: ${year}</div>
      <div>Generated: ${new Date().toLocaleDateString("en-US", { 
        month: "long", 
        day: "numeric", 
        year: "numeric" 
      })}</div>
      <div>Account: ${user.email}</div>
    </div>
  </div>

  <div class="summary-box">
    <div class="summary-item">
      <div class="summary-label">Total Donated</div>
      <div class="summary-value highlight">${formatCurrency(totalDonated)}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Total Transactions</div>
      <div class="summary-value">${totalTransactions}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Charities Supported</div>
      <div class="summary-value">${sortedCharities.length}</div>
    </div>
  </div>

  <h2 class="section-title">Donations by Charity</h2>
  
  <table>
    <thead>
      <tr>
        <th>Charity Name</th>
        <th>Category</th>
        <th>Donations</th>
        <th>Date Range</th>
        <th class="amount">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${sortedCharities.map(([, data]) => `
        <tr>
          <td>${data.name}</td>
          <td>${data.category ? `<span class="category-badge">${data.category}</span>` : '-'}</td>
          <td>${data.donationCount}</td>
          <td>${formatDate(data.firstDonation)}${data.firstDonation?.getTime() !== data.lastDonation?.getTime() ? ` - ${formatDate(data.lastDonation)}` : ''}</td>
          <td class="amount">${formatCurrency(data.totalAmount)}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td colspan="4">Total Tax-Deductible Donations</td>
        <td class="amount">${formatCurrency(totalDonated)}</td>
      </tr>
    </tbody>
  </table>

  <div class="disclaimer">
    <div class="disclaimer-title">Important Notice</div>
    <p>
      This summary is provided for personal record-keeping purposes only. It is not an official tax receipt.
      Official acknowledgment letters and tax receipts are provided directly by the charitable organizations you support.
      Donations to qualified 501(c)(3) organizations may be tax-deductible. Please consult with a qualified tax 
      professional regarding the deductibility of your charitable contributions.
    </p>
  </div>

  <div class="footer">
    <p>Change App &middot; Micro-donations that make a difference</p>
    <p>This document was automatically generated from your Change account data.</p>
  </div>
</body>
</html>
    `;

    // Return as HTML that can be printed to PDF
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="change-tax-summary-${year}.html"`,
      },
    });
  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
