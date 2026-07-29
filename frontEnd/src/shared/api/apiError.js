export class ApiError extends Error {
  constructor({
    status = 0,
    code = 'NETWORK_ERROR',
    message = '요청을 처리하지 못했습니다.',
    fieldErrors = [],
    retryable = false,
    requestId = null,
    retryAfterSeconds = null,
    loginAttempt = null,
    cause,
  } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.retryable = retryable;
    this.requestId = requestId;
    this.retryAfterSeconds = retryAfterSeconds;
    this.loginAttempt = loginAttempt;
  }
}

export function normalizeApiError(error, fallback = {}) {
  if (error instanceof ApiError) return error;
  if (error?.name === 'AbortError') {
    return new ApiError({
      status: 0,
      code: 'REQUEST_ABORTED',
      message: '요청이 취소되었거나 제한 시간을 초과했습니다.',
      retryable: true,
      cause: error,
      ...fallback,
    });
  }
  return new ApiError({
    message: '네트워크 연결을 확인한 뒤 다시 시도해 주세요.',
    retryable: true,
    cause: error,
    ...fallback,
  });
}

const USER_MESSAGE_BY_CODE = {
  VALIDATION_FAILED: '입력한 내용을 다시 확인해 주세요.',
  INVALID_CREDENTIALS: '아이디 또는 비밀번호를 확인해 주세요.',
  USERNAME_ALREADY_EXISTS: '이미 사용 중인 아이디입니다.',
  USERNAME_NOT_ALLOWED: '사용할 수 없는 아이디입니다. 다른 아이디를 입력해 주세요.',
  LOGIN_RATE_LIMITED: '로그인 시도가 여러 번 실패했습니다. 잠시 후 다시 시도해 주세요.',
  EMAIL_ALREADY_EXISTS: '이미 사용 중인 이메일입니다.',
  USER_EMAIL_DUPLICATED: '이미 사용 중인 이메일입니다.',
  PASSWORD_POLICY_VIOLATION: '비밀번호 정책을 확인해 주세요.',
  REGISTRATION_DISABLED: '현재 신규 회원가입이 일시 중지되었습니다. 기존 계정으로 로그인해 주세요.',
  DOCUMENT_PROCESSING_DISABLED: '현재 문서 처리 기능이 일시 중지되었습니다.',
  MAINTENANCE_MODE_ENABLED: '현재 서비스 점검 중입니다. 변경 작업은 잠시 사용할 수 없습니다.',
  ACCESS_TOKEN_EXPIRED: '로그인이 만료되었습니다. 다시 로그인해 주세요.',
  ACCESS_TOKEN_INVALID: '로그인이 만료되었습니다. 다시 로그인해 주세요.',
  REFRESH_TOKEN_INVALID: '로그인이 만료되었습니다. 다시 로그인해 주세요.',
  USER_INACTIVE: '현재 로그인할 수 없는 계정입니다.',
  ACCOUNT_DELETION_PASSWORD_INVALID: '현재 비밀번호가 올바르지 않습니다.',
  ACCOUNT_DELETION_CONFIRMATION_INVALID: '확인 문구에 “회원탈퇴”를 정확히 입력해 주세요.',
  ACCOUNT_ALREADY_DELETED: '이미 탈퇴 처리된 계정입니다.',
  ADMIN_SELF_DELETE_NOT_ALLOWED: '관리자 계정은 일반 계정 설정에서 탈퇴할 수 없습니다.',
  LAST_ACTIVE_ADMIN_DELETE_NOT_ALLOWED: '마지막 활성 관리자 계정은 삭제할 수 없습니다.',
  USER_DELETE_REAUTHENTICATION_REQUIRED: '사용자 삭제를 수행하려면 관리자 재인증이 필요합니다.',
  CLUSTER_PERSONA_DISABLED: '추가 페르소나 기능이 현재 비활성화되어 있습니다.',
  CLUSTER_PERSONA_NOT_ALLOWED: '현재 선택할 수 없는 페르소나입니다.',
  CLUSTER_PERSONA_NOT_FOUND: '페르소나를 찾을 수 없습니다.',
  CLUSTER_PERSONA_SELECTION_REQUIRED: '사용 가능한 페르소나가 아직 설정되지 않았습니다.',
  CLUSTER_PERSONA_LIMIT_EXCEEDED: '사용 가능한 페르소나 수 제한을 초과했습니다.',
  PROJECT_PERSONA_SELECTION_NOT_ALLOWED: '현재 프로젝트에서는 이 페르소나를 선택할 수 없습니다.',
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '이 작업을 수행할 권한이 없습니다.',
  NOT_FOUND: '요청한 정보를 찾을 수 없습니다.',
  CONFLICT: '다른 변경사항이 반영되었습니다. 최신 내용을 확인해 주세요.',
  RESOURCE_VERSION_CONFLICT: '다른 변경사항이 먼저 저장되었습니다. 최신 내용을 확인해 주세요.',
  PLAN_NOT_EDITABLE: '확정된 사업계획은 더 이상 수정할 수 없습니다.',
  PLAN_ALREADY_CONFIRMED: '이미 확정된 사업계획입니다.',
  PLAN_INCOMPLETE: '필수 보완 항목을 모두 해결한 뒤 확정해 주세요.',
  MISSING_FIELD_NOT_FOUND: '보완 항목을 찾을 수 없습니다. 최신 내용을 다시 불러와 주세요.',
  STRUCTURED_PLAN_NOT_FOUND: '최신 구조화 결과를 찾을 수 없습니다.',
  PROJECT_STAGE_INVALID: '현재 프로젝트 단계에서는 이 작업을 진행할 수 없습니다.',
  NETWORK_ERROR: '네트워크 연결을 확인한 뒤 다시 시도해 주세요.',
  REQUEST_ABORTED: '요청이 취소되었습니다. 다시 시도해 주세요.',
};

export function getUserErrorMessage(error) {
  return USER_MESSAGE_BY_CODE[error?.code] ?? '요청을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}
