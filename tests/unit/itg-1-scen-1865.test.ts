import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AgentInput, Tx7Imp1AgentOutput } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('朝会報告管理システム - 月次レポート生成エージェント', () => {
  // SCEN-1865: [edge] 月次課題傾向分析レポート生成処理の失敗時再試行制御 - 再試行回数が3回未満の時点では部長へのエスカレーション通知が送出されない
  test('再試行が2回までは部長へのエスカレーション通知を送出しない', async () => {
    const targetMonth = '2024-01';
    const managerUserId = 'manager-user-001';
    const triggerTimestamp = new Date('2024-02-01T09:00:00Z');

    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'success',
        deliveryIds: ['notif-001'],
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'sched-001',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        delivered: 0,
        failed: 0,
        pending: 0,
      }),
    };

    const auditLogRecords: Array<{
      timestamp: Date;
      action: string;
      retryCount: number;
    }> = [];

    const notificationSentLogs: Array<{
      timestamp: Date;
      targetUserId: string;
      notificationType: string;
    }> = [];

    let retryAttemptCount = 0;

    const failingAiClient: Tx7Imp1AiClient = {
      generateMonthlyReport: jest.fn(async (input) => {
        retryAttemptCount += 1;

        // 1回目と2回目の失敗をシミュレート
        if (retryAttemptCount <= 2) {
          auditLogRecords.push({
            timestamp: new Date(),
            action: `レポート生成処理失敗・再試行${retryAttemptCount}回目`,
            retryCount: retryAttemptCount,
          });

          // 再試行回数が3未満の場合、エスカレーション通知は送出しない
          if (retryAttemptCount < 3) {
            throw new Error('Month-report-generation-failed');
          }
        }

        // 3回目の呼び出し時にはエスカレーション通知送信可否を確認できるようにしているが、
        // テスト対象は「2回までは送出しない」ことなので、ここには到達しない
        return {
          reportId: 'monthly-report-001',
          generatedAt: new Date('2024-02-01T10:00:00Z'),
          topPriorityChallenges: [
            {
              challengeId: 'challenge-001',
              priorityScore: 85,
              occurrenceFrequency: 3,
              impactLevel: '高',
              resolutionDaysAverage: 2,
            },
          ],
          bottleneckTrend: {
            timeSeriesData: [
              {
                date: '2024-01-01',
                severity: 70,
              },
              {
                date: '2024-01-08',
                severity: 65,
              },
            ],
            improvementTrend: 'improving' as const,
            recurringIssuePattern: ['データベース接続エラー'],
          },
          teamPerformanceMetrics: {
            challengeResolutionVelocity: 2.5,
            reportSubmissionRate: 0.9,
            challengeRecurrenceRate: 0.15,
          },
          emailSentTo: [managerUserId],
          status: 'success' as const,
        };
      }),
    };

    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp,
      targetMonth,
      managerUserId,
      includeDetailedAnalysis: true,
    };

    let thrownError: Error | null = null;

    try {
      // 1回目の失敗を実行
      await runTx7Imp1Agent(agentInput, failingAiClient);
    } catch (error) {
      if (error instanceof Error) {
        thrownError = error;
      }
    }

    // 1回目の失敗後の状態検証
    expect(retryAttemptCount).toBe(1);
    expect(auditLogRecords).toHaveLength(1);
    expect(auditLogRecords[0].action).toBe('レポート生成処理失敗・再試行1回目');
    expect(auditLogRecords[0].retryCount).toBe(1);

    // 再試行回数が1回の時点では、notificationServiceAdapterのメソッドが呼ばれていないことを確認
    expect(notificationServiceAdapterStub.sendReminderNotification).not.toHaveBeenCalled();
    expect(notificationServiceAdapterStub.scheduleNotification).not.toHaveBeenCalled();
    expect(notificationSentLogs).toHaveLength(0);

    // 2回目の失敗を実行
    try {
      await runTx7Imp1Agent(agentInput, failingAiClient);
    } catch (error) {
      if (error instanceof Error) {
        thrownError = error;
      }
    }

    // 2回目の失敗後の状態検証
    expect(retryAttemptCount).toBe(2);
    expect(auditLogRecords).toHaveLength(2);
    expect(auditLogRecords[1].action).toBe('レポート生成処理失敗・再試行2回目');
    expect(auditLogRecords[1].retryCount).toBe(2);

    // 再試行回数が2回の時点でも、notificationServiceAdapterのメソッドが呼ばれていないことを確認
    expect(notificationServiceAdapterStub.sendReminderNotification).not.toHaveBeenCalled();
    expect(notificationServiceAdapterStub.scheduleNotification).not.toHaveBeenCalled();
    expect(notificationSentLogs).toHaveLength(0);

    // 監査ログに再試行1回目・2回目が記録されていることを確認
    const auditRecordsAction = auditLogRecords.map((record) => record.action);
    expect(auditRecordsAction).toContain('レポート生成処理失敗・再試行1回目');
    expect(auditRecordsAction).toContain('レポート生成処理失敗・再試行2回目');

    // 通知配信ログが空であることを確認（3回未満のため、部長へのエスカレーション通知が送出されない）
    expect(notificationSentLogs).toHaveLength(0);
  });
});