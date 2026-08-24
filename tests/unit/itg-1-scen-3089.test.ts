import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AgentInput, Tx1Imp1AgentOutput } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('Tx1Imp1Agent - システム連携エラーハンドリング', () => {
  // SCEN-3089
  test('日報システムAPI呼び出し時のシステム連携エラーで副作用確定前に人へ引き継ぐ', async () => {
    const executionTimestamp = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const morningMeetingStartTime = new Date('2024-01-15T09:15:00Z');
    const targetTeamIds = ['team-001', 'team-002'];
    const managerUserId = 'manager-001';

    const input: Tx1Imp1AgentInput = {
      executionTimestamp,
      reportDeadlineTime,
      morningMeetingStartTime,
      targetTeamIds,
      managerUserId,
    };

    const notificationSendCalls: Array<{ userId: string; message: string }> = [];
    const reportDataFetchCalls: number[] = [];
    const unsubmittedMembersNotificationCalls: number[] = [];
    const issueExtractionCalls: number[] = [];

    const fakeAiClient: Tx1Imp1AiClient = {
      async executeAction01_FetchReportData() {
        reportDataFetchCalls.push(1);
        const error = new Error('System connection failed: HTTP 500 from report API');
        (error as any).code = 'SYSTEM_CONNECTION_ERROR';
        (error as any).statusCode = 500;
        throw error;
      },

      async executeAction02_CreateUnsubmittedList() {
        unsubmittedMembersNotificationCalls.push(1);
        return {
          unsubmittedMembers: [],
          totalTeamMembers: 0,
        };
      },

      async executeAction03_ExtractAndClassifyIssues() {
        issueExtractionCalls.push(1);
        return {
          extractedIssues: [],
          totalIssuesFound: 0,
        };
      },

      async executeAction04_ComputePriorityScores() {
        return {
          prioritizedIssues: [],
        };
      },

      async executeAction05_GenerateMorningMeetingMaterial() {
        return {
          materialUrl: '',
        };
      },

      async executeAction06_SendManagerNotification() {
        return {
          notificationSent: false,
        };
      },

      async sendErrorAlertToManager(userId: string, errorMessage: string) {
        notificationSendCalls.push({
          userId,
          message: errorMessage,
        });
      },

      async recordAuditLog(event: {
        transactionId: string;
        timestamp: Date;
        action: string;
        status: string;
        errorDetails?: string;
        userId: string;
      }) {
        return;
      },
    };

    let caughtError: Error | null = null;
    let executionResult: Tx1Imp1AgentOutput | null = null;

    try {
      executionResult = await runTx1Imp1Agent(input, fakeAiClient);
    } catch (error) {
      caughtError = error as Error;
    }

    expect(caughtError).not.toBeNull();
    expect((caughtError as any)?.code).toBe('SYSTEM_CONNECTION_ERROR');

    expect(reportDataFetchCalls.length).toBe(1);

    expect(unsubmittedMembersNotificationCalls.length).toBe(0);

    expect(issueExtractionCalls.length).toBe(0);

    expect(notificationSendCalls.length).toBeGreaterThan(0);
    expect(notificationSendCalls[0].userId).toBe(managerUserId);
    expect(notificationSendCalls[0].message).toMatch(/日報取得に失敗/);
    expect(notificationSendCalls[0].message).toMatch(/システム連携エラー|System connection failed/);

    expect(executionResult).toBeNull();
  });
});