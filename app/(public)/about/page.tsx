import { InfoPage } from "@/components/info-page";

export const metadata = { title: "About" };

export default function About() {
  return (
    <InfoPage
      title="About VidyaVerse"
      intro="VidyaVerse is AICTE's APAAR Student Data & Verification Portal."
      sections={[
        { heading: "Purpose", body: <p>AICTE-approved institutions submit student-level data using the APAAR ID as the unique academic identifier. The system validates it, prevents and detects fraud, stores it in a central repository, gives AICTE real-time monitoring and analytics, and lets authorised stakeholders verify student records securely with the student&apos;s consent.</p> },
        { heading: "Prevention, not just detection", body: <p>A digital seat ledger issues one token per approved seat; an admission must consume a token, so over-intake is blocked at the source. Counselling and scholarship cross-checks, shared-contact analysis and a transparent risk score surface suspicious patterns.</p> },
        { heading: "Open standards", body: <p>Student records are issued as W3C Verifiable Credentials (VC Data Model 2.0) signed with Ed25519 by did:web, with selective disclosure (SD-JWT) and a Bitstring Status List for revocation. APIs are documented with OpenAPI.</p> },
      ]}
    />
  );
}
