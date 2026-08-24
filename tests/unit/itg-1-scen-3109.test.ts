import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import type { Tx2Imp1AgentInput, Tx2Imp1AgentOutput } from '../../src/agents/tx-2-imp-1/orchestrator';
import type { Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('Tx2Imp1Agent Authorization Denial', () => {
  // SCEN-3109
  test('should deny all unauthorized data access and tool operations with explicit rejection messages and audit logging', async () => {
    const executionTimestamp = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineTime = new Date('2024-01-15T10:00:00Z');
    const targetTeamIds = ['team-001'];
    const managerUserIds = ['manager-001'];

    const input: Tx2Imp1AgentInput = {
      executionTimestamp,
      reportDeadlineTime,
      targetTeamIds,
      managerUserIds,
    };

    const authorizationDenialErrors: Array<{
      action: number;
      reason: string;
      attemptedOperation: string;
      timestamp: Date;
      userContext: string;
    }> = [];

    const fakeAiClient: Tx2Imp1AiClient = {
      action01_fetchReportStatus: async () => {
        const denialRecord = {
          action: 1,
          reason: 'Authorization Denied: Insufficient privilege to access personal data outside authorized scope',
          attemptedOperation: 'Access to external team member personal information (salary, evaluation, medical data)',
          timestamp: new Date('2024-01-15T09:00:01Z'),
          userContext: 'agent-process-tx2-imp1',
        };
        authorizationDenialErrors.push(denialRecord);
        throw new Error(denialRecord.reason);
      },

      action02_normalizeFormats: async () => {
        const denialRecord = {
          action: 2,
          reason: 'Authorization Denied: Data modification requires department head approval',
          attemptedOperation: 'Direct update to master database without approval',
          timestamp: new Date('2024-01-15T09:00:02Z'),
          userContext: 'agent-process-tx2-imp1',
        };
        authorizationDenialErrors.push(denialRecord);
        throw new Error(denialRecord.reason);
      },

      action03_extractIssues: async () => {
        const denialRecord = {
          action: 3,
          reason: 'Authorization Denied: Text analysis service access denied',
          attemptedOperation: 'Call to TextAnalysisServiceAdapter without authorization',
          timestamp: new Date('2024-01-15T09:00:03Z'),
          userContext: 'agent-process-tx2-imp1',
        };
        authorizationDenialErrors.push(denialRecord);
        throw new Error(denialRecord.reason);
      },

      action04_prioritizeAndColorize: async () => {
        const denialRecord = {
          action: 4,
          reason: 'Authorization Denied: Insufficient privilege for color-coding operations',
          attemptedOperation: 'Unauthorized dashboard display modification',
          timestamp: new Date('2024-01-15T09:00:04Z'),
          userContext: 'agent-process-tx2-imp1',
        };
        authorizationDenialErrors.push(denialRecord);
        throw new Error(denialRecord.reason);
      },

      action05_identifyUnsubmitted: async () => {
        const denialRecord = {
          action: 5,
          reason: 'Authorization Denied: External mail distribution prohibited without explicit approval',
          attemptedOperation: 'Attempt to send external email distribution list',
          timestamp: new Date('2024-01-15T09:00:05Z'),
          userContext: 'agent-process-tx2-imp1',
        };
        authorizationDenialErrors.push(denialRecord);
        throw new Error(denialRecord.reason);
      },

      action06_generateAndSendEmail: async () => {
        const denialRecord = {
          action: 6,
          reason: 'Authorization Denied: Audit log modification not permitted',
          attemptedOperation: 'Attempt to modify system audit log',
          timestamp: new Date('2024-01-15T09:00:06Z'),
          userContext: 'agent-process-tx2-imp1',
        };
        authorizationDenialErrors.push(denialRecord);
        throw new Error(denialRecord.reason);
      },
    };

    let result: Tx2Imp1AgentOutput | null = null;
    let thrownError: Error | null = null;

    try {
      result = await runTx2Imp1Agent(input, fakeAiClient);
    } catch (error) {
      thrownError = error instanceof Error ? error : new Error(String(error));
    }

    expect(thrownError).not.toBeNull();
    expect(authorizationDenialErrors.length).toBeGreaterThan(0);

    const firstDenial = authorizationDenialErrors[0];
    expect(firstDenial.reason).toMatch(/Authorization Denied/);
    expect(firstDenial.reason).toMatch(/Insufficient privilege to access personal data outside authorized scope/);
    expect(firstDenial.attemptedOperation).toMatch(/personal information/);
    expect(firstDenial.action).toBe(1);
    expect(firstDenial.timestamp).toEqual(new Date('2024-01-15T09:00:01Z'));
    expect(firstDenial.userContext).toBe('agent-process-tx2-imp1');

    const secondDenial = authorizationDenialErrors[1];
    expect(secondDenial.reason).toMatch(/Authorization Denied/);
    expect(secondDenial.reason).toMatch(/Data modification requires department head approval/);
    expect(secondDenial.attemptedOperation).toMatch(/master database/);
    expect(secondDenial.action).toBe(2);

    const thirdDenial = authorizationDenialErrors[2];
    expect(thirdDenial.reason).toMatch(/Authorization Denied/);
    expect(thirdDenial.attemptedOperation).toMatch(/TextAnalysisServiceAdapter/);
    expect(thirdDenial.action).toBe(3);

    const fourthDenial = authorizationDenialErrors[3];
    expect(fourthDenial.reason).toMatch(/Authorization Denied/);
    expect(fourthDenial.action).toBe(4);

    const fifthDenial = authorizationDenialErrors[4];
    expect(fifthDenial.reason).toMatch(/Authorization Denied/);
    expect(fifthDenial.reason).toMatch(/External mail distribution prohibited/);
    expect(fifthDenial.action).toBe(5);

    const sixthDenial = authorizationDenialErrors[5];
    expect(sixthDenial.reason).toMatch(/Authorization Denied/);
    expect(sixthDenial.reason).toMatch(/Audit log modification not permitted/);
    expect(sixthDenial.action).toBe(6);

    if (result !== null) {
      expect(result.confirmationEmailSent).toBe(false);
      expect(result.aggregatedReportCount).toBe(0);
      expect(result.extractedIssueCount).toBe(0);
      expect(result.prioritizedIssues).toEqual([]);
    }

    const allReasonsContainAuthorizationDenied = authorizationDenialErrors.every((record) =>
      record.reason.includes('Authorization Denied')
    );
    expect(allReasonsContainAuthorizationDenied).toBe(true);

    const allActionsInSequence = authorizationDenialErrors.map((record) => record.action);
    expect(allActionsInSequence).toEqual([1, 2, 3, 4, 5, 6]);

    const allTimestampsHaveContext = authorizationDenialErrors.every((record) => record.userContext === 'agent-process-tx2-imp1');
    expect(allTimestampsHaveContext).toBe(true);
  });
});