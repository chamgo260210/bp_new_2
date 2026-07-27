import { useEffect, useState } from 'react';

export default function useAuthBrandCycle({ reducedMotion, sceneCount }) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || reducedMotion) return undefined;
    const interval = window.setInterval(() => {
      if (!document.hidden) setSceneIndex((current) => (current + 1) % sceneCount);
    }, 13000);
    return () => window.clearInterval(interval);
  }, [paused, reducedMotion, sceneCount]);

  return { paused, sceneIndex, setPaused, setSceneIndex };
}
