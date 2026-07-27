import { useEffect, useState } from 'react';

const sequence = [
  ['WAITING', 380],
  ['TITLE_1', 900],
  ['PAUSE_TITLE_1', 420],
  ['TITLE_2', 1450],
  ['PAUSE_TITLE_2', 920],
  ['BODY_1', 1350],
  ['PAUSE_BODY_1', 460],
  ['BODY_2', 1900],
  ['HOLD_COMPLETE', 7200],
  ['RESETTING', 650],
  ['IDLE_BEFORE_RESTART', 4200],
];

const nextStep = (step) => sequence[(sequence.findIndex(([name]) => name === step) + 1) % sequence.length];

export default function useBrandCopyTyping({ enabled = true, paused = false, reducedMotion = false } = {}) {
  const [step, setStep] = useState(reducedMotion ? 'HOLD_COMPLETE' : 'WAITING');
  const [tabHidden, setTabHidden] = useState(() => typeof document !== 'undefined' && document.hidden);

  useEffect(() => {
    const onVisibilityChange = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    if (!enabled || paused || tabHidden) return undefined;
    if (reducedMotion) {
      const timer = window.setTimeout(() => setStep('HOLD_COMPLETE'), 0);
      return () => window.clearTimeout(timer);
    }
    const [, duration] = sequence.find(([name]) => name === step) ?? sequence[0];
    const timer = window.setTimeout(() => setStep(nextStep(step)[0]), duration);
    return () => window.clearTimeout(timer);
  }, [enabled, paused, reducedMotion, step, tabHidden]);

  useEffect(() => {
    if (!enabled && step !== 'WAITING') {
      const timer = window.setTimeout(() => setStep('WAITING'), 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [enabled, step]);

  return { step };
}
