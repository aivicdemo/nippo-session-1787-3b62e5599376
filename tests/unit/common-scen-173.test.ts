import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';
import { type Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('Tx9Imp1Agent Authorization', () => {
  // SCEN-173
  test('should deny data aggregation for unauthorized member role and allow for authorized department_head role', async () => {
    const aggregationStartDate = '2024-01-08';
    const aggregationEndDate = '2024-01-14';
    const targetTeamIds = ['team-001', 'team-002'];
    const requestedByUserIdMember = 'user-member-001';
    const requestedByUserIdHead = 'user-head-001';
    const accessTokenMember = 'token-member-abc123';
    const accessTokenHead = 'token-head-xyz789';

    // Mock AI client with authorization check
    const mockAiClientDenied: Tx9Imp1AiClient = {
      userId: requestedByUserIdMember,
      userRole: 'member',
      accessToken: accessTokenMember,
      executeAction01: jest.fn(async () => {
        const error = new Error('User role member is not authorized to execute data aggregation. Required role: department_head or analyst');
        (error as any).statusCode = 403;
        (error as any).errorCode = 'INSUFFICIENT_PRIVILEGES';
        throw error;
      }),
      executeAction02: jest.fn(),
      executeAction03: jest.fn(),
      executeAction04: jest.fn(),
      executeAction05: jest.fn(),
      executeAction06: jest.fn(),
      executeAction07: jest.fn(),
      recordAuditLog: jest.fn(async (event: any) => {
        return { logId: 'audit-log-001', timestamp: new Date().toISOString(), ...event };
      }),
    };

    const mockAiClientAuthorized: Tx9Imp1AiClient = {
      userId: requestedByUserIdHead,
      userRole: 'department_head',
      accessToken: accessTokenHead,
      executeAction01: jest.fn(async () => ({
        aggregatedReports: [
          { reportId: 'rep-001', date: '2024-01-08', teamId: 'team-001' },
          { reportId: 'rep-002', date: '2024-01-09', teamId: 'team-002' },
        ],
        totalReports: 2,
        missingReports: [],
      })),
      executeAction02: jest.fn(async () => ({
        unsubmittedMembers: [],
        remindersSent: 0,
      })),
      executeAction03: jest.fn(async () => ({
        extractedIssues: [
          { issueId: 'iss-001', category: 'quality', priority: 'high' },
          { issueId: 'iss-002', category: 'schedule', priority: 'medium' },
        ],
        totalExtracted: 2,
      })),
      executeAction04: jest.fn(async () => ({
        quantifiedMetrics: {
          issueResolutionSpeed: 3.5,
          reportSubmissionRate: 88.5,
          issueRecurrenceRate: 12.3,
        },
      })),
      executeAction05: jest.fn(async () => ({
        classifiedIssues: [
          { issueId: 'iss-001', priority: 'high' },
          { issueId: 'iss-002', priority: 'medium' },
        ],
      })),
      executeAction06: jest.fn(async () => ({
        proposedActions: [
          { actionId: 'act-001', description: 'Implement quality review process' },
        ],
      })),
      executeAction07: jest.fn(async () => ({
        reportId: 'report-final-001',
        generatedAt: '2024-01-15T10:00:00Z',
      })),
      recordAuditLog: jest.fn(async (event: any) => {
        return { logId: 'audit-log-002', timestamp: new Date().toISOString(), ...event };
      }),
    };

    // Test case 1: Authorization denial for member role
    const requestDenied = {
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      requestedByUserId: requestedByUserIdMember,
    };

    let denialError: any = null;
    try {
      await runTx9Imp1Agent(requestDenied, mockAiClientDenied);
    } catch (error) {
      denialError = error;
    }

    expect(denialError).toBeDefined();
    expect(denialError.statusCode).toBe(403);
    expect(denialError.errorCode).toBe('INSUFFICIENT_PRIVILEGES');
    expect(denialError.message).toMatch(/member/);
    expect(denialError.message).toMatch(/not authorized/);

    // Verify authorization check happened before other actions
    expect(mockAiClientDenied.executeAction01).toHaveBeenCalled();
    expect(mockAiClientDenied.executeAction02).not.toHaveBeenCalled();
    expect(mockAiClientDenied.executeAction03).not.toHaveBeenCalled();
    expect(mockAiClientDenied.executeAction04).not.toHaveBeenCalled();
    expect(mockAiClientDenied.executeAction05).not.toHaveBeenCalled();
    expect(mockAiClientDenied.executeAction06).not.toHaveBeenCalled();
    expect(mockAiClientDenied.executeAction07).not.toHaveBeenCalled();

    // Verify audit log recorded authorization denial
    expect(mockAiClientDenied.recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'AUTHORIZATION_DENIAL',
        userId: requestedByUserIdMember,
        userRole: 'member',
        action: 'data_aggregation',
        reason: 'insufficient_privileges',
        timestamp: expect.any(String),
      })
    );

    // Test case 2: Authorization granted for department_head role
    const requestAuthorized = {
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      requestedByUserId: requestedByUserIdHead,
    };

    const resultAuthorized = await runTx9Imp1Agent(requestAuthorized, mockAiClientAuthorized);

    expect(resultAuthorized).toBeDefined();
    expect(resultAuthorized.reportId).toBe('report-final-001');
    expect(resultAuthorized.aggregationPeriod.startDate).toBe(aggregationStartDate);
    expect(resultAuthorized.aggregationPeriod.endDate).toBe(aggregationEndDate);
    expect(resultAuthorized.generatedAt).toBe('2024-01-15T10:00:00Z');

    // Verify all actions were executed in sequence
    expect(mockAiClientAuthorized.executeAction01).toHaveBeenCalled();
    expect(mockAiClientAuthorized.executeAction02).toHaveBeenCalled();
    expect(mockAiClientAuthorized.executeAction03).toHaveBeenCalled();
    expect(mockAiClientAuthorized.executeAction04).toHaveBeenCalled();
    expect(mockAiClientAuthorized.executeAction05).toHaveBeenCalled();
    expect(mockAiClientAuthorized.executeAction06).toHaveBeenCalled();
    expect(mockAiClientAuthorized.executeAction07).toHaveBeenCalled();

    // Verify no authorization denial was recorded for authorized user
    const auditLogCalls = mockAiClientAuthorized.recordAuditLog.mock.calls;
    const denialEvents = auditLogCalls.filter((call) =>
      call[0]?.eventType === 'AUTHORIZATION_DENIAL'
    );
    expect(denialEvents.length).toBe(0);

    // Verify productivity metrics in result
    expect(resultAuthorized.productivityMetrics).toBeDefined();
    expect(resultAuthorized.productivityMetrics.issueResolutionSpeed).toBe(3.5);
    expect(resultAuthorized.productivityMetrics.reportSubmissionRate).toBe(88.5);
    expect(resultAuthorized.productivityMetrics.issueRecurrenceRate).toBe(12.3);

    // Verify prioritized issues present
    expect(resultAuthorized.prioritizedIssues).toBeDefined();
    expect(resultAuthorized.prioritizedIssues.length).toBeGreaterThan(0);

    // Verify recommended countermeasures present
    expect(resultAuthorized.recommendedCountermeasures).toBeDefined();
    expect(resultAuthorized.recommendedCountermeasures.length).toBeGreaterThan(0);
  });
});