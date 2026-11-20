"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Factory, LoaderCircle, LogIn } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  type Account,
  type Production,
  type Expense,
  categories,
  localDate,
} from "@/lib/reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RecordRequest =
  | { kind: "production"; record?: Production }
  | { kind: "expense"; record?: Expense };
interface OperationsContext {
  account: Account | null;
  ready: boolean;
  revision: number;
  refresh: () => void;
  signIn: () => void;
  signOut: () => void;
  openRecord: (request: RecordRequest) => void;
}
const Context = createContext<OperationsContext | null>(null);
const SESSION_KEY = "factoryops.session.v1";

export function useOperations() {
  const value = useContext(Context);
  if (!value) throw new Error("OperationsProvider is required");
  return value;
}

export function OperationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);
  const [revision, setRevision] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [request, setRequest] = useState<RecordRequest | null>(null);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  const signOut = useCallback(() => {
    api.setAuthToken(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* In-memory session. */
    }
    setAccount(null);
    setRequest(null);
  }, []);

  useEffect(() => {
    let active = true;
    let token: string | null = null;
    try {
      token = sessionStorage.getItem(SESSION_KEY);
    } catch {
      /* Session storage may be unavailable. */
    }
    if (token) {
      api.setAuthToken(token);
      api
        .get<Account>("/auth/me")
        .then((response) => {
          if (active) setAccount(response.data);
        })
        .catch(() => {
          if (active) {
            api.setAuthToken(null);
            try {
              sessionStorage.removeItem(SESSION_KEY);
            } catch {
              /* No persistent session. */
            }
          }
        })
        .finally(() => {
          if (active) setReady(true);
        });
    } else {
      queueMicrotask(() => {
        if (active) setReady(true);
      });
    }
    return () => {
      active = false;
    };
  }, []);

  return (
    <Context.Provider
      value={{
        account,
        ready,
        revision,
        refresh,
        signIn: () => setAuthOpen(true),
        signOut,
        openRecord: (value) =>
          account ? setRequest(value) : setAuthOpen(true),
      }}
    >
      {children}
      <SignInDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onSignedIn={(user, token) => {
          api.setAuthToken(token);
          try {
            sessionStorage.setItem(SESSION_KEY, token);
          } catch {
            /* Use an in-memory session. */
          }
          setAccount(user);
          refresh();
          setAuthOpen(false);
        }}
      />
      <Dialog
        open={request !== null}
        onOpenChange={(open) => {
          if (!open) setRequest(null);
        }}
      >
        {request && (
          <RecordForm
            request={request}
            onSaved={() => {
              refresh();
              setRequest(null);
            }}
          />
        )}
      </Dialog>
    </Context.Provider>
  );
}

