"use client";

import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useOperations } from "@/components/operations/operations-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const { account, ready, signIn, signOut } = useOperations();
  const { theme, setTheme } = useTheme();
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <p className="eyebrow mb-3">Make it yours</p>
        <h1 className="text-[28px] font-semibold tracking-tight sm:text-[32px]">
          Workspace settings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account, your appearance, your working day.
        </p>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2 className="text-sm font-semibold">Appearance</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose a theme. Your preference is saved in this browser.
            </p>
          </div>
        </div>
        <div
          className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3 sm:p-6"
          role="group"
          aria-label="Appearance"
        >
          {[
            { value: "light", label: "Light", icon: Sun },
            { value: "dark", label: "Dark", icon: Moon },
            { value: "system", label: "System", icon: Monitor },
          ].map((item) => (
            <button
              key={item.value}
              aria-pressed={ready && theme === item.value}
              onClick={() => setTheme(item.value)}
              className={`rounded-xl border p-3 text-left outline-offset-4 transition-colors ${ready && theme === item.value ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}
            >
              <div
                className={`mb-3 flex h-24 gap-2 overflow-hidden rounded-lg border p-2 ${item.value === "dark" ? "border-[#35483d] bg-[#101917]" : item.value === "light" ? "border-[#e1e8e4] bg-[#f5f7f6]" : "bg-linear-to-r from-[#f5f7f6] from-50% to-[#101917] to-50%"}`}
                aria-hidden="true"
              >
                <div
                  className={`w-6 rounded ${item.value === "dark" ? "bg-[#23362c]" : "bg-[#dce4df]"}`}
                />
                <div className="flex-1 space-y-2">
                  <div
                    className={`h-3 rounded ${item.value === "dark" ? "bg-[#23362c]" : "bg-[#dce4df]"}`}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-10 rounded bg-[#147d60]/25" />
                    <div className="h-10 rounded bg-[#147d60]/15" />
                  </div>
                </div>
              </div>
              <span className="flex items-center gap-2 text-xs font-medium">
                <item.icon className="size-4" />
                {item.label}
                <Check
                  className={`ml-auto size-4 text-primary ${ready && theme === item.value ? "visible" : "invisible"}`}
                />
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2 className="text-sm font-semibold">Account</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Your current workspace session.
            </p>
          </div>
        </div>
        <div className="space-y-5 p-5 sm:p-6">
          {account ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="account-email">Email address</Label>
                  <Input
                    id="account-email"
                    value={account.email}
                    readOnly
                    className="bg-muted/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-role">Access role</Label>
                  <Input
                    id="account-role"
                    value={account.role}
                    readOnly
                    className="bg-muted/30 capitalize"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Account details and permissions are managed by your
                administrator.
              </p>
              <Button variant="outline" onClick={signOut}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Sign in to connect your production and expense reports.
              </p>
              <Button disabled={!ready} onClick={signIn}>
                Sign in
              </Button>
            </>
          )}
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2 className="text-sm font-semibold">Report information</h2>
        </div>
        <dl className="grid gap-5 p-5 text-sm sm:grid-cols-2 sm:p-6">
          <div>
            <dt className="text-xs text-muted-foreground">Currency</dt>
            <dd className="mt-1 font-medium">USD · US dollar</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Date display</dt>
            <dd className="mt-1 font-medium">Your device’s local calendar</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">
              Production valuation
            </dt>
            <dd className="mt-1 text-xs leading-relaxed">
              The API estimates production value at $25 per recorded item.
              Estimated net is production value less recorded expenses. These
              figures are operational estimates.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
