import AuthTopBar from './AuthTopBar.jsx';
import { useLocation } from 'react-router-dom';

export default function AuthShell({ children, mode }) {
  const location = useLocation();
  const source = location.state?.source;
  const transitioning = location.state?.authTransition === true && ['landing', 'logout', 'auth-switch', 'signup-complete'].includes(source);
  return <section className={`auth-shell auth-shell--${mode}${transitioning ? ' auth-shell--transitioning' : ''}${source ? ` auth-shell--from-${source}` : ''}`}><div className="auth-shell__background" aria-hidden="true" /><AuthTopBar mode={mode} /><div className="auth-shell__grid">{children}</div><p className="auth-shell__legal">AI 분석 결과는 법률·재무·투자 또는 전문가의 최종 판단을 대체하지 않습니다.</p></section>;
}
