import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { login, register } from "@/api/auth";
import { joinByCode, joinByToken } from "@/api/orgs";
import { useAuthStore } from "@/stores/authStore";
import { Button, ErrorBanner, Input, Label } from "@/components/ui";
import { ApiClientError } from "@/api/client";

const DEMO_LOGS = [
  { t: "14:32:01", l: "ERROR", m: "gateway timeout — retrying attempt=2" },
  { t: "14:32:00", l: "INFO", m: "token refreshed for user 7721" },
  { t: "14:31:59", l: "WARN", m: "retry attempt 2/3 order #88201" },
  { t: "14:31:58", l: "ERROR", m: "DB deadlock detected txn=7f90b" },
  { t: "14:31:57", l: "DEBUG", m: "cache hit sess:7721:v2" },
  { t: "14:31:56", l: "INFO", m: "order #88190 placed — ₹840" },
  { t: "14:31:55", l: "ERROR", m: "razorpay status=503 ch_9f2a" },
  { t: "14:31:54", l: "WARN", m: "connection pool near limit 48/50" },
  { t: "14:31:53", l: "INFO", m: "health check ok latency=12ms" },
];

const levelClass: Record<string, string> = {
  ERROR: "bg-[#2b0e0e] text-ll-error",
  INFO: "bg-[#08182b] text-ll-info",
  WARN: "bg-[#2b1e08] text-ll-warn",
  DEBUG: "bg-ll-muted text-[#3a5060]",
};

export function AuthPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const tokens = await login(loginEmail, loginPassword);
      setTokens(tokens.access_token, tokens.refresh_token);
      navigate("/orgs");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const tokens = await register(regEmail, regPassword);
      setTokens(tokens.access_token, tokens.refresh_token);
      navigate("/orgs");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const isToken = joinCode.length > 10;
      const result = isToken
        ? await joinByToken(joinCode.trim())
        : await joinByCode(joinCode.trim().toUpperCase());
      navigate(`/org/${result.org_id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Join failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ll-bg p-6">
      <div className="grid min-h-[480px] w-full max-w-4xl overflow-hidden rounded-xl border border-ll-border bg-ll-bg md:grid-cols-2">
        <div className="flex flex-col justify-between border-b border-ll-border bg-ll-elevated p-7 md:border-b-0 md:border-r">
          <div>
            <div className="mb-8 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-ll-accent" />
              <span className="font-mono text-sm font-medium tracking-wider text-ll-accent">
                LogLens
              </span>
            </div>
            <div className="mb-2.5 text-[10px] uppercase tracking-wider text-[#3a4a55]">
              Live · payment-svc
            </div>
            <div className="space-y-0">
              {DEMO_LOGS.map((line) => (
                <div
                  key={line.t + line.m}
                  className="flex items-baseline gap-2 border-b border-[#141a1e] py-1"
                >
                  <span className="shrink-0 font-mono text-[10px] text-[#2a3a44]">
                    {line.t}
                  </span>
                  <span
                    className={`shrink-0 rounded px-1 font-mono text-[9px] ${levelClass[line.l]}`}
                  >
                    {line.l}
                  </span>
                  <span className="truncate font-mono text-[10px] text-[#3a5060]">
                    {line.m}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5">
            <div className="text-[13px] font-medium text-ll-text">
              Your logs. Instantly searchable.
            </div>
            <div className="text-[11px] text-ll-text-faint">
              Ingest → search → investigate in minutes.
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center p-8">
          {showJoin ? (
            <>
              <div className="mb-1 text-lg font-medium text-ll-text">Join organization</div>
              <div className="mb-6 text-xs text-ll-text-dim">
                Enter an invite code or token
              </div>
              <form onSubmit={handleJoin}>
                <div className="mb-3.5">
                  <Label>Invite code or token</Label>
                  <Input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="ABC123 or invite token"
                  />
                </div>
                {error && <ErrorBanner message={error} />}
                <Button type="submit" className="mt-2 w-full" disabled={loading}>
                  Join org
                </Button>
              </form>
              <button
                type="button"
                className="mt-4 text-center text-xs text-ll-text-dim"
                onClick={() => setShowJoin(false)}
              >
                ← Back to sign in
              </button>
            </>
          ) : (
            <>
              <div className="mb-1 text-lg font-medium text-ll-text">Sign in</div>
              <div className="mb-6 text-xs text-ll-text-dim">Welcome back to LogLens</div>

              <form onSubmit={handleLogin}>
                <div className="mb-3.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                  />
                </div>
                <div className="mb-3.5">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input
                      type={showPw ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pr-9"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ll-text-faint"
                      onClick={() => setShowPw(!showPw)}
                    >
                      {showPw ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                    </button>
                  </div>
                </div>
                {error && <ErrorBanner message={error} />}
                <Button type="submit" className="mt-2 w-full" disabled={loading}>
                  Sign in
                </Button>
              </form>

              <div className="my-4 flex items-center gap-2.5">
                <div className="h-px flex-1 bg-ll-border" />
                <span className="text-[11px] text-[#3a4a55]">new here?</span>
                <div className="h-px flex-1 bg-ll-border" />
              </div>

              <div className="rounded-ll border border-ll-border bg-ll-elevated p-3.5">
                <form onSubmit={handleRegister}>
                  <div className="mb-2.5">
                    <Label>Work email</Label>
                    <Input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="bg-ll-muted"
                      required
                    />
                  </div>
                  <div className="mb-2.5">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="min 8 characters"
                      className="bg-ll-muted"
                      minLength={8}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full cursor-pointer rounded-ll border border-[#00FF9C55] bg-[#0d2b1f] py-2 text-[13px] text-ll-accent"
                  >
                    Create account
                  </button>
                </form>
              </div>

              <div className="mt-3 text-center text-[11px] text-ll-text-faint">
                Have an invite code?{" "}
                <button
                  type="button"
                  className="text-ll-accent"
                  onClick={() => setShowJoin(true)}
                >
                  Join your org →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
