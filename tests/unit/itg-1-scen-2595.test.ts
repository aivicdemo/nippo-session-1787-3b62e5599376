import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('tx-10-imp-1: 朝会報告アプリ初期導入・ユーザー教育 - 初回報告データ品質評価', () => {
  // SCEN-2595: [error] 初回報告データ品質評価機能 - 提出率が100を超える数のとき評価処理がエラーになる
  test('提出率が100を超える数値を入力したとき、品質評価処理がエラーをスローし通知送信は発生しない', async () => {
    // Arrange: 初回報告データ品質評価テストの入力を準備
    const deploymentInitiationTimestamp = new Date('2024-01-15T08:00:00Z');
    const participantList = [
      { userId: 'eng001', role: 'Engineer', email: 'eng001@example.com' },
      { userId: 'eng002', role: 'Engineer', email: 'eng002@example.com' },
      { userId: 'eng003', role: 'Engineer', email: 'eng003@example.com' },
      { userId: 'eng004', role: 'Engineer', email: 'eng004@example.com' },
      { userId: 'eng005', role: 'Engineer', email: 'eng005@example.com' },
      { userId: 'eng006', role: 'Engineer', email: 'eng006@example.com' },
      { userId: 'eng007', role: 'Engineer', email: 'eng007@example.com' },
      { userId: 'eng008', role: 'Engineer', email: 'eng008@example.com' },
      { userId: 'eng009', role: 'Engineer', email: 'eng009@example.com' },
      { userId: 'eng010', role: 'Engineer', email: 'eng010@example.com' },
      { userId: 'pm001', role: 'ProjectManager', email: 'pm001@example.com' },
      { userId: 'mgr001', role: 'Manager', email: 'mgr001@example.com' },
    ];
    const preparationDaysRequired = 5;
    const reportingDeadlineTime = '09:00';

    // 意図的に提出率を100を超える数値（150）で設定
    const invalidSubmissionRate = 150;

    // スタブ化されたAIクライアント
    const mockAiClient = {
      evaluateInitialReports: jest.fn().mockResolvedValue({
        submissionRate: invalidSubmissionRate,
        dataQualityScore: 75,
        formatUniformityScore: 80,
        feedbackItems: [],
      }),
    };

    // スタブ化されたNotificationServiceAdapter
    const mockNotificationService = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        deliveryTimestamp: new Date('2024-01-15T08:05:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue(true),
      getDeliveryStatus: jest.fn().mockResolvedValue('sent'),
    };

    const tx10Input = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    // Act & Assert: 品質評価処理がエラーをスロー
    await expect(
      runTx10Imp1Agent(tx10Input, mockAiClient as any, mockNotificationService as any)
    ).rejects.toThrow(/提出率が100を超過/);

    // Assert: NotificationServiceAdapterのsendReminderNotificationが呼び出されていないことを確認
    expect(mockNotificationService.sendReminderNotification).not.toHaveBeenCalled();
  });
});