function SignInDialog({
  open,
  onOpenChange,
  onSignedIn,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignedIn: (account: Account, token: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const credentials = {
        email: String(form.get("email")).trim(),
        password: form.get("password"),
      };
      if (creating) await api.post("/auth/register", credentials);
      const response = await api.post<{ user: Account; token: string }>(
        "/auth/login",
        credentials,
      );
      if (!response.data?.token)
        throw new Error(
          "The server did not return a session. Please try again.",
        );
      onSignedIn(response.data.user, response.data.token);
      toast.success(creating ? "Your account is ready" : "Welcome back");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not sign in. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Factory className="size-6" />
        </div>
        <DialogHeader>
          <DialogTitle>
            {creating ? "Create your account" : "Welcome to FactoryOps"}
          </DialogTitle>
          <DialogDescription>
            {creating
              ? "Start recording production and expenses with your own account."
              : "Sign in to view your reports and manage daily operations."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email address</Label>
            <Input
              autoComplete={creating ? "email" : "username"}
              type="email"
              id="login-email"
              name="email"
              placeholder="you@company.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              autoComplete={creating ? "new-password" : "current-password"}
              minLength={creating ? 6 : undefined}
              type="password"
              id="login-password"
              name="password"
              required
            />
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <Button disabled={busy} className="w-full" type="submit">
            {busy ? <LoaderCircle className="animate-spin" /> : <LogIn />}
            {creating ? "Create account" : "Sign in"}
          </Button>
          <Button
            type="button"
            variant="link"
            className="w-full text-xs"
            disabled={busy}
            onClick={() => {
              setError("");
              setCreating((value) => !value);
            }}
          >
            {creating
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RecordForm({
  request,
  onSaved,
}: {
  request: RecordRequest;
  onSaved: () => void;
}) {
  const production = request.kind === "production";
  const record = request.record;
  const [category, setCategory] = useState(
    request.kind === "expense"
      ? (request.record?.category ?? categories[0])
      : categories[0],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = Number(form.get("value"));
    if (
      !Number.isFinite(value) ||
      value < 0 ||
      (production && !Number.isSafeInteger(value))
    ) {
      setError(
        production
          ? "Enter a valid whole number of items."
          : "Enter a valid expense amount.",
      );
      return;
    }
    setBusy(true);
    setError("");
    const date = form.get("date");
    const notes = String(form.get("notes") ?? "").trim();
    const payload = production
      ? {
          production_date: date,
          items_produced: value,
          units: String(form.get("units")).trim(),
          notes,
        }
      : { expense_date: date, amount: value, category, description: notes };
    const path = production ? "/productions" : "/expenses";
    try {
      if (record) await api.put(`${path}/${record.id}`, payload);
      else await api.post(path, payload);
      toast.success(
        `${production ? "Production" : "Expense"} ${record ? "updated" : "recorded"}`,
      );
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save this record. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  const date =
    request.kind === "production"
      ? request.record?.production_date
      : request.record?.expense_date;
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {record ? "Edit" : "Record"} {production ? "production" : "expense"}
        </DialogTitle>
        <DialogDescription>
          {production
            ? "Keep a clear record of your daily factory output."
            : "Track spending with a date, category, and description."}
        </DialogDescription>
      </DialogHeader>
      <form className="space-y-5" onSubmit={submit}>
        <div className="space-y-2">
          <Label htmlFor="record-date">Date</Label>
          <Input
            id="record-date"
            name="date"
            type="date"
            defaultValue={date?.slice(0, 10) ?? localDate()}
            required
          />
        </div>
        {production ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="record-value">Items produced</Label>
              <Input
                id="record-value"
                name="value"
                type="number"
                min="0"
                max={Number.MAX_SAFE_INTEGER}
                step="1"
                placeholder="0"
                defaultValue={
                  request.kind === "production"
                    ? request.record?.items_produced
                    : undefined
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="record-units">Unit</Label>
              <Input
                id="record-units"
                name="units"
                defaultValue={
                  request.kind === "production"
                    ? (request.record?.units ?? "pcs")
                    : "pcs"
                }
                maxLength={30}
                required
              />
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="record-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="record-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set([...categories, category])).map(
                    (item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="record-value">Amount (USD)</Label>
              <Input
                id="record-value"
                name="value"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                defaultValue={
                  request.kind === "expense"
                    ? request.record?.amount
                    : undefined
                }
                required
              />
            </div>
          </>
        )}
        <div className="space-y-2">
          <Label htmlFor="record-notes">
            {production ? "Notes" : "Description"}{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Textarea
            id="record-notes"
            name="notes"
            maxLength={2000}
            placeholder={
              production
                ? "Shift, batch, or production details…"
                : "What was this expense for?"
            }
            defaultValue={
              request.kind === "production"
                ? request.record?.notes
                : request.record?.description
            }
          />
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy} className="w-full">
          {busy && <LoaderCircle className="animate-spin" />}
          {record
            ? "Save changes"
            : production
              ? "Save production"
              : "Save expense"}
        </Button>
      </form>
    </DialogContent>
  );
}
