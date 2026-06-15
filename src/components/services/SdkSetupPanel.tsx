import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  IconCircleCheck,
  IconClock,
  IconSend,
  IconShieldCheck,
  IconStack,
} from "@tabler/icons-react";
import { ingestLog } from "@/api/ingest";
import { listApiKeys } from "@/api/services";
import { Button, Input, Label, Select } from "@/components/ui";
import { getIngestBase } from "@/lib/utils";
import { getTestApiKey, saveTestApiKey } from "@/lib/testKeyStorage";
import type { Severity } from "@/types/api";

interface SdkSetupPanelProps {
  serviceName: string;
  orgId: string;
  serviceId: string;
  canManageKeys: boolean;
}

export function SdkSetupPanel({
  serviceName,
  orgId,
  serviceId,
  canManageKeys,
}: SdkSetupPanelProps) {
  const ingestUrl = getIngestBase();

  const [apiKey, setApiKey] = useState("");
  const [testMessage, setTestMessage] = useState("Hello from LogLens SDK setup");
  const [testSeverity, setTestSeverity] = useState<Severity>("INFO");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const { data: keys = [] } = useQuery({
    queryKey: ["api-keys", orgId, serviceId],
    queryFn: () => listApiKeys(orgId, serviceId),
    enabled: canManageKeys,
  });

  useEffect(() => {
    const stored = getTestApiKey(serviceId);
    if (stored) setApiKey(stored);
  }, [serviceId]);

  const activeKeyCount = keys.filter((k) => !k.revoked_at).length;

  const installCmd = `go get github.com/loglens/loglens-go@v1.0.0`;

  const initCode = `import (
    "context"
    loglens "github.com/loglens/loglens-go"
)

func main() {
    client := loglens.New(loglens.Config{
        APIKey:    os.Getenv("LOGLENS_KEY"),
        ServiceID: "${serviceId}",
        Endpoint:  "${ingestUrl}",
    })
    defer client.Flush(context.Background())
}`;

  const logCode = `client.Info(ctx, "payment processed", loglens.Fields{
    "amount":   1200,
    "currency": "INR",
})

client.Error(ctx, "gateway timeout", loglens.Fields{"after_ms": 5000})`;

  const curlCode = `curl -X POST "${ingestUrl}/v1/logs" \\
  -H "Authorization: Bearer $LOGLENS_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"severity":"ERROR","message":"payment failed","metadata":{"order_id":"123"}}'`;

  const handleSendTest = async () => {
    if (!apiKey.trim()) {
      setSendResult({ ok: false, text: "Paste an API key first" });
      return;
    }
    setSending(true);
    setSendResult(null);
    try {
      saveTestApiKey(serviceId, apiKey.trim());
      const result = await ingestLog(apiKey.trim(), {
        severity: testSeverity,
        message: testMessage.trim(),
        metadata: { source: "loglens-ui-test" },
      });
      setSendResult({
        ok: true,
        text: `Log ingested · id ${result.id.slice(0, 8)}…`,
      });
    } catch (err) {
      setSendResult({
        ok: false,
        text: err instanceof Error ? err.message : "Ingest failed",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4 p-5">
      <div className="rounded-ll border border-ll-border bg-ll-elevated p-4">
        <div className="mb-3 text-xs font-medium text-ll-text">Send test log</div>
        <div className="mb-3">
          <Label>API key</Label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="ll_… (from API keys tab)"
            className="font-mono text-xs"
          />
          <p className="mt-1 text-[10px] text-ll-text-faint">
            {activeKeyCount > 0
              ? `${activeKeyCount} active key(s). Key is saved in this browser session only.`
              : "Generate a key on the API keys tab first."}
          </p>
        </div>
        <div className="mb-3 grid gap-3 md:grid-cols-[1fr_120px]">
          <div>
            <Label>Message</Label>
            <Input
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
            />
          </div>
          <div>
            <Label>Severity</Label>
            <Select
              value={testSeverity}
              onChange={(e) => setTestSeverity(e.target.value as Severity)}
              className="w-full"
            >
              {(["DEBUG", "INFO", "WARN", "ERROR", "FATAL"] as Severity[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ),
              )}
            </Select>
          </div>
        </div>
        <Button variant="accent" onClick={handleSendTest} disabled={sending}>
          <IconSend size={14} />
          {sending ? "Sending…" : "Send test log"}
        </Button>
        {sendResult && (
          <p
            className={`mt-2 text-xs ${sendResult.ok ? "text-[#00c97e]" : "text-ll-error"}`}
          >
            {sendResult.text}
          </p>
        )}
      </div>

      <CodeBlock title="bash" code={installCmd} />
      <CodeBlock title="Go — Initialise" code={initCode} />
      <CodeBlock title="Go — Send logs" code={logCode} />
      <CodeBlock title="curl — Test ingest" code={curlCode} />

      <div className="grid gap-2.5 md:grid-cols-3">
        {[
          {
            icon: <IconShieldCheck size={16} className="text-[#00c97e]" />,
            title: "Use env vars in prod",
            sub: 'Never hardcode keys. Use os.Getenv("LOGLENS_KEY").',
          },
          {
            icon: <IconStack size={16} className="text-ll-warn" />,
            title: "Logs are batched",
            sub: "SDK buffers and sends every 500ms. Call Flush() on shutdown.",
          },
          {
            icon: <IconClock size={16} className="text-ll-info" />,
            title: "Async by default",
            sub: "Ingestion is non-blocking for your application.",
          },
        ].map((h) => (
          <div
            key={h.title}
            className="rounded-ll border border-ll-border bg-ll-elevated p-3"
          >
            <div className="mb-1.5">{h.icon}</div>
            <div className="text-xs font-medium text-ll-text">{h.title}</div>
            <div className="mt-0.5 text-[11px] leading-relaxed text-ll-text-dim">
              {h.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2.5 rounded-ll border border-[#00FF9C33] bg-[#0d2b1f] px-3.5 py-2.5">
        <IconCircleCheck size={18} className="text-ll-accent" />
        <span className="text-xs text-[#00c97e]">
          After sending, check Search for {serviceName}
        </span>
        <Link
          to={`/org/${orgId}/search`}
          className="ml-auto flex items-center gap-1 text-xs text-ll-accent"
        >
          View in search →
        </Link>
      </div>
    </div>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden rounded-ll border border-ll-border bg-ll-elevated">
      <div className="flex items-center justify-between border-b border-ll-border px-3.5 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ll-text-faint">
          {title}
        </span>
        <button
          type="button"
          onClick={copy}
          className="text-[11px] text-ll-text-faint hover:text-ll-text-muted"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 font-mono text-[11px] leading-relaxed text-[#a0b8c4]">
        {code}
      </pre>
    </div>
  );
}
