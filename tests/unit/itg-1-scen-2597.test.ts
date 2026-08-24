import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('TX10 初期導入・ユーザー教育 - 初回報告データ品質評価', () => {
  // SCEN-2597: [error] 初回報告データ品質評価機能 - データ品質スコアが100を超える数のとき評価処理がエラーになる
  test('should catch error when data quality score exceeds maximum threshold of 100', async () => {
    const deploymentInitiationTimestamp = new Date('2024-01-15T08:00:00Z');
    const participantList = [
      {
        userId: 'pm001',
        role: 'ProjectManager',
        email: 'pm001@example.com',
      },
      {
        userId: 'mgr001',
        role: 'Manager',
        email: 'mgr001@example.com',
      },
      {
        userId: 'eng001',
        role: 'Engineer',
        email: 'eng001@example.com',
      },
      {
        userId: 'eng002',
        role: 'Engineer',
        email: 'eng002@example.com',
      },
      {
        userId: 'eng003',
        role: 'Engineer',
        email: 'eng003@example.com',
      },
      {
        userId: 'eng004',
        role: 'Engineer',
        email: 'eng004@example.com',
      },
      {
        userId: 'eng005',
        role: 'Engineer',
        email: 'eng005@example.com',
      },
      {
        userId: 'eng006',
        role: 'Engineer',
        email: 'eng006@example.com',
      },
      {
        userId: 'eng007',
        role: 'Engineer',
        email: 'eng007@example.com',
      },
      {
        userId: 'eng008',
        role: 'Engineer',
        email: 'eng008@example.com',
      },
      {
        userId: 'eng009',
        role: 'Engineer',
        email: 'eng009@example.com',
      },
      {
        userId: 'eng010',
        role: 'Engineer',
        email: 'eng010@example.com',
      },
    ];
    const preparationDaysRequired = 5;
    const reportingDeadlineTime = '09:00';

    const mockAiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['issue1', 'issue2'],
        frequencies: [3, 2],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(101),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const mockNotificationService = {
      sendReminderNotification: jest
        .fn()
        .mockResolvedValue({ status: 'success' }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest
        .fn()
        .mockResolvedValue({ delivered: true, failedCount: 0 }),
    };

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const input = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    try {
      await runTx10Imp1Agent(input, mockAiClient, mockNotificationService);
      fail('Should have thrown an error for data quality score exceeding 100');
    } catch (error) {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/データ品質スコアが有効範囲を超えています/)
      );
      expect(error).toBeDefined();
    }

    consoleErrorSpy.mockRestore();
  });
});