"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  FileCheck2,
  KeyRound,
  QrCode,
  Send,
  ShieldCheck,
  ShieldQuestion,
  UploadCloud,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  Select,
  Tab,
  TabPanel,
  Tabs,
  TabsList,
} from "@/components/ui";
import { VerifyResultCard } from "@/components/verify-result";
import { api } from "@/lib/fetcher";
import { verifyInBrowser } from "@/lib/vc/client";
import { DEFAULT_DISCLOSED, FIELD_LABEL } from "@/lib/constants";
import type { VerifyResult } from "@/lib/vc/sdjwt";

type Outcome =
  | {
      result: VerifyResult;
      consent?: { consentId: string; requesterName: string; purpose: string; expiresAt: string };
      offline?: boolean;
    }
  | { error: string };

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
      code ? resolve(code.data) : reject(new Error("No valid QR credential detected in this image. Please provide a clear, well-lit image."));
    };
    img.onerror = () => reject(new Error("Failed to process the uploaded image"));
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
      const r = await api<{
        ok: boolean;
        reason?: string;
        result: VerifyResult;
        consent: { consentId: string; requesterName: string; purpose: string; expiresAt: string };
      }>("/api/v1/verify", "POST", { apaarId: a, code: c });
      setOut(r.ok ? { result: r.result, consent: r.consent } : { error: r.reason ?? "Verification unauthorized or expired" });
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
      if (!r.offline) api("/api/v1/verify", "POST", { credential: r.token }).catch(() => {});
    } catch (e) {
      setOut({ error: (e as Error).message || "Not a valid or authentic VidyaVerse credential" });
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
    } else if (params.get("apaar") && params.get("code")) {
      verifyCode(params.get("apaar")!, params.get("code")!);
    }
    // Warm public-key cache for offline verification
    import("@/lib/vc/client").then((m) => m.issuerKey()).catch(() => {});
  }, [params, verifyCode, verifyQr]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-navy-light px-3 py-1 text-xs font-semibold text-navy mb-3">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          <span>Official Verification Gateway</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
          Verify an Academic Credential
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
          Check the authenticity and current status of an academic credential through an authorized,
          consent-driven verification process with zero data leakage.
        </p>
      </div>

      {/* Verification Card with Tabs */}
      <Card className="shadow-card">
        <CardBody className="p-6">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-6">
              <Tab value="code" className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                <span>APAAR + Consent Code</span>
              </Tab>
              <Tab value="qr" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                <span>Scan / Paste QR</span>
              </Tab>
            </TabsList>

            {/* TAB 1: CODE VERIFICATION */}
            <TabPanel value="code">
              <form
                className="grid gap-4 sm:grid-cols-[1.4fr_1fr_auto] sm:items-end"
                onSubmit={(e) => {
                  e.preventDefault();
                  verifyCode(apaar, code);
                }}
              >
                <Field label="12-Digit Student APAAR ID" htmlFor="apaar">
                  <Input
                    id="apaar"
                    inputMode="numeric"
                    maxLength={12}
                    required
                    pattern="\d{12}"
                    value={apaar}
                    onChange={(e) => setApaar(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 982341904092"
                    className="font-mono"
                  />
                </Field>
                <Field label="6-Digit Consent Code" htmlFor="code" hint="Issued by the student">
                  <Input
                    id="code"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    pattern="\d{6}"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 481920"
                    className="font-mono text-center tracking-widest"
                  />
                </Field>
                <Button type="submit" size="lg" loading={busy} className="h-10">
                  <ShieldCheck className="h-4 w-4" /> Verify Record
                </Button>
              </form>
            </TabPanel>

            {/* TAB 2: QR CODE VERIFICATION */}
            <TabPanel value="qr">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
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
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" /> Scan QR from Camera / File
                  </Button>
                </div>

                <Field label="Or paste the credential string / verification link" htmlFor="qr">
                  <textarea
                    id="qr"
                    rows={3}
                    className="input h-auto py-2 font-mono text-xs leading-relaxed"
                    value={qrText}
                    onChange={(e) => setQrText(e.target.value)}
                    placeholder="https://.../verify#vc=eyJhbGciOiJFZERTQSI..."
                  />
                </Field>

                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    size="lg"
                    loading={busy}
                    disabled={!qrText.trim()}
                    onClick={() => verifyQr(qrText)}
                  >
                    <QrCode className="h-4 w-4" /> Verify Credential
                  </Button>
                  <p className="text-[11px] text-muted">
                    Works offline once AICTE public key is cached.
                  </p>
                </div>
              </div>
            </TabPanel>
          </Tabs>
        </CardBody>
      </Card>

      {/* Outcome Container */}
      <div className="mt-8">
        {out && "error" in out && (
          <div
            className="flex items-start gap-3 rounded-xl border border-[#F3B9B9] bg-[#FDECEC] p-5 shadow-xs"
            role="alert"
          >
            <ShieldQuestion className="h-6 w-6 shrink-0 text-danger mt-0.5" />
            <div>
              <p className="font-bold text-sm text-[#9E1C1C]">Credential Could Not Be Verified</p>
              <p className="mt-0.5 text-xs text-ink/80 leading-relaxed">{out.error}</p>
              <p className="mt-2 text-[11px] text-muted">
                Please double check the 12-digit APAAR ID and active consent code, or ask the student to regenerate their verification code.
              </p>
            </div>
          </div>
        )}

        {out && "result" in out && (
          <VerifyResultCard result={out.result} consent={out.consent} offline={out.offline} />
        )}
      </div>

      {/* Request Consent Section */}
      <RequestConsent defaultApaar={apaar} />
    </div>
  );
}

