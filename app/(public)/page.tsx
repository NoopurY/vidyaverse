import { HeroSection } from "@/components/home/hero";
import { HowItWorks, RoleCards, StatisticsStrip } from "@/components/home/sections";

export default function Home() {
  return (
    <div className="bg-white">
      <HeroSection />
      <StatisticsStrip />
      <RoleCards />
      <HowItWorks />
    </div>
  );
}
