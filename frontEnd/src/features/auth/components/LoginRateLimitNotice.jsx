function formatRemaining(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

export default function LoginRateLimitNotice({ remainingSeconds }) {
  if (!remainingSeconds) return null;
  return <div className="auth-rate-limit" role="status">
    <strong>로그인 시도가 반복되어 잠시 제한되었습니다.</strong>
    <span>계정 보호를 위한 조치입니다. {formatRemaining(remainingSeconds)} 후 다시 시도해 주세요.</span>
    <small>아이디와 비밀번호를 확인한 뒤 다시 시도할 수 있습니다.</small>
  </div>;
}
