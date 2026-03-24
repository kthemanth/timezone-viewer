import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { supabase } from "../utils/supabaseClient";
import { GlassInput, GlassButton, GlassBadge } from "../components/ui";

export default function SignIn() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans"
      style={{ background: '#06061a' }}
    >
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute -top-20 -left-10 w-[280px] h-[280px]" style={{ background: 'radial-gradient(ellipse,rgba(99,102,241,0.18) 0%,transparent 65%)', borderRadius: '50%' }} />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[200px]" style={{ background: 'radial-gradient(ellipse,rgba(139,92,246,0.07) 0%,transparent 70%)', borderRadius: '50%' }} />
      <div className="pointer-events-none absolute -bottom-16 -right-10 w-[260px] h-[260px]" style={{ background: 'radial-gradient(ellipse,rgba(217,70,239,0.12) 0%,transparent 65%)', borderRadius: '50%' }} />

      {/* Grid texture */}
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.03) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Glass card */}
      <div
        className="relative z-10 w-full max-w-sm rounded-[20px] p-8"
        style={{ background: 'rgba(13,13,43,0.8)', border: '1px solid rgba(99,102,241,0.22)', backdropFilter: 'blur(24px)', boxShadow: '0 0 60px rgba(99,102,241,0.08),0 24px 48px rgba(0,0,0,0.4)' }}
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-[14px] inline-flex items-center justify-center mb-3 overflow-hidden" style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', boxShadow: '0 0 24px rgba(99,102,241,0.5)' }}><img src="/favicon.png" alt="Quinn's Calendar" className="w-8 h-8 object-contain" /></div>
          <div className="text-lg font-extrabold text-slate-100 tracking-tight">Quinn&apos;s Calendar</div>
          <div className="text-[11px] text-slate-600 mt-0.5 font-medium">Invite-only · Encrypted</div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <GlassInput
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <div className="relative">
            <GlassInput
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-[30px] text-slate-600 hover:text-slate-400 transition-colors text-sm"
              tabIndex={-1}
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>

          {error && <GlassBadge variant="error" className="self-start">{error}</GlassBadge>}

          <GlassButton type="submit" variant="primary" disabled={busy} className="w-full mt-1">
            {busy ? 'Signing in…' : 'Sign in →'}
          </GlassButton>
        </form>

        {/* Footer links */}
        <div className="flex justify-between mt-4">
          <button type="button" onClick={sendResetLink} className="text-[11px] text-slate-600 hover:text-indigo-400 transition-colors">Forgot password?</button>
          <button type="button" onClick={() => navigate('/change-password')} className="text-[11px] text-slate-600 hover:text-indigo-400 transition-colors">Change password</button>
        </div>

        {/* Bottom glow */}
        <div className="absolute bottom-0 left-[20%] right-[20%] h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(99,102,241,0.5),rgba(217,70,239,0.5),transparent)', borderRadius: 1 }} />
      </div>
    </div>
  )
}
