import { describe, test, expect, beforeEach } from '@jest/globals';
import { generateAndSendConfirmationEmail, type ConfirmationEmailInput, type ConfirmationEmailOutput } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  // SCEN-450: [error] 朝会報告集約・課題抽出・優先度判定・確認メール自動生成配信機能 - 優先度スコアが数値でないとき処理を中止しエラーを返す
  test('should return error when impact score is not a number', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'database_delay', frequency: 3 },
        { keyword: 'api_timeout', frequency: 2 }
      ]),
      assessImpactScore: jest.fn().mockResolvedValue('high'),
      classifyIssueSeverity: jest.fn().mockResolvedValue('HIGH')
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ deliveryStatus: 'sent' }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'delivered' })
    };

    const input: ConfirmationEmailInput = {
      reportDeadlineDateTime: new Date('2024-01-15T09:00:00Z'),
      aggregatedReports: [
        {
          reportId: 'report-001',
          reporterUserId: 'user-001',
          reporterName: 'Alice Engineer',
          yesterdayAccomplishment: 'Completed API integration testing',
          todayPlan: 'Deploy to staging environment',
          challenges: 'Database connection pool exhaustion under load',
          submissionDateTime: new Date('2024-01-15T08:45:00Z')
        },
        {
          reportId: 'report-002',
          reporterUserId: 'user-002',
          reporterName: 'Bob Developer',
          yesterdayAccomplishment: 'Fixed bug in authentication module',
          todayPlan: 'Code review and documentation',
          challenges: 'API timeout during peak hours',
          submissionDateTime: new Date('2024-01-15T08:50:00Z')
        }
      ],
      managerUserId: 'manager-001',
      teamId: 'team-001',
      analysisDate: new Date('2024-01-15')
    };

    const result = await generateAndSendConfirmationEmail(
      input,
      mockTextAnalysisAdapter,
      mockNotificationAdapter
    );

    expect(result).toEqual({
      code: 'INVALID_PRIORITY_SCORE_TYPE',
      message: '優先度スコアは数値である必要があります',
      statusCode: 400
    });

    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});