function RequestConsent({ defaultApaar }: { defaultApaar: string }) {
  const [form, setForm] = useState({
    apaarId: "",
    requesterName: "",
    requesterContact: "",
    requesterType: "employer",
    purpose: "employment",
    purposeNote: "",
  });
  const [fields, setFields] = useState<string[]>(DEFAULT_DISCLOSED);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Card className="mt-10 border border-line shadow-card">
      <CardHeader
        title="Don't have an active consent code?"
        description="Request verifiable consent directly from the student. The student is notified in their portal and via WhatsApp, choosing which fields to release."
      />
      <CardBody className="p-6">
        <div className="mb-6 rounded-xl border border-line bg-page p-3.5 text-xs text-muted">
          <p className="font-bold text-ink">Statutory Compliance / DPDP Act, 2023</p>
          <p className="mt-0.5">
            Data is shared solely for the stated purpose, strictly for fields approved by the student,
            and expires automatically. Unlawful retention or unauthorized processing is penalized under Indian law.
          </p>
        </div>

        {done ? (
          <div className="rounded-xl border border-[#B9DDB1] bg-[#EAF7EF] p-4 text-xs text-[#0E6106]" role="status">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="h-4 w-4" /> Consent Request Dispatched
            </div>
            <p className="mt-1">{done}</p>
          </div>
        ) : (
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                const r = await api<{ message: string; consentId: string }>("/api/v1/consent", "POST", {
                  ...form,
                  apaarId: form.apaarId || defaultApaar,
                  fieldsAllowed: fields,
                });
                setDone(`${r.message}. Reference identifier: ${r.consentId}`);
              } catch (err) {
                toast.error((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field label="Student APAAR ID" htmlFor="r-apaar">
              <Input
                id="r-apaar"
                required
                pattern="\d{12}"
                maxLength={12}
                value={form.apaarId || defaultApaar}
                onChange={set("apaarId")}
                placeholder="12-digit number"
                className="font-mono"
              />
            </Field>

            <Field label="Organization / Verifier Name" htmlFor="r-name">
              <Input
                id="r-name"
                required
                minLength={2}
                value={form.requesterName}
                onChange={set("requesterName")}
                placeholder="e.g. Infosys Ltd or University Admissions"
              />
            </Field>

            <Field label="Contact (WhatsApp number or Email)" htmlFor="r-contact">
              <Input
                id="r-contact"
                required
                value={form.requesterContact}
                onChange={set("requesterContact")}
                placeholder="e.g. +91 98765 43210 or hr@company.com"
              />
            </Field>

            <Field label="Requester Classification" htmlFor="r-type">
              <Select id="r-type" value={form.requesterType} onChange={set("requesterType")}>
                <option value="employer">Employer / Recruiter</option>
                <option value="institution">Academic Institution</option>
                <option value="regulator">State / National Regulator</option>
                <option value="other">Authorized Third Party</option>
              </Select>
            </Field>

            <Field label="Verification Purpose" htmlFor="r-purpose">
              <Select id="r-purpose" value={form.purpose} onChange={set("purpose")}>
                <option value="employment">Employment Background Verification</option>
                <option value="higher-studies">Higher Studies Admission</option>
                <option value="regulatory">Regulatory Compliance Audit</option>
                <option value="other">Other Legitimate Purpose</option>
              </Select>
            </Field>

            <Field label="Purpose Description" htmlFor="r-note">
              <Input
                id="r-note"
                maxLength={300}
                value={form.purposeNote}
                onChange={set("purposeNote")}
                placeholder="e.g. Verification for Graduate Engineer Trainee role"
              />
            </Field>

            <fieldset className="sm:col-span-2 pt-2">
              <legend className="label mb-2">Requested Information Fields</legend>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {["name", "institution", "program", "academicYear", "status", "dob", "outcome"].map((f) => (
                  <label
                    key={f}
                    className="flex items-center gap-2 rounded-lg border border-line bg-page px-3 py-2 text-xs font-medium text-ink cursor-pointer hover:border-navy"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded accent-navy"
                      checked={fields.includes(f)}
                      onChange={(e) =>
                        setFields((x) => (e.target.checked ? [...x, f] : x.filter((y) => y !== f)))
                      }
                    />
                    <span>{FIELD_LABEL[f] ?? f}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="sm:col-span-2 pt-2">
              <Button type="submit" size="lg" loading={busy} disabled={!fields.length}>
                <Send className="h-4 w-4" /> Dispatch Consent Request
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
