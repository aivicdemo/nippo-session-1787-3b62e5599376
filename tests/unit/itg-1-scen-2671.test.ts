import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';

// SCEN-2671: [edge] 初期導入・ユーザー教育フロー（tx_10）における操作ミス検出機能 - 報告内容の小数点以下の端数が発生する計算結果から、操作ミスが正しく判定される
describe('tx-10-imp-1 orchestrator - operationMistakeDetection', () => {
  test('should detect fractional occurrence frequency as operation mistake and display error message', async () => {
    // Arrange
    const deploymentInitiationTimestamp = new Date('2024-01-15T09:00:00Z');
    const participantList = [
      {
        userId: 'eng001',
        role: 'Engineer',
        email: 'engineer001@example.com'
      },
      {
        userId: 'eng002',
        role: 'Engineer',
        email: 'engineer002@example.com'
      },
      {
        userId: 'eng003',
        role: 'Engineer',
        email: 'engineer003@example.com'
      },
      {
        userId: 'eng004',
        role: 'Engineer',
        email: 'engineer004@example.com'
      },
      {
        userId: 'eng005',
        role: 'Engineer',
        email: 'engineer005@example.com'
      },
      {
        userId: 'eng006',
        role: 'Engineer',
        email: 'engineer006@example.com'
      },
      {
        userId: 'eng007',
        role: 'Engineer',
        email: 'engineer007@example.com'
      },
      {
        userId: 'eng008',
        role: 'Engineer',
        email: 'engineer008@example.com'
      },
      {
        userId: 'eng009',
        role: 'Engineer',
        email: 'engineer009@example.com'
      },
      {
        userId: 'eng010',
        role: 'Engineer',
        email: 'engineer010@example.com'
      }
    ];
    const preparationDaysRequired = 5;
    const reportingDeadlineTime = '09:00';

    const testReportText =
      '昨日やったこと：DBバックアップ。今日やること：DB接続検証。抱えている課題：DB接続エラーが間欠的に発生';

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'DB接続エラー',
            occurrenceFrequency: 2.5
          },
          {
            keyword: 'DBバックアップ',
            occurrenceFrequency: 1.0
          }
        ]
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: 'DB接続エラー',
        impactScore: 75
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        keyword: 'DB接続エラー',
        severity: 'high'
      })
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent'
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'sched001'
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'pending'
      })
    };

    // Act
    const result = await runTx10Imp1Agent(
      {
        deploymentInitiationTimestamp,
        participantList,
        preparationDaysRequired,
        reportingDeadlineTime
      },
      mockTextAnalysisServiceAdapter,
      mockNotificationServiceAdapter,
      testReportText
    );

    // Assert
    expect(result).toBeDefined();
    expect(result.onboardingApprovalStatus).toBeDefined();
    expect(result.initialReportAnalysis).toBeDefined();

    const initialReportAnalysis = result.initialReportAnalysis;
    expect(initialReportAnalysis).toHaveProperty('feedbackItems');
    expect(Array.isArray(initialReportAnalysis.feedbackItems)).toBe(true);

    const operationMistakeFeedback = initialReportAnalysis.feedbackItems.find(
      (item: any) =>
        item.feedback &&
        item.feedback.includes('整数値ではなく小数点以下の端数が発生')
    );

    expect(operationMistakeFeedback).toBeDefined();
    expect(operationMistakeFeedback.feedback).toMatch(/整数値ではなく小数点以下の端数が発生/);
    expect(operationMistakeFeedback.feedback).toMatch(/キーワード抽出を再実行/);
    expect(operationMistakeFeedback.feedback).toMatch(/手動.*キーワード.*入力/);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});