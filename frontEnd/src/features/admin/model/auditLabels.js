export const ADMIN_AUDIT_ACTIONS = [
  'ADMIN_REAUTHENTICATION_SUCCEEDED',
  'ADMIN_REAUTHENTICATION_FAILED',
  'USER_ROLE_CHANGED',
  'USER_STATUS_CHANGED',
  'USER_SESSION_REVOKED',
  'SERVICE_SETTING_CHANGED',
];

export const AUDIT_ACTION_LABELS = {
  ADMIN_REAUTHENTICATION_SUCCEEDED: '관리자 재인증 성공',
  ADMIN_REAUTHENTICATION_FAILED: '관리자 재인증 실패',
  USER_ROLE_CHANGED: '사용자 권한 변경',
  USER_STATUS_CHANGED: '사용자 상태 변경',
  USER_SESSION_REVOKED: '사용자 세션 종료',
  SERVICE_SETTING_CHANGED: '서비스 설정 변경',
  ADMIN_USER_ROLE_CHANGED: '사용자 권한 변경 (기존 기록)',
  ADMIN_USER_STATUS_CHANGED: '사용자 상태 변경 (기존 기록)',
  ADMIN_USER_SESSIONS_REVOKED: '사용자 세션 종료 (기존 기록)',
  ADMIN_SETTING_UPDATED: '서비스 설정 변경 (기존 기록)',
};

export function getAuditActionLabel(action) {
  return AUDIT_ACTION_LABELS[action] || action;
}
