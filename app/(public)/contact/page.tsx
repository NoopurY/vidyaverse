import { InfoPage } from "@/components/info-page";

export const metadata = { title: "Contact Us" };

export default function Contact() {
  return (
    <InfoPage
      title="Contact Us"
      sections={[
        { heading: "Helpdesk", body: <p>All India Council for Technical Education, Nelson Mandela Marg, Vasant Kunj, New Delhi – 110070.<br />Helpdesk (demo): helpdesk@aicte.example · 1800-000-0000 (toll-free, 9:30–18:00 IST, Mon–Fri)</p> },
        { heading: "Grievances", body: <p>Students should raise data-correction requests from the Student portal → Grievance. Institutions can contact their AICTE regional office.</p> },
      ]}
    />
  );
}
