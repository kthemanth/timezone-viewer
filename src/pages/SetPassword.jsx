import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { GlassInput, GlassButton, GlassBadge } from "../components/ui";

function parseHashParams() {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  return new URLSearchParams(hash);
}

function getPasswordStrength(pwd) {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;
  return score; // 0-4
}

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["", "#ef4444", "#f59e0b", "#eab308", "#10b981"];

export default function SetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!supabase) {
        setError("Supabase config missing.");
        return;
      }

      const params = parseHashParams();
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      try {
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
        }

        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          throw new Error("Invalid or expired invite/reset link.");
        }

        if (!cancelled) {
          setReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to verify password setup link.");
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to set password.");
    } finally {
      setBusy(false);
    }
  }

  const strength = getPasswordStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans" style={{ background: "#06061a" }}>
      {/* Orbs */}
      <div className="pointer-events-none absolute -top-10 -right-10 w-[260px] h-[260px]" style={{ background: "radial-gradient(ellipse,rgba(168,85,247,0.15) 0%,transparent 65%)", borderRadius: "50%" }} />
      <div className="pointer-events-none absolute -bottom-10 -left-5 w-[220px] h-[220px]" style={{ background: "radial-gradient(ellipse,rgba(99,102,241,0.10) 0%,transparent 65%)", borderRadius: "50%" }} />
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(139,92,246,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.03) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="relative z-10 w-full max-w-sm rounded-[20px] p-8" style={{ background: "rgba(13,13,43,0.8)", border: "1px solid rgba(139,92,246,0.22)", backdropFilter: "blur(24px)", boxShadow: "0 0 60px rgba(139,92,246,0.08),0 24px 48px rgba(0,0,0,0.4)" }}>

        {/* Step indicator (decorative) */}
        <div className="flex gap-1.5 mb-6 justify-center">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i < 2 ? "linear-gradient(90deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.07)" }} />
          ))}
        </div>

        <div className="text-center mb-6">
          <div className="w-11 h-11 rounded-[12px] inline-flex items-center justify-center text-xl mb-3" style={{ background: "linear-gradient(135deg,#8b5cf6,#d946ef)", boxShadow: "0 0 20px rgba(139,92,246,0.5)" }}>🔑</div>
          <div className="text-base font-extrabold text-slate-100 tracking-tight">Set Your Password</div>
          <div className="text-[11px] text-slate-600 mt-0.5">You&apos;ve been invited. Choose a strong password.</div>
        </div>

        {!ready && !error && (
          <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
            <span className="text-[11px] font-medium text-slate-400">Verifying link…</span>
          </div>
        )}

        {!ready && error && (
          <GlassBadge variant="error" className="self-start">{error}</GlassBadge>
        )}

        {ready && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <GlassInput label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" required />
            <GlassInput label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" required />

            {/* Strength bar */}
            {password && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[9px] text-slate-600 uppercase tracking-wider">Strength</span>
                  <span className="text-[9px] font-semibold" style={{ color: STRENGTH_COLORS[strength] }}>{STRENGTH_LABELS[strength]}</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex-1 h-[3px] rounded-full transition-all duration-300"
                      style={{ background: i <= strength ? STRENGTH_COLORS[strength] : "rgba(255,255,255,0.07)" }} />
                  ))}
                </div>
              </div>
            )}

            {error && <GlassBadge variant="error" className="self-start">{error}</GlassBadge>}
            <GlassButton type="submit" variant="primary" disabled={busy} className="w-full mt-1">
              {busy ? "Setting password…" : "Set Password →"}
            </GlassButton>
          </form>
        )}
      </div>
    </div>
  );
}
