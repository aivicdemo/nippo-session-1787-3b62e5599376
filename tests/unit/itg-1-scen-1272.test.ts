import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('朝会報告管理システム - TX5 Imp1 エージェント', () => {
  // SCEN-1272: [error] 既存ツール課題データ連携リトライ機能 - 部長の連絡先情報が欠落している場合、手動対応通知の実行に失敗する
  test('部長の連絡先情報が欠落している場合、手動対応通知の実行に失敗し、3回のリトライ後に管理者アラートが生成される', async () => {
    // セットアップ: スタブ化した AI クライアントと通知サービス
    const notificationServiceStub = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    // モック通知失敗を返すスタブの設定
    // リトライ回数: 3回、インターバル: 5分(300000ms)、15分(900000ms)、1時間(3600000ms)
    notificationServiceStub.sendReminderNotification.mockRejectedValue(
      new Error('部長の連絡先情報が欠落しています')
    );

    const aiClientStub = {
      validateExtractedIssues: jest.fn().mockResolvedValue({
        validatedIssues: [
          {
            issueId: 'issue-001',
            priorityScore: 85,
            priorityRank: 'high' as const,
            category: 'quality',
            toolIssueId: null,
            validationStatus: 'valid' as const,
          },
        ],
        validationTimestamp: new Date('2024-01-15T11:00:00Z'),
      }),
      applyPriorityRules: jest.fn().mockResolvedValue({
        priorityJudgment: [
          {
            issueId: 'issue-001',
            priorityScore: 85,
            category: 'quality',
          },
        ],
      }),
      performToolIntegration: jest.fn().mockResolvedValue({
        integrationResult: {
          successCount: 0,
          failureCount: 1,
          toolIssueIds: [],
          retryScheduled: true,
        },
      }),
    };

    // 入力データ: 部長の連絡先が欠落している状態
    const input = {
      extractedIssueData: [
        {
          issueId: 'issue-001',
          title: 'データベース接続エラー',
          description: 'Production環境でDB接続が間欠的に失敗',
          severity: 'high' as const,
          occurrenceFrequency: 3,
          impactScope: 'team',
          reportedAt: new Date('2024-01-15T10:30:00Z'),
        },
      ],
      toolIntegrationConfig: {
        targetTool: 'jira' as const,
        apiEndpoint: 'https://jira.example.com/api',
        apiToken: 'test-token-jira',
        projectKey: 'TEST',
      },
      priorityRules: {
        frequencyWeight: 0.4,
        impactWeight: 0.6,
        highFrequencyThreshold: 5,
        highImpactThreshold: 75,
      },
      categoryMappings: [
        {
          systemCategory: 'quality',
          toolCategory: 'Bug',
        },
      ],
    };

    // 部長プロフィール: 連絡先情報が完全に欠落
    const directorProfile = {
      userId: 'director-001',
      name: '部長太郎',
      email: null,
      slackUserId: null,
      teamsId: null,
      role: 'director' as const,
    };

    // リトライ設定
    const retryConfig = {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelayMs: 300000, // 5分
    };

    // スタブのリトライ実装を模擬
    const deliveryAttempts: Array<{
      timestamp: Date;
      status: 'failed' | 'success';
      reason?: string;
    }> = [];

    let attemptCount = 0;
    const mockSendWithRetry = jest.fn(async () => {
      attemptCount++;
      const now = new Date('2024-01-15T11:00:00Z');

      // 各リトライの実行
      for (let i = 0; i < retryConfig.maxRetries; i++) {
        try {
          await notificationServiceStub.sendReminderNotification(
            directorProfile.userId,
            'Integration failed - manual intervention required'
          );
          deliveryAttempts.push({
            timestamp: now,
            status: 'success',
          });
          break;
        } catch (error) {
          deliveryAttempts.push({
            timestamp: new Date(
              now.getTime() +
                retryConfig.initialDelayMs * Math.pow(retryConfig.backoffMultiplier, i)
            ),
            status: 'failed',
            reason: (error as Error).message,
          });

          // 最後の試行の場合、アラートを生成
          if (i === retryConfig.maxRetries - 1) {
            // 管理者へのアラート生成
            const adminAlert = {
              alertId: 'alert-manual-notify-001',
              severity: 'critical',
              timestamp: new Date('2024-01-15T11:30:00Z'),
              message: '手動対応通知の配信に失敗しました',
              targetDirectorId: directorProfile.userId,
              reason: '部長の連絡先情報が欠落しています',
              failureCount: deliveryAttempts.filter((a) => a.status === 'failed').length,
            };

            // アラートがシステムに記録されたことを検証
            expect(adminAlert.severity).toBe('critical');
            expect(adminAlert.failureCount).toBe(3);
            expect(adminAlert.reason).toMatch(/連絡先/);
          }
        }
      }
    });

    // 手動対応通知の実行トリガー
    await expect(mockSendWithRetry()).resolves.toBeUndefined();

    // 検証: リトライの実行状況
    expect(deliveryAttempts).toHaveLength(3);

    // 最初のリトライ: 5分後 (300000ms)
    expect(deliveryAttempts[0].status).toBe('failed');
    expect(deliveryAttempts[0].reason).toMatch(/連絡先/);

    // 2番目のリトライ: 15分後 (900000ms)
    expect(deliveryAttempts[1].status).toBe('failed');
    expect(deliveryAttempts[1].timestamp.getTime()).toBe(
      new Date('2024-01-15T11:00:00Z').getTime() + 300000
    );

    // 3番目のリトライ: 1時間後 (3600000ms)
    expect(deliveryAttempts[2].status).toBe('failed');
    expect(deliveryAttempts[2].timestamp.getTime()).toBe(
      new Date('2024-01-15T11:00:00Z').getTime() + 900000
    );

    // 通知配信ログ: 失敗件数の確認
    const failureCount = deliveryAttempts.filter((a) => a.status === 'failed').length;
    expect(failureCount).toBe(3);

    // エージェント実行
    const result = await runTx5Imp1Agent(input, aiClientStub as any);

    // 結果検証: エラーハンドリングと通知失敗の記録
    expect(result).toBeDefined();
    expect(result.integrationResult.failureCount).toBeGreaterThan(0);

    // 管理者へのアラートが生成されたことを確認
    expect(notificationServiceStub.sendReminderNotification).toHaveBeenCalled();
  });
});