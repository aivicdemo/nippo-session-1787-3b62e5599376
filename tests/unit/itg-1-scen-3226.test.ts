import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';
import type { Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('tx-9-imp-1: 日報集約から分析報告までの自動実行エージェント', () => {
  // SCEN-3226
  test('should escalate to human when system integration error occurs during action 5', async () => {
    const aggregationStartDate = '2024-01-08';
    const aggregationEndDate = '2024-01-14';
    const targetTeamIds = ['team-001'];
    const managerUserId = 'manager-001';

    const aggregatedReports = [
      {
        memberId: 'eng-001',
        date: '2024-01-08',
        yesterday: 'Feature A implementation',
        today: 'Feature A testing',
        issues: 'Database connection timeout',
      },
      {
        memberId: 'eng-002',
        date: '2024-01-08',
        yesterday: 'Feature B design',
        today: 'Feature B implementation',
        issues: 'Database connection timeout',
      },
    ];

    const quantifiedMetrics = {
      issueFrequencyPerDay: 1.4,
      averageResolutionDays: 3.2,
      completionRate: 87.5,
    };

    const classifiedIssues = [
      { keyword: 'Database connection timeout', frequency: 2, severity: 'high' },
      { keyword: 'Feature A implementation', frequency: 1, severity: 'medium' },
    ];

    const escalationNotificationCalls: Array<{
      userId: string;
      message: string;
    }> = [];

    const escalationLogEvents: Array<{
      eventType: string;
      escalationCondition: string;
      timestamp: string;
      pendingSideEffects: Record<string, unknown>;
    }> = [];

    const aiClient: Tx9Imp1AiClient = {
      action01_aggregateReports: async () => ({
        success: true,
        aggregatedReports,
      }),

      action02_quantifyMetrics: async () => ({
        success: true,
        metrics: quantifiedMetrics,
      }),

      action03_classifyIssues: async () => ({
        success: true,
        classifiedIssues,
      }),

      action04_prioritizeIssues: async () => ({
        success: true,
        prioritizedIssues: classifiedIssues.sort(
          (a, b) => b.frequency - a.frequency
        ),
      }),

      action05_detectRecurrencePatterns: async () => {
        throw new Error('SYSTEM_INTEGRATION_ERROR: Failed to query historical issue database');
      },

      action06_proposeCorrectives: async () => ({
        success: true,
        proposals: [],
      }),

      action07_generateReport: async () => ({
        success: true,
        reportId: 'report-001',
      }),
    };

    const notificationStub = {
      sendReminderNotification: async (userId: string, message: string) => {
        escalationNotificationCalls.push({ userId, message });
        return { success: true, deliveryStatus: 'delivered' };
      },
    };

    const auditLogger = {
      logEscalationEvent: (event: {
        eventType: string;
        escalationCondition: string;
        timestamp: string;
        pendingSideEffects: Record<string, unknown>;
      }) => {
        escalationLogEvents.push(event);
      },
    };

    const input = {
      aggregationPeriodStart: new Date(`${aggregationStartDate}T00:00:00Z`),
      aggregationPeriodEnd: new Date(`${aggregationEndDate}T23:59:59Z`),
      targetTeamIds,
      managerUserId,
    };

    const result = await runTx9Imp1Agent(input, aiClient, {
      notificationService: notificationStub,
      auditLogger,
    });

    expect(result.escalationRequired).toBe(true);
    expect(result.escalationReason).toBe('SYSTEM_INTEGRATION_ERROR');

    expect(result.aggregatedData).toBeDefined();
    expect(result.aggregatedData.reports).toEqual(aggregatedReports);
    expect(result.aggregatedData.reports.length).toBe(2);

    expect(result.quantifiedMetrics).toBeDefined();
    expect(result.quantifiedMetrics.issueFrequencyPerDay).toBe(1.4);
    expect(result.quantifiedMetrics.averageResolutionDays).toBe(3.2);
    expect(result.quantifiedMetrics.completionRate).toBe(87.5);

    expect(result.classifiedIssues).toBeDefined();
    expect(result.classifiedIssues.length).toBe(2);
    expect(result.classifiedIssues[0].keyword).toBe('Database connection timeout');

    expect(result.recurrencePatterns).toBeUndefined();
    expect(result.correctiveProposals).toBeUndefined();
    expect(result.analysisReport).toBeUndefined();

    expect(escalationNotificationCalls.length).toBeGreaterThan(0);
    const managerNotification = escalationNotificationCalls.find(
      (call) => call.userId === managerUserId
    );
    expect(managerNotification).toBeDefined();
    expect(managerNotification?.message).toMatch(/システム連携エラー|エラーが発生/i);

    expect(escalationLogEvents.length).toBeGreaterThan(0);
    const escalationEvent = escalationLogEvents[0];
    expect(escalationEvent.eventType).toBe('escalation_triggered');
    expect(escalationEvent.escalationCondition).toBe('SYSTEM_INTEGRATION_ERROR');
    expect(escalationEvent.pendingSideEffects).toBeDefined();
    expect(escalationEvent.pendingSideEffects.aggregatedReports).toBe(2);
    expect(escalationEvent.pendingSideEffects.quantifiedMetrics).toEqual({
      issueFrequencyPerDay: 1.4,
      averageResolutionDays: 3.2,
      completionRate: 87.5,
    });
    expect(escalationEvent.timestamp).toBeDefined();

    expect(result.manualReviewRequired).toBe(true);
    expect(result.manualReviewId).toBeDefined();
  });
});