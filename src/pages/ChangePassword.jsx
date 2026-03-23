import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { GlassInput, GlassButton, GlassBadge } from "../components/ui";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (signInError) throw signInError;

      if (!signInData?.user) {
        throw new Error("Unable to verify current credentials.");
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      setSuccess("Password updated successfully. You can now sign in.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      await supabase.auth.signOut();
      setTimeout(() => navigate("/signin", { replace: true }), 900);
    } catch (err) {
      setError(err.message || "Failed to update password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans" style={{ background: "#06061a" }}>
      <div className="pointer-events-none absolute -top-10 -right-10 w-[260px] h-[260px]" style={{ background: "radial-gradient(ellipse,rgba(168,85,247,0.15) 0%,transparent 65%)", borderRadius: "50%" }} />
      <div className="pointer-events-none absolute -bottom-10 -left-5 w-[220px] h-[220px]" style={{ background: "radial-gradient(ellipse,rgba(99,102,241,0.10) 0%,transparent 65%)", borderRadius: "50%" }} />
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(139,92,246,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.03) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="relative z-10 w-full max-w-sm rounded-[20px] p-8" style={{ background: "rgba(13,13,43,0.8)", border: "1px solid rgba(139,92,246,0.22)", backdropFilter: "blur(24px)", boxShadow: "0 0 60px rgba(139,92,246,0.08),0 24px 48px rgba(0,0,0,0.4)" }}>

        <div className="flex gap-1.5 mb-6 justify-center">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i === 1 ? "linear-gradient(90deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.07)" }} />
          ))}
        </div>

        <div className="text-center mb-6">
          <div className="w-11 h-11 rounded-[12px] inline-flex items-center justify-center text-xl mb-3" style={{ background: "linear-gradient(135deg,#8b5cf6,#d946ef)", boxShadow: "0 0 20px rgba(139,92,246,0.5)" }}>🔐</div>
          <div className="text-base font-extrabold text-slate-100 tracking-tight">Change Password</div>
          <div className="text-[11px] text-slate-600 mt-0.5">Enter your current password to continue.</div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <GlassInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <GlassInput label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          <GlassInput label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          <GlassInput label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />

          <GlassBadge variant="warn" className="self-start text-[10px]">You&apos;ll stay logged in on this device</GlassBadge>

          {error && <GlassBadge variant="error" className="self-start">{error}</GlassBadge>}
          {success && <GlassBadge variant="success" className="self-start">Password updated!</GlassBadge>}

          <GlassButton type="submit" variant="primary" disabled={busy} className="w-full mt-1">
            {busy ? "Updating…" : "Update Password →"}
          </GlassButton>
        </form>

        <div className="mt-4 text-center">
          <Link to="/signin" className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
