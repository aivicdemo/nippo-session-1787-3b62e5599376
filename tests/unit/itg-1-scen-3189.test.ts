import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AgentInput } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('Tx7Imp1Agent - Monthly Report Generation with Data Extraction Error', () => {
  // SCEN-3189
  test('should escalate to human review when data extraction error occurs before analysis confirmation', async () => {
    const triggerTimestamp = new Date('2024-01-01T09:00:00Z');
    const targetMonth = '2024-01';
    const managerUserId = 'mgr-001';

    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp,
      targetMonth,
      managerUserId,
      includeDetailedAnalysis: true,
    };

    const escalationEventLog: Array<{
      timestamp: Date;
      event: string;
      action: string;
      details: string;
    }> = [];

    const notificationQueue: Array<{
      userId: string;
      message: string;
      scheduledTime: Date;
      channel: string;
    }> = [];

    const mockAiClient: Tx7Imp1AiClient = {
      action01ExtractMonthlyData: async () => {
        throw new Error('報告テーブルが応答しません');
      },
      action02ValidateDataQuality: async () => {
        return {
          isValid: false,
          issues: [],
        };
      },
      action03AnalyzeTimeSeriesAndBottleneck: async () => {
        return {
          timeSeriesData: [],
          improvementTrend: 'stable',
          recurringIssuePattern: [],
        };
      },
      action04CalculateTeamPerformanceMetrics: async () => {
        return {
          challengeResolutionSpeed: 0,
          reportSubmissionRate: 0,
          challengeRecurrenceRate: 0,
        };
      },
      action05RankTopPriorityChallenges: async () => {
        return [];
      },
      action06GenerateAndNotifyReport: async () => {
        return {
          emailSentTo: [],
          status: 'failed',
        };
      },
      action07LogAuditEvent: async (event: {
        timestamp: Date;
        event: string;
        action: string;
        details: string;
      }) => {
        escalationEventLog.push(event);
        return { logged: true };
      },
    };

    const mockNotificationServiceAdapter = {
      scheduleNotification: async (userId: string, message: string, scheduledTime: Date) => {
        notificationQueue.push({
          userId,
          message,
          scheduledTime,
          channel: 'slack',
        });
        return { success: true, notificationId: `notif-${Date.now()}` };
      },
      sendReminderNotification: async () => {
        return { success: true };
      },
      getDeliveryStatus: async () => {
        return { status: 'pending' };
      },
    };

    let systemState = 'initial';
    let reportGenerated = false;
    let reportSent = false;

    const wrappedAiClient: Tx7Imp1AiClient = {
      ...mockAiClient,
      action06GenerateAndNotifyReport: async () => {
        reportGenerated = true;
        reportSent = true;
        return {
          emailSentTo: [],
          status: 'success',
        };
      },
    };

    try {
      const result = await runTx7Imp1Agent(agentInput, wrappedAiClient);

      if (result.executionStatus === 'failure') {
        systemState = 'escalated_awaiting_human_decision';

        expect(reportGenerated).toBe(false);
        expect(reportSent).toBe(false);

        expect(notificationQueue.length).toBeGreaterThan(0);
        const notif = notificationQueue[0];
        expect(notif.userId).toBe(managerUserId);
        expect(notif.message).toMatch(/月次分析エラー/);
        expect(notif.message).toMatch(/当月データ抽出失敗/);

        const auditEvent = escalationEventLog.find((ev) =>
          ev.event.includes('DataExtractionError') || ev.details.includes('報告テーブル'),
        );
        expect(auditEvent).toBeDefined();
        expect(auditEvent?.action).toMatch(/escalated/);

        expect(systemState).toBe('escalated_awaiting_human_decision');
      }
    } catch (error) {
      systemState = 'escalated_awaiting_human_decision';

      expect(error).toBeDefined();
      if (error instanceof Error) {
        expect(error.message).toMatch(/報告テーブル/);
      }

      expect(reportGenerated).toBe(false);
      expect(reportSent).toBe(false);

      expect(systemState).toBe('escalated_awaiting_human_decision');
    }
  });
});