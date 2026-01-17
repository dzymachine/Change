import { createClient } from "@/lib/supabase/server";
import { LinkBankButton } from "@/components/plaid/LinkBankButton";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // TODO: Fetch linked accounts from database
  const linkedAccounts: { id: string; institutionName: string; isActive: boolean }[] = [];

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Profile</h2>
        <div className="border rounded-xl p-4 space-y-3">
          <div>
            <label className="text-sm text-gray-500">Email</label>
            <p className="font-medium">{user?.email}</p>
          </div>
        </div>
      </section>

      {/* Linked Accounts Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Linked Bank Accounts</h2>
        
        {linkedAccounts.length === 0 ? (
          <div className="border rounded-xl p-6 text-center">
            <p className="text-gray-500 mb-4">No bank accounts linked yet</p>
            <LinkBankButton />
          </div>
        ) : (
          <div className="space-y-3">
            {linkedAccounts.map((account) => (
              <div key={account.id} className="border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{account.institutionName}</p>
                  <p className="text-sm text-gray-500">
                    {account.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
                <button className="text-red-500 text-sm hover:underline">
                  Unlink
                </button>
              </div>
            ))}
            <LinkBankButton variant="secondary" />
          </div>
        )}
      </section>

      {/* Charity Selection */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Selected Charity</h2>
        <div className="border rounded-xl p-4">
          <p className="font-medium">Local Food Bank</p>
          <p className="text-sm text-gray-500">Currently receiving your donations</p>
          <button className="mt-3 text-emerald-600 text-sm hover:underline">
            Change charity
          </button>
        </div>
      </section>

      {/* Round-up Settings */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Round-up Settings</h2>
        <div className="border rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable round-ups</p>
              <p className="text-sm text-gray-500">Automatically round up transactions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-red-600">Danger Zone</h2>
        <div className="border border-red-200 rounded-xl p-4 space-y-4">
          <LogoutButton />
        </div>
      </section>
    </div>
  );
}
