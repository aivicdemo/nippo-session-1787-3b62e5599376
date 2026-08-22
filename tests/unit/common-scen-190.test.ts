import { getDashboardData } from '../../src/logic/dashboard-display';

describe('getDashboardData - Authorization Denied (SCEN-190)', () => {
  test('should throw AuthorizationError when non-manager user attempts to access manager-only dashboard resources', async () => {
    // Setup: User context with engineer role only (no manager permission)
    const userContext = {
      userId: 'engineer_user_001',
      roles: ['engineer'], // Only engineer, no 'manager' or 'director'
      departmentId: 'dept_alpha_001',
      canAccessManagerResources: false,
    };

    // Mock dashboard data request parameters
    const dashboardRequest = {
      userId: userContext.userId,
      resourceType: 'adoption_schedule_plan', // Requires manager privilege
      departmentId: userContext.departmentId,
      requestTimestamp: new Date('2024-02-15T09:30:00Z').toISOString(),
    };

    // Mock audit logger to capture authorization denial events
    const auditLogEntries: Array<{
      eventCode: string;
      userId: string;
      operation: string;
      timestamp: string;
      resourceType: string;
    }> = [];

    const mockAuditLogger = {
      log: (entry: typeof auditLogEntries[0]) => {
        auditLogEntries.push(entry);
      },
    };

    // Attempt to access manager-only dashboard resource
    // Expected: Should throw AuthorizationError before any tool invocation
    const executeGetDashboard = () => {
      return getDashboardData(dashboardRequest, {
        userContext,
        auditLogger: mockAuditLogger,
        // Additional required context parameters
        systemClock: { now: () => new Date('2024-02-15T09:30:00Z') },
      });
    };

    // Verify error is thrown with correct properties
    expect(executeGetDashboard).toThrow(/権限なし/);

    let caughtError: any;
    try {
      executeGetDashboard();
    } catch (error) {
      caughtError = error;
    }

    // Validate error structure
    expect(caughtError).toBeDefined();
    expect(caughtError.errorCode).toBe('AUTHORIZATION_DENIED');
    expect(caughtError.message).toContain('権限なし');
    expect(caughtError.deniedResourceType).toBe('adoption_schedule_plan');
    expect(caughtError.deniedOperation).toMatch(
      /(導入スケジュール案|研修教材|フィードバック配信)/
    );

    // Verify audit log entry was recorded with AUTHORIZATION_DENIED event
    expect(auditLogEntries.length).toBe(1);
    const auditEntry = auditLogEntries[0];
    expect(auditEntry.eventCode).toBe('AUTHORIZATION_DENIED');
    expect(auditEntry.userId).toBe('engineer_user_001');
    expect(auditEntry.resourceType).toBe('adoption_schedule_plan');
    expect(auditEntry.timestamp).toBe('2024-02-15T09:30:00Z');

    // Verify idempotent retry returns same error without side effects
    const retryAuditLogCount = auditLogEntries.length;
    expect(executeGetDashboard).toThrow(/権限なし/);
    expect(auditLogEntries.length).toBe(retryAuditLogCount + 1);

    // Verify second audit entry matches first (idempotent behavior)
    const secondAuditEntry = auditLogEntries[1];
    expect(secondAuditEntry.eventCode).toBe('AUTHORIZATION_DENIED');
    expect(secondAuditEntry.userId).toBe('engineer_user_001');
    expect(secondAuditEntry.resourceType).toBe('adoption_schedule_plan');
  });
});