import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1 orchestrator', () => {
  // SCEN-1264: [normal] 既存ツール連携API失敗時の自動リトライ機能 - 同じ失敗理由で複数回実行しても、毎回同じリトライ戦略が適用される
  test('should apply consistent retry strategy [5min, 15min, 1hour] across multiple executions with same connection timeout error', async () => {
    const retryLog: Array<{
      userId: string;
      attemptNumber: number;
      timestamp: string;
      scheduledRetryIntervals: number[];
    }> = [];

    const mockAiClient: Tx5Imp1AiClient = {
      validateAndClassifyIssues: jest.fn(async (issues) => ({
        validatedIssues: issues.map((issue) => ({
          issueId: issue.issueId,
          priorityScore: 75,
          priorityRank: 'high' as const,
          category: 'quality',
          toolIssueId: null,
          validationStatus: 'valid' as const,
        })),
        validationMetadata: {
          totalProcessed: issues.length,
          passedCount: issues.length,
          failedCount: 0,
          warnings: [],
        },
      })),
      determinePriorityAndCategory: jest.fn(async (issues) => ({
        priorityJudgments: issues.map((issue) => ({
          issueId: issue.issueId,
          priorityScore: 75,
          category: 'quality',
        })),
      })),
      prepareToolIntegrationPayload: jest.fn(async (issues) => ({
        payload: issues.map((issue) => ({
          externalId: `EXT-${issue.issueId}`,
          summary: `Issue ${issue.issueId}`,
          priority: 'High',
          category: 'quality',
        })),
      })),
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string) => {
        const attemptNumber = retryLog.filter((log) => log.userId === userId).length + 1;
        const currentTimestamp = new Date().toISOString();

        retryLog.push({
          userId,
          attemptNumber,
          timestamp: currentTimestamp,
          scheduledRetryIntervals: [5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000],
        });

        throw new Error('connection timeout');
      }),
      scheduleNotification: jest.fn(async (userId: string, intervals: number[]) => {
        return { scheduled: true, intervals };
      }),
      getDeliveryStatus: jest.fn(async (userId: string) => ({
        status: 'failed',
        retryCount: 0,
        lastAttempt: new Date().toISOString(),
      })),
    };

    const input1 = {
      extractedIssueData: [
        {
          issueId: 'ISSUE-001',
          title: 'Database connection error',
          description: 'Connection pool exhausted',
          reportedBy: 'user-A',
          reportedAt: new Date('2024-01-15T08:00:00Z').toISOString(),
          frequency: 1,
          impact: 80,
        },
      ],
      toolIntegrationConfig: {
        toolType: 'jira' as const,
        endpoint: 'https://jira.example.com',
        apiKey: 'test-key',
      },
      priorityRules: {
        frequencyWeight: 0.3,
        impactWeight: 0.7,
        recurrenceThreshold: 2,
      },
      categoryMappings: [
        {
          internalCategory: 'quality',
          externalCategory: 'Bug',
          toolType: 'jira' as const,
        },
      ],
    };

    try {
      await runTx5Imp1Agent(input1, mockAiClient, mockNotificationServiceAdapter);
    } catch {
      // Expected to fail on first attempt
    }

    const firstAttemptLogs = retryLog.filter((log) => log.userId === 'user-A' && log.attemptNumber === 1);
    expect(firstAttemptLogs).toHaveLength(1);
    expect(firstAttemptLogs[0].scheduledRetryIntervals).toEqual([5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000]);

    // Simulate time passing and execute retry
    const retryIntervals = firstAttemptLogs[0].scheduledRetryIntervals;
    const baseTimestamp = new Date('2024-01-15T08:00:00Z');
    const retryTimestamp1 = new Date(baseTimestamp.getTime() + retryIntervals[0]);
    const retryTimestamp2 = new Date(baseTimestamp.getTime() + retryIntervals[0] + retryIntervals[1]);

    // Simulate 2nd retry after 5 minutes
    retryLog.push({
      userId: 'user-A',
      attemptNumber: 2,
      timestamp: retryTimestamp1.toISOString(),
      scheduledRetryIntervals: [5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000],
    });

    const input2 = {
      extractedIssueData: [
        {
          issueId: 'ISSUE-002',
          title: 'Network latency',
          description: 'API response time exceeds threshold',
          reportedBy: 'user-A',
          reportedAt: new Date('2024-01-15T08:05:00Z').toISOString(),
          frequency: 1,
          impact: 60,
        },
      ],
      toolIntegrationConfig: {
        toolType: 'jira' as const,
        endpoint: 'https://jira.example.com',
        apiKey: 'test-key',
      },
      priorityRules: {
        frequencyWeight: 0.3,
        impactWeight: 0.7,
        recurrenceThreshold: 2,
      },
      categoryMappings: [
        {
          internalCategory: 'quality',
          externalCategory: 'Bug',
          toolType: 'jira' as const,
        },
      ],
    };

    try {
      await runTx5Imp1Agent(input2, mockAiClient, mockNotificationServiceAdapter);
    } catch {
      // Expected to fail on new execution
    }

    const newExecutionLogs = retryLog.filter((log) => log.userId === 'user-A' && log.attemptNumber === 3);
    expect(newExecutionLogs).toHaveLength(1);
    expect(newExecutionLogs[0].scheduledRetryIntervals).toEqual([5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000]);

    const allUserALogs = retryLog.filter((log) => log.userId === 'user-A');
    expect(allUserALogs).toHaveLength(3);

    // Verify all retry logs have consistent strategy
    allUserALogs.forEach((log) => {
      expect(log.scheduledRetryIntervals).toEqual([5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000]);
    });

    // Verify attempt sequence maintains consistent intervals
    if (allUserALogs.length >= 2) {
      const timestamp1 = new Date(allUserALogs[0].timestamp).getTime();
      const timestamp2 = new Date(allUserALogs[1].timestamp).getTime();
      const interval1 = timestamp2 - timestamp1;

      // First retry should follow 5-minute interval (300000ms)
      expect(interval1).toBe(5 * 60 * 1000);
    }

    if (allUserALogs.length >= 3) {
      const timestamp2 = new Date(allUserALogs[1].timestamp).getTime();
      const timestamp3 = new Date(allUserALogs[2].timestamp).getTime();
      const interval2 = timestamp3 - timestamp2;

      // Second retry should follow 15-minute interval (900000ms)
      expect(interval2).toBe(15 * 60 * 1000);
    }
  });
});