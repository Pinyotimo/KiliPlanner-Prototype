import { DifferenceSection } from "./components/DifferenceSection";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { LandingCta } from "./components/LandingCta";
import { LandingFooter } from "./components/LandingFooter";
import { LandingNav } from "./components/LandingNav";
import { WhatSection } from "./components/WhatSection";
import { WhySection } from "./components/WhySection";
import "./landing.css";

/**
 * The public front door: what KiliPlanner is, why it exists, how a report
 * moves through it, and how it differs from the other ways a resident can
 * complain. Everything here is built from the app's own semantic tokens, so
 * it follows the user's light/dark choice and their accent.
 */
export default function LandingPage() {
  return (
    <div className="lp-page min-h-screen bg-background text-foreground">
      <LandingNav />

      <main id="main">
        <Hero />
        <WhatSection />
        <WhySection />
        <HowItWorks />
        <DifferenceSection />
        <LandingCta />
      </main>

      <LandingFooter />
    </div>
  );
}
