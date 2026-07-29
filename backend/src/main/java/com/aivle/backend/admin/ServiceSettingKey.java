package com.aivle.backend.admin;

public enum ServiceSettingKey {
    REGISTRATION_ENABLED(
        "true",
        "registrationEnabled",
        "신규 회원가입",
        "신규 사용자의 회원가입 허용 여부"
    ),
    DOCUMENT_PROCESSING_ENABLED(
        "true",
        "documentProcessingEnabled",
        "문서 처리",
        "새 문서 업로드와 분석 작업 시작 허용 여부"
    ),
    MAINTENANCE_MODE(
        "false",
        "maintenanceMode",
        "유지보수 모드",
        "일반 사용자 쓰기 작업을 중지하고 조회와 관리자 운영을 유지합니다"
    );

    private final String defaultValue;
    private final String legacyKey;
    private final String displayName;
    private final String description;

    ServiceSettingKey(String defaultValue, String legacyKey, String displayName, String description) {
        this.defaultValue = defaultValue;
        this.legacyKey = legacyKey;
        this.displayName = displayName;
        this.description = description;
    }

    public String defaultValue() { return defaultValue; }
    public String legacyKey() { return legacyKey; }
    public String displayName() { return displayName; }
    public String description() { return description; }
}
