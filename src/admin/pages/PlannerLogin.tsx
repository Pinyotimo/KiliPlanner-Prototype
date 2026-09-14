import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { navigateToPlanner, usePlannerSession } from "../lib/plannerAccess";

export default function PlannerLogin() {
  const { session } = usePlannerSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigateToPlanner("/planner");
  }, [session]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);
    if (signInError) {
      setError("Unable to sign in. Check your email and password, then try again.");
      return;
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <section className="w-full max-w-md rounded-2xl bg-card p-8 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">KILIPLANNER</p>
        <h1 className="mt-3 text-2xl font-bold text-foreground">Planner Console</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in with your authorized planner account.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block text-sm font-medium text-foreground">Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 block w-full rounded-lg border border-input px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></label>
          <label className="block text-sm font-medium text-foreground">Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 block w-full rounded-lg border border-input px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></label>
          {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Signing in..." : "Sign in"}</button>
        </form>
        <a href="/" className="mt-6 block text-center text-sm font-medium text-muted-foreground hover:text-foreground">Return to public map</a>
      </section>
    </main>
  );
}