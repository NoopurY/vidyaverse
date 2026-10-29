"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Camera, QrCode, Send, ShieldQuestion } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, CardBody, CardHeader, Field, Input, Select, Tab, TabPanel, Tabs, TabsList } from "@/components/ui";
import { VerifyResultCard } from "@/components/verify-result";
import { api } from "@/lib/fetcher";
import { verifyInBrowser } from "@/lib/vc/client";
import { DEFAULT_DISCLOSED, FIELD_LABEL } from "@/lib/constants";
import type { VerifyResult } from "@/lib/vc/sdjwt";

type Outcome = { result: VerifyResult; consent?: { consentId: string; requesterName: string; purpose: string; expiresAt: string }; offline?: boolean } | { error: string };

function decodeQrImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const jsQR = (await import("jsqr")).default;
      const code = jsQR(data.data, data.width, data.height);
      URL.revokeObjectURL(img.src);
      code ? resolve(code.data) : reject(new Error("No QR code found in the image. Try a clearer photo."));
    };
    img.onerror = () => reject(new Error("Could not read the image"));
    img.src = URL.createObjectURL(file);
  });
}

function VerifyInner() {
  const params = useSearchParams();
  const [tab, setTab] = useState("code");
  const [apaar, setApaar] = useState(params.get("apaar") ?? "");
  const [code, setCode] = useState(params.get("code") ?? "");
  const [qrText, setQrText] = useState("");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<Outcome | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const verifyCode = useCallback(async (a: string, c: string) => {
    setBusy(true);
    setOut(null);
    try {
      const r = await api<{ ok: boolean; reason?: string; result: VerifyResult; consent: { consentId: string; requesterName: string; purpose: string; expiresAt: string } }>("/api/v1/verify", "POST", { apaarId: a, code: c });
      setOut(r.ok ? { result: r.result, consent: r.consent } : { error: r.reason ?? "Not authorised" });
    } catch (e) {
      setOut({ error: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }, []);

  const verifyQr = useCallback(async (text: string) => {
    setBusy(true);
    setOut(null);
    try {
      const r = await verifyInBrowser(text);
      setOut({ result: r.result, offline: r.offline });
      if (!r.offline) api("/api/v1/verify", "POST", { credential: r.token }).catch(() => {}); // server-side verification log
    } catch (e) {
      setOut({ error: (e as Error).message || "Not a valid VidyaVerse credential" });
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash.includes("vc=")) {
      setTab("qr");
      setQrText(hash.slice(1));
      verifyQr(hash.slice(1));
    } else if (params.get("apaar") && params.get("code")) verifyCode(params.get("apaar")!, params.get("code")!);
    // warm the public-key cache for offline use
    import("@/lib/vc/client").then((m) => m.issuerKey()).catch(() => {});
  }, [params, verifyCode, verifyQr]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="page-title">Verify a student</h1>
      <p className="mt-1 text-sm text-muted">Verification is always consent-based. Every verification is logged and visible to the student.</p>

      <Card className="mt-6">
        <CardBody>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <Tab value="code">APAAR + Consent Code</Tab>
              <Tab value="qr">Scan / Paste QR</Tab>
            </TabsList>
            <TabPanel value="code">
              <form
                className="grid gap-4 sm:grid-cols-[1fr_200px_auto] sm:items-end"
                onSubmit={(e) => {
                  e.preventDefault();
                  verifyCode(apaar, code);
                }}
              >
                <Field label="APAAR ID" htmlFor="apaar">
                  <Input id="apaar" inputMode="numeric" maxLength={12} required pattern="\d{12}" value={apaar} onChange={(e) => setApaar(e.target.value.replace(/\D/g, ""))} placeholder="12-digit APAAR ID" />
                </Field>
                <Field label="Consent code" htmlFor="code">
                  <Input id="code" inputMode="numeric" maxLength={6} required pattern="\d{6}" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="6 digits" />
                </Field>
                <Button type="submit" size="lg" loading={busy}>
                  Verify
                </Button>
              </form>
            </TabPanel>
            <TabPanel value="qr">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        const text = await decodeQrImage(f);
                        setQrText(text);
                        verifyQr(text);
                      } catch (err) {
                        toast.error((err as Error).message);
                      }
                      e.target.value = "";
                    }}
                  />
                  <Button type="button" variant="secondary" size="lg" onClick={() => fileRef.current?.click()}>
                    <Camera className="h-5 w-5" aria-hidden /> Scan QR (camera / photo)
                  </Button>
                </div>
                <Field label="…or paste the QR link / credential" htmlFor="qr">
                  <textarea id="qr" rows={4} className="input h-auto py-2 font-mono text-xs" value={qrText} onChange={(e) => setQrText(e.target.value)} placeholder="https://…/verify#vc=eyJ…" />
                </Field>
                <Button type="button" size="lg" loading={busy} disabled={!qrText.trim()} onClick={() => verifyQr(qrText)}>
                  <QrCode className="h-5 w-5" aria-hidden /> Verify credential
                </Button>
                <p className="text-xs text-muted">QR credentials are verified in your browser with AICTE&apos;s public key (works offline once the key is cached); the revocation list is checked when online.</p>
              </div>
            </TabPanel>
          </Tabs>
        </CardBody>
      </Card>

      <div className="mt-6">
        {out && "error" in out && (
          <Card className="flex items-start gap-3 border-[#F3B9B9] bg-[#FDECEC] p-5" role="alert">
            <ShieldQuestion className="h-6 w-6 shrink-0 text-danger" aria-hidden />
            <div>
              <p className="font-semibold text-[#9E1C1C]">Not verified</p>
              <p className="text-sm">{out.error}</p>
            </div>
          </Card>
        )}
        {out && "result" in out && <VerifyResultCard result={out.result} consent={out.consent} offline={out.offline} />}
      </div>

      <RequestConsent defaultApaar={apaar} />
    </div>
  );
}

