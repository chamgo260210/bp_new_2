import { useEffect, useMemo, useState } from 'react';

const cycleLength = 26000;
const slice = (text, elapsed, start, speed) => text.slice(0, Math.max(0, Math.min(text.length, Math.floor((elapsed - start) / speed))));

export default function useBrandCopyTyping(copy, reducedMotion) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (reducedMotion) return undefined;
    const startedAt = performance.now();
    const timer = window.setInterval(() => setElapsed((performance.now() - startedAt) % cycleLength), 55);
    return () => window.clearInterval(timer);
  }, [copy, reducedMotion]);
  return useMemo(() => {
    if (reducedMotion) return { active: 'body', titleFirst: copy.title[0], titleSecond: copy.title[1], bodyFirst: copy.body[0], bodySecond: copy.body[1] };
    const firstDone = copy.title[0].length * 70;
    const secondStart = firstDone + 360;
    const secondDone = secondStart + (copy.title[1].length * 70);
    const bodyStart = secondDone + 820;
    const bodySecondStart = bodyStart + (copy.body[0].length * 42) + 430;
    const bodyDone = bodySecondStart + (copy.body[1].length * 42);
    const active = elapsed < secondStart ? 'titleFirst' : elapsed < bodyStart ? 'titleSecond' : elapsed < bodySecondStart ? 'bodyFirst' : elapsed < bodyDone + 3500 ? 'bodySecond' : 'bodySecond';
    return { active, titleFirst: slice(copy.title[0], elapsed, 0, 70), titleSecond: slice(copy.title[1], elapsed, secondStart, 70), bodyFirst: slice(copy.body[0], elapsed, bodyStart, 42), bodySecond: slice(copy.body[1], elapsed, bodySecondStart, 42) };
  }, [copy, elapsed, reducedMotion]);
}
