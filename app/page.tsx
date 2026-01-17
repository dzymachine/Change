import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-24">
          <nav className="flex items-center justify-between mb-16">
            <span className="text-2xl font-bold text-emerald-600">Change</span>
            <div className="flex items-center gap-4">
              <Link 
                href="/login" 
                className="text-gray-600 hover:text-gray-900"
              >
                Sign in
              </Link>
              <Link 
                href="/signup" 
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </nav>

          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              Turn your spare change into
              <span className="text-emerald-600"> real change</span>
            </h1>
            
            <p className="text-xl text-gray-600 mt-6 max-w-2xl">
              Link your bank account, and we'll automatically round up every 
              purchase to the nearest dollar. The extra cents go to the charity 
              of your choice.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <Link 
                href="/signup"
                className="px-8 py-4 bg-emerald-600 text-white text-lg font-medium rounded-xl hover:bg-emerald-700 transition-colors text-center"
              >
                Start Making Change
              </Link>
              <Link 
                href="#how-it-works"
                className="px-8 py-4 bg-white text-gray-700 text-lg font-medium rounded-xl border hover:bg-gray-50 transition-colors text-center"
              >
                See How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
                🏦
              </div>
              <h3 className="text-xl font-semibold mb-3">Link Your Bank</h3>
              <p className="text-gray-600">
                Securely connect your bank account using Plaid. Your credentials 
                never touch our servers.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
                💰
              </div>
              <h3 className="text-xl font-semibold mb-3">We Round Up</h3>
              <p className="text-gray-600">
                Every purchase gets rounded up to the nearest dollar. Buy a $4.50 
                coffee? That's $0.50 for charity.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
                ❤️
              </div>
              <h3 className="text-xl font-semibold mb-3">Charity Gets Funded</h3>
              <p className="text-gray-600">
                Your round-ups are batched and donated to your chosen charity. 
                Small change, big impact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Example */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            See It In Action
          </h2>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="font-semibold text-lg">Your Transactions</h3>
            </div>
            
            <div className="divide-y">
              {[
                { merchant: "Coffee Shop", amount: 4.75, roundup: 0.25 },
                { merchant: "Grocery Store", amount: 47.32, roundup: 0.68 },
                { merchant: "Gas Station", amount: 35.19, roundup: 0.81 },
              ].map((tx, i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tx.merchant}</p>
                    <p className="text-sm text-gray-500">${tx.amount.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-600 font-semibold">
                      +${tx.roundup.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">donated</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-emerald-50 border-t">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total donated this week:</span>
                <span className="text-2xl font-bold text-emerald-600">$1.74</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-emerald-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to make a difference?
          </h2>
          <p className="text-emerald-100 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of people using their everyday purchases to support 
            causes they care about.
          </p>
          <Link 
            href="/signup"
            className="inline-block px-8 py-4 bg-white text-emerald-600 text-lg font-medium rounded-xl hover:bg-emerald-50 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p>© 2026 Change. Making change, one purchase at a time.</p>
        </div>
      </footer>
    </main>
  );
}
