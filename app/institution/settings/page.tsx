"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { Copy, KeyRound, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, CardBody, CardHeader, ConfirmDialog, Dialog, EmptyState, Field, Input, PageHeader, Select, StatusBadge, Table } from "@/components/ui";
import type { InstitutionDetail } from "@/components/shared/types";
import { api } from "@/lib/fetcher";
import { fmtDate } from "@/lib/utils";

type Creds = { clientId: string; clientSecret: string; apiKey: string; webhookSecret: string };

export default function InstitutionSettings() {
  const { data: session } = useSession();
  const id = session?.user?.institutionId;
  const isAdmin = session?.user?.permission === "admin";
  const { data, mutate } = useSWR<InstitutionDetail>(id ? `/api/v1/institutions/${id}` : null);
  const { data: users, mutate: refreshUsers } = useSWR<{ items: { _id: string; name: string; email: string; permission: string; lastLogin?: string; active: boolean }[] }>(id && isAdmin ? `/api/v1/institutions/${id}/users` : null);
  const [contact, setContact] = useState({ contactPhone: "", webhookUrl: "" });
  const [creds, setCreds] = useState<Creds | null>(null);
  const [rotate, setRotate] = useState(false);
  const [addUser, setAddUser] = useState(false);
  const [nu, setNu] = useState({ name: "", email: "", password: "", phone: "", permission: "operator" });
  useEffect(() => {
    if (data) setContact({ contactPhone: data.institution.contactPhone ?? "", webhookUrl: data.institution.webhookUrl ?? "" });
  }, [data]);

  if (!isAdmin)
    return (
      <>
        <PageHeader title="Settings" />
        <Card><EmptyState title="Institution admin access required" body="Operators can upload and edit students. Ask your institution admin to manage users and API keys." /></Card>
      </>
    );

  const copy = (v: string) => navigator.clipboard.writeText(v).then(() => toast.success("Copied"));

  return (
    <>
      <PageHeader title="Settings" description="Users, ERP API credentials and notification settings for your institution." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Users" action={<Button size="sm" onClick={() => setAddUser(true)}><UserPlus className="h-4 w-4" aria-hidden /> Add user</Button>} />
          {!users?.items.length ? <EmptyState title="No users" /> : (
            <Table caption="Users">
              <thead><tr>{["Name", "Email", "Role", "Last login"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {users.items.map((u) => (
                  <tr key={u._id}>
                    <td className="td font-medium">{u.name}</td>
                    <td className="td text-xs">{u.email}</td>
                    <td className="td"><StatusBadge status="info" label={u.permission === "admin" ? "Admin" : "Operator"} /></td>
                    <td className="td text-xs">{fmtDate(u.lastLogin, true)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Notifications & webhooks" description="WhatsApp alerts go to the contact number. Webhook payloads are HMAC-SHA256 signed (X-VidyaVerse-Signature)." />
          <CardBody>
            <form
              className="grid gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await api(`/api/v1/institutions/${id}`, "PATCH", contact);
                  toast.success("Settings saved");
                  mutate();
                } catch (err) {
                  toast.error((err as Error).message);
                }
              }}
            >
              <Field label="WhatsApp contact number" htmlFor="s-phone"><Input id="s-phone" inputMode="numeric" maxLength={10} value={contact.contactPhone} onChange={(e) => setContact((c) => ({ ...c, contactPhone: e.target.value }))} /></Field>
              <Field label="Webhook URL (intake.breach, issue events)" htmlFor="s-hook"><Input id="s-hook" type="url" value={contact.webhookUrl} onChange={(e) => setContact((c) => ({ ...c, webhookUrl: e.target.value }))} placeholder="https://erp.example.edu/hooks/aicte" /></Field>
              <div className="flex justify-end"><Button type="submit">Save</Button></div>
            </form>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="ERP API credentials"
            description="OAuth2 client credentials (POST /api/v1/auth/token) + X-API-Key header. See API documentation for endpoints."
            action={<Button variant="secondary" onClick={() => setRotate(true)}><KeyRound className="h-4 w-4" aria-hidden /> {data?.institution.hasApiCredentials ? "Rotate credentials" : "Generate credentials"}</Button>}
          />
          <CardBody>
            {creds ? (
              <div className="space-y-2">
                <p className="rounded bg-[#FFF6D9] px-3 py-2 text-sm text-[#7A5A00]">Copy these now – secrets are shown only once.</p>
                {(Object.entries(creds) as [string, string][]).filter(([k]) => k !== "note").map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="w-32 text-xs text-muted">{k}</span>
                    <code className="flex-1 truncate rounded bg-page px-2 py-1 text-xs">{v}</code>
                    <Button size="sm" variant="ghost" onClick={() => copy(v)} aria-label={`Copy ${k}`}><Copy className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">{data?.institution.hasApiCredentials ? `Client ID: ${data.institution.apiClientId ?? "issued"}` : "No credentials issued yet."}</p>
            )}
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        open={rotate}
        onOpenChange={setRotate}
        title="Rotate API credentials?"
        body="Existing ERP integrations stop working until they are updated with the new client secret and API key."
        confirmLabel="Rotate"
        danger
        onConfirm={async () => {
          try {
            setCreds(await api<Creds>(`/api/v1/institutions/${id}/credentials`, "POST"));
            mutate();
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
      />

      <Dialog open={addUser} onOpenChange={setAddUser} title="Add a user">
        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api(`/api/v1/institutions/${id}/users`, "POST", { ...nu, phone: nu.phone || undefined });
              toast.success("User added");
              setAddUser(false);
              refreshUsers();
            } catch (err) {
              toast.error((err as Error).message);
            }
          }}
        >
          <Field label="Name" htmlFor="u-name"><Input id="u-name" required value={nu.name} onChange={(e) => setNu({ ...nu, name: e.target.value })} /></Field>
          <Field label="Email" htmlFor="u-email"><Input id="u-email" type="email" required value={nu.email} onChange={(e) => setNu({ ...nu, email: e.target.value })} /></Field>
          <Field label="Temporary password" htmlFor="u-pass" hint="At least 10 characters with an uppercase letter and a digit"><Input id="u-pass" type="password" required minLength={10} value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} /></Field>
          <Field label="Mobile (for OTP)" htmlFor="u-phone"><Input id="u-phone" inputMode="numeric" maxLength={10} value={nu.phone} onChange={(e) => setNu({ ...nu, phone: e.target.value })} /></Field>
          <Field label="Role" htmlFor="u-perm"><Select id="u-perm" value={nu.permission} onChange={(e) => setNu({ ...nu, permission: e.target.value })}><option value="operator">Operator (upload & edit)</option><option value="admin">Admin (approve, users, API)</option></Select></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setAddUser(false)}>Cancel</Button><Button type="submit">Add user</Button></div>
        </form>
      </Dialog>
    </>
  );
}