function RequestConsent({ defaultApaar }: { defaultApaar: string }) {
  const [form, setForm] = useState({ apaarId: "", requesterName: "", requesterContact: "", requesterType: "employer", purpose: "employment", purposeNote: "" });
  const [fields, setFields] = useState<string[]>(DEFAULT_DISCLOSED);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Card className="mt-8">
      <CardHeader title="Don't have a consent code?" description="Request consent. The student is notified in the portal and on WhatsApp and decides what to share." />
      <CardBody>
        <div className="mb-4 rounded border border-line bg-page p-3 text-xs text-muted">
          <p className="font-semibold text-ink">Notice / सूचना</p>
          <p className="mt-1">Data is shared only for the stated purpose, only the fields the student approves, and only until expiry. Misuse is an offence under the DPDP Act, 2023.</p>
          <p className="mt-1" lang="hi">डेटा केवल बताए गए उद्देश्य, छात्र द्वारा स्वीकृत फ़ील्ड और समाप्ति तिथि तक ही साझा होता है।</p>
        </div>
        {done ? (
          <p className="rounded bg-[#E7F4E4] px-4 py-3 text-sm text-[#0E6106]" role="status">{done}</p>
        ) : (
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                const r = await api<{ message: string; consentId: string }>("/api/v1/consent", "POST", { ...form, apaarId: form.apaarId || defaultApaar, fieldsAllowed: fields });
                setDone(`${r.message} Reference: ${r.consentId}`);
              } catch (err) {
                toast.error((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field label="Student APAAR ID" htmlFor="r-apaar">
              <Input id="r-apaar" required pattern="\d{12}" maxLength={12} value={form.apaarId || defaultApaar} onChange={set("apaarId")} />
            </Field>
            <Field label="Organisation / your name" htmlFor="r-name">
              <Input id="r-name" required minLength={2} value={form.requesterName} onChange={set("requesterName")} />
            </Field>
            <Field label="Contact (WhatsApp number or email)" htmlFor="r-contact">
              <Input id="r-contact" required value={form.requesterContact} onChange={set("requesterContact")} />
            </Field>
            <Field label="Requester type" htmlFor="r-type">
              <Select id="r-type" value={form.requesterType} onChange={set("requesterType")}>
                <option value="employer">Employer</option>
                <option value="institution">Institution</option>
                <option value="regulator">Regulator</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Purpose (required)" htmlFor="r-purpose">
              <Select id="r-purpose" value={form.purpose} onChange={set("purpose")}>
                <option value="employment">Employment verification</option>
                <option value="higher-studies">Higher-studies admission</option>
                <option value="regulatory">Regulatory check</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Purpose details" htmlFor="r-note">
              <Input id="r-note" maxLength={300} value={form.purposeNote} onChange={set("purposeNote")} placeholder="e.g. Offer letter for Software Engineer role" />
            </Field>
            <fieldset className="sm:col-span-2">
              <legend className="label">Fields requested</legend>
              <div className="flex flex-wrap gap-3">
                {["name", "institution", "program", "academicYear", "status", "dob", "outcome"].map((f) => (
                  <label key={f} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 accent-navy" checked={fields.includes(f)} onChange={(e) => setFields((x) => (e.target.checked ? [...x, f] : x.filter((y) => y !== f)))} />
                    {FIELD_LABEL[f]}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="sm:col-span-2">
              <Button type="submit" loading={busy} disabled={!fields.length}>
                <Send className="h-4 w-4" aria-hidden /> Request consent
              </Button>
            </div>
          </form>
        )}
      </CardBody>
    </Card>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyInner />
    </Suspense>
  );
}
