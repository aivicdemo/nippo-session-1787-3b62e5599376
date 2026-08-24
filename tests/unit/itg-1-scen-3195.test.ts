import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type {
  Tx7Imp1AiClient,
  Tx7Imp1AgentInput,
} from '../../src/agents/tx-7-imp-1/orchestrator';

describe('Tx7Imp1Agent - Authorization Denial', () => {
  let auditLogEntries: Array<{
    event: string;
    timestamp: string;
    userId: string;
  }> = [];

  beforeEach(() => {
    auditLogEntries = [];
  });

  afterEach(() => {
    auditLogEntries = [];
  });

  // SCEN-3195
  test('should deny authorization when unprivileged user attempts to access accumulated report data, calculate performance metrics, and present report', async () => {
    const unauthorizedUserId = 'user-without-manager-role';
    const targetMonth = '2024-01';
    const triggerTimestamp = new Date('2024-01-01T00:00:00Z');

    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp,
      targetMonth,
      managerUserId: unauthorizedUserId,
      includeDetailedAnalysis: true,
    };

    const createUnauthorizedAiClient = (): Tx7Imp1AiClient => {
      const deniedActions = new Set<string>();

      return {
        async executeAction01(): Promise<{ actionStatus: string }> {
          return { actionStatus: 'trigger_confirmed' };
        },

        async executeAction02(): Promise<{ extractedRecords: number }> {
          deniedActions.add('ACTION_02');
          const errorMessage = `ユーザーID: ${unauthorizedUserId}は蓄積報告データへのアクセス権がありません`;
          auditLogEntries.push({
            event: 'AUTHORIZATION_DENIED',
            timestamp: new Date().toISOString(),
            userId: unauthorizedUserId,
          });
          throw new Error(errorMessage);
        },

        async executeAction03(): Promise<{ timeSeriesAnalyzed: boolean }> {
          return { timeSeriesAnalyzed: true };
        },

        async executeAction04(): Promise<{ bottleneckDetected: boolean }> {
          return { bottleneckDetected: true };
        },

        async executeAction05(): Promise<{ metricsCalculated: boolean }> {
          return { metricsCalculated: true };
        },

        async executeAction06(): Promise<{ performanceMetrics: object }> {
          deniedActions.add('ACTION_06');
          const errorMessage = `ユーザーID: ${unauthorizedUserId}はチーム別パフォーマンス指標の算出権がありません`;
          auditLogEntries.push({
            event: 'AUTHORIZATION_DENIED',
            timestamp: new Date().toISOString(),
            userId: unauthorizedUserId,
          });
          throw new Error(errorMessage);
        },

        async executeAction07(): Promise<{ reportGenerated: boolean }> {
          return { reportGenerated: true };
        },

        async executeAction08(): Promise<{ reportDelivered: boolean }> {
          deniedActions.add('ACTION_08');
          const errorMessage = `ユーザーID: ${unauthorizedUserId}は部長向けレポート提示権がありません`;
          auditLogEntries.push({
            event: 'AUTHORIZATION_DENIED',
            timestamp: new Date().toISOString(),
            userId: unauthorizedUserId,
          });
          throw new Error(errorMessage);
        },

        getDeniedActions(): string[] {
          return Array.from(deniedActions);
        },
      };
    };

    const fakeAiClient = createUnauthorizedAiClient();

    try {
      await runTx7Imp1Agent(agentInput, fakeAiClient);
      expect.fail('Should have thrown authorization error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      const errorMessage = (error as Error).message;

      expect(errorMessage).toMatch(/蓄積報告データへのアクセス権/);
      expect(errorMessage).toMatch(unauthorizedUserId);

      expect(fakeAiClient.getDeniedActions()).toContain('ACTION_02');
      expect(fakeAiClient.getDeniedActions()).toContain('ACTION_06');
      expect(fakeAiClient.getDeniedActions()).toContain('ACTION_08');

      expect(auditLogEntries.length).toBeGreaterThan(0);

      const authorizationDenialLogs = auditLogEntries.filter(
        (log) => log.event === 'AUTHORIZATION_DENIED'
      );
      expect(authorizationDenialLogs.length).toBe(3);

      authorizationDenialLogs.forEach((log) => {
        expect(log.userId).toBe(unauthorizedUserId);
        expect(log.timestamp).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
        );
      });

      expect(auditLogEntries.some((log) => log.event === 'AUTHORIZATION_DENIED'))
        .toBe(true);
    }
  });
});