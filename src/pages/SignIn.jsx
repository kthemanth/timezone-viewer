import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { hasSupabaseConfig, supabase } from "../utils/supabaseClient";

export default function SignIn() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-slate-600">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      if (!supabase) {
        throw new Error("Supabase config missing.");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendResetLink() {
    setError("");
    if (!email) {
      setError("Enter your invited email first, then request reset link.");
      return;
    }

    setBusy(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/set-password`,
      });
      if (resetError) throw resetError;
      setError("Password reset link sent. Check your email.");
    } catch (err) {
      setError(err.message || "Failed to send reset link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 grid place-items-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Quinn's Calendar</h1>
        <p className="mt-1 text-sm text-slate-500">Invite-only access. Contact admin if you need an account.</p>

        {!hasSupabaseConfig ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Missing Supabase env. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
          </div>
        ) : null}

        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={busy || !hasSupabaseConfig}
            className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Please wait..." : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          onClick={sendResetLink}
          disabled={busy || !hasSupabaseConfig}
          className="mt-3 text-sm text-slate-600 underline disabled:opacity-50"
        >
          Forgot password?
        </button>
      </div>
    </div>
  );
}
