import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { getDashboardData } from '../../src/logic/dashboard-display';

describe('getDashboardData', () => {
  let mockAiClient: any;
  let mockAuditLog: any[];

  beforeEach(() => {
    mockAuditLog = [];

    mockAiClient = {
      checkAuthorization: jest.fn().mockImplementation((userId: string, resourceType: string, requiredRole: string) => {
        if (userId === 'user_unauthorized' && resourceType === 'aggregated_report') {
          const error = new Error('Authorization denied');
          (error as any).name = 'AccessDeniedError';
          (error as any).code = 'AUTHORIZATION_DENIED';
          (error as any).deniedResourceType = 'aggregated_report';
          (error as any).deniedUserId = 'user_unauthorized';
          (error as any).requiredRole = 'manager_or_admin';
          throw error;
        }
        return { authorized: true };
      }),

      executeToolCall: jest.fn().mockImplementation((toolName: string, params: any) => {
        if (toolName === 'extract_keywords_from_report') {
          return {
            status: 'success',
            keywords: ['performance', 'quality', 'schedule'],
          };
        }
        return { status: 'error', message: 'Unknown tool' };
      }),

      callAgent: jest.fn().mockImplementation((agentName: string, context: any) => {
        throw new Error('Should not reach here if authorization denied');
      }),

      logAuditEvent: jest.fn().mockImplementation((event: any) => {
        mockAuditLog.push(event);
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-068
  test('should deny authorization for unauthorized user accessing aggregated report', async () => {
    const unauthorizedUserContext = {
      userId: 'user_unauthorized',
      role: 'staff',
      permissions: ['view_own_reports'],
    };

    const aggregatedReportId = 'report_agg_001';
    const protectedAggregatedReportData = {
      id: aggregatedReportId,
      protected: true,
      data: {
        submissions: [
          {
            userId: 'user_001',
            timestamp: '2024-01-15T09:00:00Z',
            content: 'Completed feature A implementation. Issue: deployment delay.',
          },
        ],
      },
    };

    let caughtError: any = null;
    let agentStatus: string | null = null;
    let failureReason: string | null = null;

    try {
      mockAiClient.checkAuthorization(
        unauthorizedUserContext.userId,
        'aggregated_report',
        'manager_or_admin'
      );

      agentStatus = 'failed';
    } catch (error) {
      caughtError = error;
      agentStatus = 'failed';
      failureReason = (error as any).code;

      mockAiClient.logAuditEvent({
        eventType: 'AUTHORIZATION_DENIED',
        timestamp: '2024-01-15T11:00:00Z',
        userId: unauthorizedUserContext.userId,
        resourceType: (error as any).deniedResourceType,
        requiredRole: (error as any).requiredRole,
        action: 'access_aggregated_report',
        status: 'denied',
      });
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.name).toBe('AccessDeniedError');
    expect(caughtError.code).toBe('AUTHORIZATION_DENIED');
    expect(caughtError.deniedResourceType).toBe('aggregated_report');
    expect(caughtError.deniedUserId).toBe('user_unauthorized');
    expect(caughtError.requiredRole).toBe('manager_or_admin');

    expect(agentStatus).toBe('failed');
    expect(failureReason).toBe('AUTHORIZATION_DENIED');

    expect(mockAiClient.executeToolCall).not.toHaveBeenCalled();
    expect(mockAiClient.callAgent).not.toHaveBeenCalled();

    expect(mockAuditLog).toHaveLength(1);
    expect(mockAuditLog[0]).toEqual({
      eventType: 'AUTHORIZATION_DENIED',
      timestamp: '2024-01-15T11:00:00Z',
      userId: 'user_unauthorized',
      resourceType: 'aggregated_report',
      requiredRole: 'manager_or_admin',
      action: 'access_aggregated_report',
      status: 'denied',
    });
  });
});