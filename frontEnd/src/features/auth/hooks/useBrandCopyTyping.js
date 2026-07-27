import { useEffect, useMemo, useState } from 'react';

const STEPS = {
  IDLE_BEFORE_RESTART: 'IDLE_BEFORE_RESTART',
  PAUSE_BODY_1: 'PAUSE_BODY_1',
  PAUSE_TITLE_1: 'PAUSE_TITLE_1',
  PAUSE_TITLE_2: 'PAUSE_TITLE_2',
  RESETTING: 'RESETTING',
  TYPE_BODY_1: 'TYPE_BODY_1',
  TYPE_BODY_2: 'TYPE_BODY_2',
  TYPE_TITLE_1: 'TYPE_TITLE_1',
  TYPE_TITLE_2: 'TYPE_TITLE_2',
  WAITING: 'WAITING',
  HOLD_COMPLETE: 'HOLD_COMPLETE',
};

const initialState = { bodyFirst: '', bodySecond: '', opacity: 1, step: STEPS.WAITING, titleFirst: '', titleSecond: '' };
const typingSteps = {
  [STEPS.TYPE_TITLE_1]: ['titleFirst', 'title', 82, STEPS.PAUSE_TITLE_1],
  [STEPS.TYPE_TITLE_2]: ['titleSecond', 'title', 82, STEPS.PAUSE_TITLE_2],
  [STEPS.TYPE_BODY_1]: ['bodyFirst', 'body', 55, STEPS.PAUSE_BODY_1],
  [STEPS.TYPE_BODY_2]: ['bodySecond', 'body', 55, STEPS.HOLD_COMPLETE],
};

function nextState(current, copy) {
  const typing = typingSteps[current.step];
  if (typing) {
    const [field, copyKey, , next] = typing;
    const target = copy[copyKey][field.endsWith('First') ? 0 : 1];
    const value = current[field];
    return value.length < target.length
      ? { ...current, [field]: target.slice(0, value.length + 1) }
      : { ...current, step: next };
  }
  const steps = {
    [STEPS.WAITING]: STEPS.TYPE_TITLE_1,
    [STEPS.PAUSE_TITLE_1]: STEPS.TYPE_TITLE_2,
    [STEPS.PAUSE_TITLE_2]: STEPS.TYPE_BODY_1,
    [STEPS.PAUSE_BODY_1]: STEPS.TYPE_BODY_2,
    [STEPS.HOLD_COMPLETE]: STEPS.RESETTING,
    [STEPS.RESETTING]: STEPS.IDLE_BEFORE_RESTART,
    [STEPS.IDLE_BEFORE_RESTART]: STEPS.TYPE_TITLE_1,
  };
  if (current.step === STEPS.RESETTING) return { ...initialState, opacity: 1, step: steps[current.step] };
  if (current.step === STEPS.IDLE_BEFORE_RESTART) return { ...initialState, step: steps[current.step] };
  return { ...current, opacity: current.step === STEPS.HOLD_COMPLETE ? .15 : current.opacity, step: steps[current.step] };
}

function delayFor(state) {
  const typing = typingSteps[state.step];
  if (typing) return typing[2];
  return {
    [STEPS.WAITING]: 320,
    [STEPS.PAUSE_TITLE_1]: 520,
    [STEPS.PAUSE_TITLE_2]: 760,
    [STEPS.PAUSE_BODY_1]: 520,
    [STEPS.HOLD_COMPLETE]: 7200,
    [STEPS.RESETTING]: 620,
    [STEPS.IDLE_BEFORE_RESTART]: 5200,
  }[state.step] ?? 0;
}

export default function useBrandCopyTyping(copy, { enabled = true, paused = false, reducedMotion = false } = {}) {
  const [state, setState] = useState(initialState);
  const [tabHidden, setTabHidden] = useState(() => typeof document !== 'undefined' && document.hidden);

  useEffect(() => {
    const update = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    if (!enabled) {
      const timer = window.setTimeout(() => setState(initialState), 0);
      return () => window.clearTimeout(timer);
    }
    if (reducedMotion) {
      const timer = window.setTimeout(() => setState({ bodyFirst: copy.body[0], bodySecond: copy.body[1], opacity: 1, step: STEPS.HOLD_COMPLETE, titleFirst: copy.title[0], titleSecond: copy.title[1] }), 0);
      return () => window.clearTimeout(timer);
    }
    if (paused || tabHidden) return undefined;
    const timer = window.setTimeout(() => setState((current) => nextState(current, copy)), delayFor(state));
    return () => window.clearTimeout(timer);
  }, [copy, enabled, paused, reducedMotion, state, tabHidden]);

  return useMemo(() => ({ ...state, active: typingSteps[state.step]?.[0] ?? null }), [state]);
}
