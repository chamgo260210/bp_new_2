package com.aivle.backend.admin;

public record ServicePolicyResponse(
    boolean registrationEnabled,
    boolean documentProcessingEnabled,
    boolean maintenanceMode
) {
    public static ServicePolicyResponse from(ServicePolicyService.ServicePolicySnapshot snapshot) {
        return new ServicePolicyResponse(
            snapshot.registrationEnabled(),
            snapshot.documentProcessingEnabled(),
            snapshot.maintenanceMode()
        );
    }
}
