import { InfoPage } from "@/components/info-page";

export const metadata = { title: "Accessibility Statement" };

export default function Accessibility() {
  return (
    <InfoPage
      title="Accessibility Statement"
      intro="This portal aims to conform to WCAG 2.1 Level AA and the Guidelines for Indian Government Websites (GIGW)."
      sections={[
        { heading: "Features", body: <ul className="list-disc pl-5"><li>Skip to main content link and full keyboard navigation with visible focus</li><li>Text size controls (A- / A / A+)</li><li>English, Hindi and Marathi interface</li><li>Colour contrast meeting AA; status is never conveyed by colour alone</li><li>ARIA labels on icons, charts and controls; reduced-motion support</li><li>Low-bandwidth friendly: no heavy images or video</li></ul> },
        { heading: "Feedback", body: <p>If you face any difficulty using this portal, please write to the contact address on the Contact Us page with the page URL and a description of the problem.</p> },
      ]}
    />
  );
}
