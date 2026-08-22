import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('Tx3Imp1Agent - Authorization Denial for Protected Report Data', () => {
  // SCEN-068
  test('should deny access to aggregated report data for unauthorized user and prevent all downstream actions', async () => {
    const unauthorizedUserId = 'user_unauthorized';
    const unauthorizedRole = 'staff';
    const reportAggregationId = 'report_agg_001';
    const analysisExecutionTime = new Date('2024-01-15T09:00:00Z');
    const managerEmail = 'manager@example.com';

    const auditEvents: Array<{
      eventType: string;
      failureReason?: string;
      deniedResourceType?: string;
      deniedUserId?: string;
      requiredRole?: string;
      timestamp: Date;
    }> = [];

    const fakeAiClient = {
      callTool: jest.fn(async (toolName: string, args: Record<string, unknown>) => {
        if (toolName === 'extract_issue_keywords') {
          const { aggregated_report_id, user_id } = args;
          if (aggregated_report_id === reportAggregationId && user_id === unauthorizedUserId) {
            const auditEvent = {
              eventType: 'AUTHORIZATION_DENIED',
              failureReason: 'AUTHORIZATION_DENIED',
              deniedResourceType: 'aggregated_report',
              deniedUserId: unauthorizedUserId,
              requiredRole: 'manager_or_admin',
              timestamp: new Date(),
            };
            auditEvents.push(auditEvent);

            const error = new Error('Access denied to protected resource');
            (error as any).name = 'AccessDeniedError';
            (error as any).code = 'AUTHORIZATION_DENIED';
            (error as any).deniedResourceType = 'aggregated_report';
            (error as any).deniedUserId = unauthorizedUserId;
            (error as any).requiredRole = 'manager_or_admin';
            throw error;
          }
        }
        return {};
      }),
    };

    const input = {
      reportAggregationId,
      analysisExecutionTime,
      managerEmail,
      priorityThresholds: {
        highPriorityMinScore: 70,
        mediumPriorityMinScore: 40,
      },
    };

    const userContext = {
      userId: unauthorizedUserId,
      role: unauthorizedRole,
    };

    let caughtError: any = null;
    let agentOutput: any = null;

    try {
      agentOutput = await runTx3Imp1Agent(input, fakeAiClient as any, userContext as any);
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.name).toBe('AccessDeniedError');
    expect(caughtError.code).toBe('AUTHORIZATION_DENIED');
    expect(caughtError.deniedResourceType).toBe('aggregated_report');
    expect(caughtError.deniedUserId).toBe('user_unauthorized');
    expect(caughtError.requiredRole).toBe('manager_or_admin');

    expect(fakeAiClient.callTool).toHaveBeenCalledTimes(1);
    expect(fakeAiClient.callTool).toHaveBeenCalledWith(
      'extract_issue_keywords',
      expect.objectContaining({
        aggregated_report_id: reportAggregationId,
        user_id: unauthorizedUserId,
      })
    );

    expect(auditEvents).toHaveLength(1);
    expect(auditEvents[0]).toMatchObject({
      eventType: 'AUTHORIZATION_DENIED',
      failureReason: 'AUTHORIZATION_DENIED',
      deniedResourceType: 'aggregated_report',
      deniedUserId: 'user_unauthorized',
      requiredRole: 'manager_or_admin',
    });

    expect(agentOutput).toBeNull();
  });
});