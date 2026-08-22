import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { type Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';
import { type Tx4AgentExecutionRequest, type Tx4AgentExecutionResult } from '../../src/types';

describe('Tx4Imp1Agent Authorization', () => {
  // SCEN-086
  test('should deny authorization for non-director user attempting restricted operations', async () => {
    const executionTimestamp = new Date('2024-01-15T11:00:00Z');
    const targetDate = '2024-01-15';
    const executorUserIdNonDirector = 'user-B-general-employee';
    const executorUserIdDirector = 'user-A-director';
    const teamId = 'team-001';

    const auditLogEntries: Array<{
      eventType: string;
      userId: string;
      attemptedAction: string;
      reason: string;
      timestamp: Date;
    }> = [];

    const mockAiClientNonDirector: Tx4Imp1AiClient = {
      executeAction01: jest.fn(async (prompt: string) => {
        auditLogEntries.push({
          eventType: 'tx4_imp_1_authorization_check_attempt',
          userId: executorUserIdNonDirector,
          attemptedAction: 'action-01',
          reason: 'cross_team_data_access',
          timestamp: new Date('2024-01-15T11:00:01Z'),
        });
        throw new Error('権限がありません。部長権限が必要です');
      }),
      executeAction02: jest.fn(async (prompt: string) => {
        throw new Error('権限がありません。部長権限が必要です');
      }),
      executeAction03: jest.fn(async (prompt: string) => {
        throw new Error('権限がありません。部長権限が必要です');
      }),
      executeAction04: jest.fn(async (prompt: string) => {
        auditLogEntries.push({
          eventType: 'tx4_imp_1_authorization_denied',
          userId: executorUserIdNonDirector,
          attemptedAction: 'action-04',
          reason: 'escalation_case_priority_judgment',
          timestamp: new Date('2024-01-15T11:00:02Z'),
        });
        throw new Error('権限がありません。部長権限が必要です');
      }),
      executeAction05: jest.fn(async (prompt: string) => {
        throw new Error('権限がありません。部長権限が必要です');
      }),
      executeAction06: jest.fn(async (prompt: string) => {
        throw new Error('権限がありません。部長権限が必要です');
      }),
      executeAction07: jest.fn(async (prompt: string) => {
        auditLogEntries.push({
          eventType: 'tx4_imp_1_authorization_denied',
          userId: executorUserIdNonDirector,
          attemptedAction: 'action-07',
          reason: 'final_approval_authority',
          timestamp: new Date('2024-01-15T11:00:03Z'),
        });
        throw new Error('権限がありません。部長権限が必要です');
      }),
    };

    const requestNonDirector: Tx4AgentExecutionRequest = {
      executionTimestamp,
      targetDate,
      executorUserId: executorUserIdNonDirector,
      teamId,
    };

    let authorizationDeniedThrown = false;
    let caughtErrorMessage = '';

    try {
      await runTx4Imp1Agent(requestNonDirector, mockAiClientNonDirector);
    } catch (error) {
      authorizationDeniedThrown = true;
      caughtErrorMessage = (error as Error).message;
    }

    expect(authorizationDeniedThrown).toBe(true);
    expect(caughtErrorMessage).toMatch(/権限がありません/);
    expect(caughtErrorMessage).toMatch(/部長権限が必要/);

    const deniedAuditEvents = auditLogEntries.filter(
      (entry) => entry.eventType === 'tx4_imp_1_authorization_denied'
    );
    expect(deniedAuditEvents.length).toBeGreaterThan(0);

    const crossTeamAccessEvent = auditLogEntries.find(
      (entry) => entry.reason === 'cross_team_data_access'
    );
    expect(crossTeamAccessEvent).toBeDefined();
    expect(crossTeamAccessEvent?.userId).toBe(executorUserIdNonDirector);
    expect(crossTeamAccessEvent?.attemptedAction).toBe('action-01');

    const escalationCaseEvent = auditLogEntries.find(
      (entry) => entry.reason === 'escalation_case_priority_judgment'
    );
    expect(escalationCaseEvent).toBeDefined();
    expect(escalationCaseEvent?.userId).toBe(executorUserIdNonDirector);
    expect(escalationCaseEvent?.attemptedAction).toBe('action-04');

    const finalApprovalEvent = auditLogEntries.find(
      (entry) => entry.reason === 'final_approval_authority'
    );
    expect(finalApprovalEvent).toBeDefined();
    expect(finalApprovalEvent?.userId).toBe(executorUserIdNonDirector);
    expect(finalApprovalEvent?.attemptedAction).toBe('action-07');

    const mockAiClientDirector: Tx4Imp1AiClient = {
      executeAction01: jest.fn(async (prompt: string) => {
        return JSON.stringify({
          aggregatedReportCount: 42,
          status: 'success',
        });
      }),
      executeAction02: jest.fn(async (prompt: string) => {
        return JSON.stringify({
          extractedIssueCount: 12,
          status: 'success',
        });
      }),
      executeAction03: jest.fn(async (prompt: string) => {
        return JSON.stringify({
          prioritizedIssues: [
            {
              issueId: 'issue-001',
              description: 'critical-issue',
              priority: 'high',
            },
          ],
          status: 'success',
        });
      }),
      executeAction04: jest.fn(async (prompt: string) => {
        return JSON.stringify({
          issues: [
            {
              issueId: 'issue-002',
              escalationRequired: true,
            },
          ],
          status: 'success',
        });
      }),
      executeAction05: jest.fn(async (prompt: string) => {
        return JSON.stringify({
          countermeasurePlan: {
            planId: 'plan-001',
            recommendedActions: ['action-a', 'action-b'],
            estimatedResolutionDays: 3,
            assignedOwner: 'manager-001',
          },
          status: 'success',
        });
      }),
      executeAction06: jest.fn(async (prompt: string) => {
        return JSON.stringify({
          dashboardGenerated: true,
          status: 'success',
        });
      }),
      executeAction07: jest.fn(async (prompt: string) => {
        return JSON.stringify({
          notificationSent: true,
          status: 'success',
        });
      }),
    };

    const requestDirector: Tx4AgentExecutionRequest = {
      executionTimestamp,
      targetDate,
      executorUserId: executorUserIdDirector,
      teamId,
    };

    let directorExecutionCompleted = false;

    try {
      const resultDirector = await runTx4Imp1Agent(
        requestDirector,
        mockAiClientDirector
      );
      if (
        resultDirector &&
        resultDirector.aggregatedReportCount !== undefined
      ) {
        directorExecutionCompleted = true;
      }
    } catch (error) {
      directorExecutionCompleted = false;
    }

    expect(directorExecutionCompleted).toBe(true);
  });
});