import { InfoPage } from "@/components/info-page";

export const metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return (
    <InfoPage
      title="Privacy Policy"
      intro="AICTE acts as the data fiduciary for student records in this portal, in line with the Digital Personal Data Protection Act, 2023."
      sections={[
        { heading: "What we collect", body: <p>APAAR ID, name, date of birth, gender, category, nationality status, program, admission details, status and (with consent) outcomes. Contact details and parent name are encrypted at rest (AES-256-GCM). Aadhaar numbers are never collected or stored.</p> },
        { heading: "How data is protected", body: <p>APAAR IDs are tokenised (HMAC-SHA256) for analytics, the seat ledger and cross-institution checks. Institutions never see another institution&apos;s data. Tables mask personal data; regulators see aggregated data only. Every read of student-level data and every change is written to a tamper-evident audit log.</p> },
        { heading: "Consent and purpose limitation", body: <p>External verification is only possible with the student&apos;s consent for a stated purpose, a selected set of fields and an expiry date. Students can revoke consent at any time, effective immediately. Category, contact details and parent name are never disclosed to verifiers.</p> },
        { heading: "Your rights", body: <p>Students can view their data, see who accessed it, and request corrections from the Student portal (Access Log and Grievance pages).</p> },
      ]}
    />
  );
}
