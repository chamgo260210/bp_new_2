import useReducedMotion from '../../landing/hooks/useReducedMotion.js';
import { authBrandScenes } from '../data/authBrandScenes.js';
import useAuthBrandCycle from '../hooks/useAuthBrandCycle.js';
import useBrandCopyTyping from '../hooks/useBrandCopyTyping.js';

const copy = {
  login: { eyebrow: 'AI 기반 사업 아이디어 검증', title: ['사업 아이디어를', '검증 가능한 계획으로 바꿉니다.'], body: ['문서에서 핵심 정보를 구조화하고,', '근거와 위험을 확인한 뒤 다음 행동을 정리합니다.'] },
  signup: { eyebrow: 'START YOUR VALIDATION', title: ['사업 아이디어를', '검증 가능한 계획으로 바꿉니다.'], body: ['문서에서 핵심 정보를 구조화하고,', '근거와 위험을 확인한 뒤 다음 행동을 정리합니다.'] },
};

export default function AuthBrandPanel({ mode }) {
  const reducedMotion = useReducedMotion();
  const { paused, sceneIndex, setPaused, setSceneIndex } = useAuthBrandCycle({ reducedMotion, sceneCount: authBrandScenes.length });
  const scene = authBrandScenes[sceneIndex];
  const typed = useBrandCopyTyping(copy[mode], reducedMotion || paused);
  const pauseOnBlur = (event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); };
  const cursor = (name) => typed.active === name && <i aria-hidden="true">▍</i>;
  return <aside className="auth-brand-panel" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={pauseOnBlur}><p className="auth-brand-panel__eyebrow">{copy[mode].eyebrow}</p><h2 className="auth-brand-copy__title"><span>{typed.titleFirst}{cursor('titleFirst')}</span><span>{typed.titleSecond}{cursor('titleSecond')}</span></h2><div className="auth-brand-copy__description" aria-hidden="true"><span>{typed.bodyFirst}{cursor('bodyFirst')}</span><span>{typed.bodySecond}{cursor('bodySecond')}</span></div><p className="visually-hidden">사업 아이디어를 검증 가능한 계획으로 바꾸고 문서의 핵심, 근거, 위험과 다음 행동을 정리합니다.</p><ol className="auth-brand-panel__flow"><li><b>01</b><span>문서 구조화</span></li><li><b>02</b><span>근거와 위험 확인</span></li><li><b>03</b><span>다음 행동 정리</span></li></ol><section className="auth-brand-panel__preview" aria-label="제품 미리보기 예시"><div className="auth-brand-panel__preview-bar"><span>사업 검증 프로젝트</span><b>{scene.title}</b></div><div className="auth-brand-panel__workspace"><div className="auth-brand-panel__scene" key={scene.id}>{scene.lines.map(([label, value]) => <p key={label}><span>{label}</span><b>{value}</b></p>)}</div></div><div className="auth-brand-panel__indicators" aria-label="제품 미리보기 화면 선택">{authBrandScenes.map((item, index) => <button type="button" key={item.id} aria-label={`${index + 1}번째 화면: ${item.title}`} aria-pressed={sceneIndex === index} className={sceneIndex === index ? 'is-active' : ''} onClick={() => setSceneIndex(index)} />)}</div><small>가상 예시 데이터</small></section></aside>;
}
