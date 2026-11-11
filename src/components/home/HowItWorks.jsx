import { useReducedMotion } from 'framer-motion';
import PinnedSteps from './howitworks/PinnedSteps';
import { StaticSteps, StepCta, StepsHeader } from './howitworks/shared';

/**
 * "Come funziona" (Estetica v2): the 4 steps advance by themselves while scrolling
 * (pinned section). With prefers-reduced-motion they become 4 plain stacked blocks.
 */
export default function HowItWorks() {
  const reduce = useReducedMotion();
  const Steps = reduce ? StaticSteps : PinnedSteps;

  return (
    <section id="come-funziona" className="scroll-mt-24 pt-24 md:pt-32 pb-24 md:pb-32 bg-sand">
      <StepsHeader />
      <Steps />
      <StepCta />
    </section>
  );
}
