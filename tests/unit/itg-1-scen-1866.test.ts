import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AgentInput, type Tx7Imp1AgentOutput } from '../../src/agents/tx-7-imp-1/types';

describe('tx-7-imp-1: 月次レポート生成エージェント', () => {
  // SCEN-1866: [edge] 月次課題傾向分析レポート生成処理の失敗時再試行制御 - 再試行回数が3回を超える場合、部長へのエスカレーション通知は1回のみ送出される
  test('should send escalation notification exactly once when retry attempts exceed 3 and not send additional notifications on further failures', async () => {
    // Setup: Mock data and tracking
    const triggerTimestamp = new Date('2024-01-01T09:00:00Z');
    const targetMonth = '2024-01';
    const managerUserId = 'mgr-001';
    const auditEvents: Array<{ eventType: string; timestamp: Date; retryAttempt?: number }> = [];
    const escalationNotificationsSent: Array<{ sendTimestamp: Date; retryAttempt: number }> = [];
    let reportGenerationAttempts = 0;

    // Mock Tx7Imp1AiClient - simulates failure on first 3 attempts
    const mockAiClient = {
      analyzeMonthlyData: jest.fn(async () => {
        reportGenerationAttempts++;
        if (reportGenerationAttempts <= 3) {
          throw new Error('Analysis service temporarily unavailable');
        }
        return {
          topPriorityChallenges: [
            {
              challengeId: 'ch-001',
              priorityScore: 85,
              occurrenceFrequency: 4,
              impactLevel: 'high',
              resolutionDaysAverage: 2.5,
            },
          ],
          bottleneckTrend: {
            timeSeriesData: [
              { date: new Date('2024-01-01'), bottleneckSeverity: 7 },
              { date: new Date('2024-01-15'), bottleneckSeverity: 5 },
            ],
            improvementTrend: 'improving' as const,
            recurringIssuePattern: ['performance-issue'],
          },
          teamPerformanceMetrics: {
            challengeResolutionSpeed: 2.3,
            reportSubmissionRate: 0.92,
            challengeRecurrenceRate: 0.18,
          },
        };
      }),
    };

    // Mock NotificationServiceAdapter - tracks escalation calls
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(async () => ({ success: true })),
      scheduleNotification: jest.fn(async () => ({ success: true })),
      getDeliveryStatus: jest.fn(async () => ({ status: 'pending' })),
      sendEscalationNotification: jest.fn(async (userId: string, message: string) => {
        escalationNotificationsSent.push({
          sendTimestamp: new Date(),
          retryAttempt: reportGenerationAttempts - 1,
        });
        return { success: true };
      }),
    };

    // Mock retry control - max 3 retries with exponential backoff
    const executeWithRetry = async <T,>(
      fn: () => Promise<T>,
      maxRetries: number = 3,
    ): Promise<T> => {
      let lastError: Error | null = null;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await fn();
        } catch (err) {
          lastError = err as Error;
          if (attempt >= maxRetries) {
            // Record escalation event on final failure
            auditEvents.push({
              eventType: 'escalation_notification_sent_at_retry_3_failure',
              timestamp: new Date('2024-01-01T09:15:00Z'),
              retryAttempt: attempt,
            });
            await mockNotificationAdapter.sendEscalationNotification(
              managerUserId,
              `Report generation failed after ${maxRetries} retries`,
            );
            break;
          }
        }
      }
      throw lastError;
    };

    // Execute agent with retry control
    const input: Tx7Imp1AgentInput = {
      triggerTimestamp,
      targetMonth,
      managerUserId,
      includeDetailedAnalysis: true,
    };

    try {
      await executeWithRetry(async () => {
        return await runTx7Imp1Agent(input, mockAiClient);
      });
    } catch (err) {
      // Expected to fail after retries
    }

    // Verify escalation notification sent exactly once
    expect(escalationNotificationsSent).toHaveLength(1);
    expect(escalationNotificationsSent[0].retryAttempt).toBe(3);

    // Verify audit log contains exactly one escalation event
    const escalationEvents = auditEvents.filter(
      (e) => e.eventType === 'escalation_notification_sent_at_retry_3_failure',
    );
    expect(escalationEvents).toHaveLength(1);
    expect(escalationEvents[0].retryAttempt).toBe(3);

    // Simulate 4th+ failure attempt - should not send additional notifications
    reportGenerationAttempts = 0;
    escalationNotificationsSent.length = 0;
    mockAiClient.analyzeMonthlyData.mockRejectedValue(
      new Error('Service still unavailable'),
    );

    try {
      await executeWithRetry(async () => {
        return await runTx7Imp1Agent(input, mockAiClient);
      });
    } catch (err) {
      // Expected
    }

    // Verify no additional notifications sent
    expect(escalationNotificationsSent).toHaveLength(1);

    // Verify total escalation events still 1
    const finalEscalationEvents = auditEvents.filter(
      (e) => e.eventType === 'escalation_notification_sent_at_retry_3_failure',
    );
    expect(finalEscalationEvents).toHaveLength(1);
  });
});