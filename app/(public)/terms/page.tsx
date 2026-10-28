import { InfoPage } from "@/components/info-page";

export const metadata = { title: "Terms of Use" };

export default function Terms() {
  return (
    <InfoPage
      title="Terms of Use"
      sections={[
        { heading: "Authorised use", body: <p>Institution users may submit data only for students admitted to their AICTE-approved programs. Credentials are personal and must not be shared. API credentials are issued to the institution and must be stored securely.</p> },
        { heading: "Accuracy", body: <p>Institutions are responsible for the accuracy of submitted data. Admissions beyond approved intake are blocked and reported. Deliberate submission of false data may lead to regulatory action.</p> },
        { heading: "Verification", body: <p>Verifiers may use disclosed data only for the purpose stated in the consent request and must not store it beyond that purpose.</p> },
      ]}
    />
  );
}
