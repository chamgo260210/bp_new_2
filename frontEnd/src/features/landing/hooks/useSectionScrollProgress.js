import { useEffect } from 'react';

const selectors = '.landing-intro, .landing-workflow, .landing-features, .landing-trust, .landing-outcome, .landing-faq, .landing-demo, .landing-final-cta, .landing-footer';
const clamp = (value) => Math.min(1, Math.max(0, value));

export default function useSectionScrollProgress({ enabled, reducedMotion }) {
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll(selectors));
    if (!enabled || reducedMotion) {
      sections.forEach((section) => {
        section.style.setProperty('--section-enter', '1');
        section.style.setProperty('--section-exit', '0');
        section.style.setProperty('--section-progress', '.5');
        section.dataset.motionState = 'active';
      });
      return undefined;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const viewport = window.innerHeight || 1;
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const progress = clamp((viewport - rect.top) / (viewport + rect.height));
        const enter = clamp(progress / .35);
        const exit = clamp((progress - .7) / .3);
        section.style.setProperty('--section-progress', progress.toFixed(3));
        section.style.setProperty('--section-enter', enter.toFixed(3));
        section.style.setProperty('--section-exit', exit.toFixed(3));
        section.dataset.motionState = progress < .35 ? 'entering' : progress > .7 ? 'leaving' : 'active';
      });
    };
    const request = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    return () => { window.removeEventListener('scroll', request); window.removeEventListener('resize', request); if (frame) window.cancelAnimationFrame(frame); };
  }, [enabled, reducedMotion]);
}
