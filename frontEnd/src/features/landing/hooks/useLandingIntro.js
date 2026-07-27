import { useCallback, useEffect, useRef, useState } from 'react';

const normalTimeline = [[350, 'streaming'], [1050, 'classifying'], [1650, 'assembling'], [2250, 'collapsing'], [2750, 'unfolding'], [3250, 'settling'], [3500, 'completed']];

export default function useLandingIntro(reducedMotion) {
  const [state, setState] = useState('entering');
  const timers = useRef([]);
  const clearTimers = useCallback(() => { timers.current.forEach((timer) => window.clearTimeout(timer)); timers.current = []; }, []);
  const finish = useCallback(() => { clearTimers(); setState('completed'); }, [clearTimers]);
  const skip = useCallback(() => {
    if (state === 'completed' || state === 'settling') return;
    clearTimers();
    setState('collapsing');
    timers.current = [window.setTimeout(() => setState('unfolding'), 70), window.setTimeout(() => setState('settling'), 150), window.setTimeout(finish, 240)];
  }, [clearTimers, finish, state]);

  useEffect(() => {
    clearTimers();
    if (reducedMotion) {
      timers.current = [window.setTimeout(() => setState('classifying'), 120), window.setTimeout(() => setState('settling'), 340), window.setTimeout(finish, 560)];
      return clearTimers;
    }
    timers.current = normalTimeline.map(([delay, nextState]) => window.setTimeout(() => nextState === 'completed' ? finish() : setState(nextState), delay));
    return clearTimers;
  }, [clearTimers, finish, reducedMotion]);

  return { complete: state === 'completed', skip, state };
}
