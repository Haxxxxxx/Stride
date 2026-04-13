import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { Manifesto } from "./Manifesto";
import { Features } from "./Features";
import { AppScreens } from "./AppScreens";
import { Stats } from "./Stats";
import { HowItWorks } from "./HowItWorks";
import { Showcase } from "./Showcase";
import { CTA } from "./CTA";
import { Footer } from "./Footer";

export default function LandingPage() {
  return (
    <div className="bg-black min-h-screen">
      <Navbar />
      <Hero />
      <Manifesto />
      <Features />
      <AppScreens />
      <Showcase />
      <Stats />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
}
