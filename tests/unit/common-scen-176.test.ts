import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx9Imp1Agent, type Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('tx-9-imp-1 orchestrator', () => {
  // SCEN-176
  test('should rollback completed side effects when Action 6 fails midway', async () => {
    const auditLog: Array<{
      timestamp: string;
      event: string;
      actionNumber: number;
      status: string;
    }> = [];

    const aggregatedReportId = 'rpt-agg-001';
    const notificationBatchId = 'notif-batch-001';
    const metricsId = 'metrics-001';
    const classificationId = 'classify-001';
    const patternId = 'pattern-001';

    const fakeAiClient: Tx9Imp1AiClient = {
      async executeAction01_AggregateReportData(input: {
        aggregationStartDate: string;
        aggregationEndDate: string;
        targetTeamIds: string[];
        requestedByUserId: string;
      }) {
        auditLog.push({
          timestamp: new Date('2024-01-15T09:00:00Z').toISOString(),
          event: 'Action 1 completed',
          actionNumber: 1,
          status: 'success',
        });
        return {
          reportDataId: aggregatedReportId,
          totalReportsCollected: 45,
          missingReports: ['user-005', 'user-012'],
          aggregationCompletedAt: new Date('2024-01-15T09:05:00Z').toISOString(),
        };
      },

      async executeAction02_SendReminderNotifications(input: {
        missingUserIds: string[];
      }) {
        auditLog.push({
          timestamp: new Date('2024-01-15T09:10:00Z').toISOString(),
          event: 'Action 2 completed',
          actionNumber: 2,
          status: 'success',
        });
        return {
          notificationBatchId,
          sentCount: 2,
          failedCount: 0,
          sentAt: new Date('2024-01-15T09:10:30Z').toISOString(),
        };
      },

      async executeAction03_QuantifyProductivityMetrics(input: {
        reportDataId: string;
      }) {
        auditLog.push({
          timestamp: new Date('2024-01-15T09:15:00Z').toISOString(),
          event: 'Action 3 completed',
          actionNumber: 3,
          status: 'success',
        });
        return {
          metricsId,
          issueResolutionSpeed: 4.2,
          reportSubmissionRate: 88.9,
          issueRecurrenceRate: 12.5,
          calculatedAt: new Date('2024-01-15T09:20:00Z').toISOString(),
        };
      },

      async executeAction04_ClassifyIssuesByPriority(input: {
        reportDataId: string;
      }) {
        auditLog.push({
          timestamp: new Date('2024-01-15T09:25:00Z').toISOString(),
          event: 'Action 4 completed',
          actionNumber: 4,
          status: 'success',
        });
        return {
          classificationId,
          highPriorityCount: 8,
          mediumPriorityCount: 15,
          lowPriorityCount: 22,
          classifiedAt: new Date('2024-01-15T09:30:00Z').toISOString(),
        };
      },

      async executeAction05_DetectRecurrencePatterns(input: {
        classificationId: string;
      }) {
        auditLog.push({
          timestamp: new Date('2024-01-15T09:35:00Z').toISOString(),
          event: 'Action 5 completed',
          actionNumber: 5,
          status: 'success',
        });
        return {
          patternId,
          detectedPatterns: 3,
          recurrenceRiskScores: [0.78, 0.62, 0.41],
          detectedAt: new Date('2024-01-15T09:40:00Z').toISOString(),
        };
      },

      async executeAction06_ProposeCountermeasures(input: {
        patternId: string;
        metricsId: string;
      }) {
        auditLog.push({
          timestamp: new Date('2024-01-15T09:45:00Z').toISOString(),
          event: 'Action 6 started',
          actionNumber: 6,
          status: 'in_progress',
        });
        const externalApiError = new Error('External API unavailable');
        (externalApiError as any).code = 'EXTERNAL_API_FAILURE';
        throw externalApiError;
      },

      async rollbackAction03(metricsId: string) {
        auditLog.push({
          timestamp: new Date('2024-01-15T09:50:00Z').toISOString(),
          event: 'Action 3 ロールバック実行',
          actionNumber: 3,
          status: 'rollback',
        });
      },

      async rollbackAction04(classificationId: string) {
        auditLog.push({
          timestamp: new Date('2024-01-15T09:51:00Z').toISOString(),
          event: 'Action 4 ロールバック実行',
          actionNumber: 4,
          status: 'rollback',
        });
      },

      async rollbackAction05(patternId: string) {
        auditLog.push({
          timestamp: new Date('2024-01-15T09:52:00Z').toISOString(),
          event: 'Action 5 ロールバック実行',
          actionNumber: 5,
          status: 'rollback',
        });
      },
    };

    const input = {
      aggregationStartDate: '2024-01-01',
      aggregationEndDate: '2024-01-15',
      targetTeamIds: ['team-a', 'team-b'],
      requestedByUserId: 'user-001',
    };

    let caughtError: Error | null = null;
    let result: any = null;

    try {
      result = await runTx9Imp1Agent(input, fakeAiClient);
    } catch (e) {
      caughtError = e as Error;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError?.message).toMatch(/External API unavailable/);

    expect(result?.status).toBeUndefined();

    expect(auditLog.length).toBe(8);

    expect(auditLog[0].event).toBe('Action 1 completed');
    expect(auditLog[0].actionNumber).toBe(1);
    expect(auditLog[0].status).toBe('success');

    expect(auditLog[1].event).toBe('Action 2 completed');
    expect(auditLog[1].actionNumber).toBe(2);
    expect(auditLog[1].status).toBe('success');

    expect(auditLog[2].event).toBe('Action 3 completed');
    expect(auditLog[2].actionNumber).toBe(3);
    expect(auditLog[2].status).toBe('success');

    expect(auditLog[3].event).toBe('Action 4 completed');
    expect(auditLog[3].actionNumber).toBe(4);
    expect(auditLog[3].status).toBe('success');

    expect(auditLog[4].event).toBe('Action 5 completed');
    expect(auditLog[4].actionNumber).toBe(5);
    expect(auditLog[4].status).toBe('success');

    expect(auditLog[5].event).toBe('Action 6 started');
    expect(auditLog[5].actionNumber).toBe(6);
    expect(auditLog[5].status).toBe('in_progress');

    const rollbackEvents = auditLog.filter(
      (log) => log.status === 'rollback'
    );
    expect(rollbackEvents.length).toBe(3);

    expect(rollbackEvents[0].event).toBe('Action 3 ロールバック実行');
    expect(rollbackEvents[0].actionNumber).toBe(3);

    expect(rollbackEvents[1].event).toBe('Action 4 ロールバック実行');
    expect(rollbackEvents[1].actionNumber).toBe(4);

    expect(rollbackEvents[2].event).toBe('Action 5 ロールバック実行');
    expect(rollbackEvents[2].actionNumber).toBe(5);

    expect(auditLog[6].event).toBe('Action 3 ロールバック実行');
    expect(auditLog[7].event).toBe('Action 4 ロールバック実行');

    const timestampSequence = auditLog.map((log) =>
      new Date(log.timestamp).getTime()
    );
    for (let i = 1; i < timestampSequence.length; i++) {
      expect(timestampSequence[i]).toBeGreaterThanOrEqual(
        timestampSequence[i - 1]
      );
    }

    const action1Logs = auditLog.filter((log) => log.actionNumber === 1);
    expect(action1Logs.length).toBe(1);
    expect(action1Logs[0].status).toBe('success');

    const action2Logs = auditLog.filter((log) => log.actionNumber === 2);
    expect(action2Logs.length).toBe(1);
    expect(action2Logs[0].status).toBe('success');
  });
});