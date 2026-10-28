import { InfoPage } from "@/components/info-page";

export const metadata = { title: "Help" };

export default function Help() {
  return (
    <InfoPage
      title="Help"
      intro="Quick answers for institutions, students and verifiers."
      sections={[
        { heading: "Institutions: uploading student data", body: <><p>Go to <b>Upload</b>, download the Excel template (it contains dropdowns and an Instructions sheet), fill one row per student and drag the file onto the page. Errors are highlighted instantly with a plain-language fix; use <b>Help me fix</b> for a row-by-row explanation in English or Hindi.</p><p>Operators submit a validated file; the institution admin approves it. Only rows without blocking errors are committed, and every admission consumes a seat token from your Seat Ledger.</p></> },
        { heading: "Why was an admission rejected?", body: <p>The Seat Ledger only allows as many admissions as AICTE-approved seats (regular and each supernumerary type). If no seat token is left, the admission is blocked, and both your institution (WhatsApp) and AICTE (dashboard) are alerted.</p> },
        { heading: "Students: APAAR and your record", body: <p>Your APAAR ID is created on DigiLocker. In the portal you can view your record, download a digitally signed PDF, share a verification link, approve or revoke consent, add your placement/higher-studies outcome and request corrections.</p> },
        { heading: "Verifiers: how to verify", body: <p>Ask the student for their APAAR ID and a 6-digit consent code, or scan the QR code on their record/certificate at <b>Verify a Student</b>. On WhatsApp send <code>VERIFY &lt;APAAR&gt; &lt;CODE&gt;</code>.</p> },
        { heading: "WhatsApp commands", body: <ul className="list-disc pl-5"><li><code>VERIFY &lt;APAAR&gt; &lt;CODE&gt;</code> – verify a student (employers)</li><li><code>YES &lt;code&gt;</code> / <code>NO &lt;code&gt;</code> – approve or reject a consent request (students)</li><li><code>REVOKE &lt;consent ID&gt;</code> – revoke a consent immediately</li></ul> },
      ]}
    />
  );
}
