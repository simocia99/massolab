import { MotionConfig } from 'framer-motion';
// Hero (O4) and "Chi sono" (A4) live in the content area's bundle range.
import { O4 as HeroSection, A4 as AboutSection } from '@/xref/content';
import TreatmentsSection from '@/components/home/TreatmentsSection';
import PercorsiTeaser from '@/components/home/PercorsiTeaser';
import GuidedBookingSection from '@/components/home/guided/GuidedBookingSection';
import HowItWorks from '@/components/home/HowItWorks';
import WhyMassolab from '@/components/home/WhyMassolab';
import ReviewsSection from '@/components/home/ReviewsSection';
import FaqSection from '@/components/home/FaqSection';
import ContactSection from '@/components/home/ContactSection';
import BlogTeaser from '@/components/home/BlogTeaser';
import FinalCta from '@/components/home/FinalCta';
import StickyCta from '@/components/home/StickyCta';

/** Home page (original `j3`). */
export default function Home() {
  return (
    <MotionConfig reducedMotion="user">
      {/* No overflow on this wrapper: it would break the sticky "Come funziona".
          Each section clips its own decorations instead. */}
      <div className="bg-white pb-16 md:pb-0">
        <HeroSection />
        <AboutSection />
        <TreatmentsSection />
        <PercorsiTeaser />
        <GuidedBookingSection />
        <HowItWorks />
        <WhyMassolab />
        <ReviewsSection />
        <FaqSection />
        <ContactSection />
        <BlogTeaser />
        <FinalCta />
        <StickyCta />
      </div>
    </MotionConfig>
  );
}
