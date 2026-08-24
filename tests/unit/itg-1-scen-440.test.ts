import { generateAndSendConfirmationEmail } from '../../src/logic/notification-delivery';
import type { ConfirmationEmailInput, ConfirmationEmailOutput } from '../../src/logic/notification-delivery';

describe('朝会報告集約・課題抽出・優先度判定・確認メール自動生成配信機能', () => {
  // SCEN-440
  test('報告受付期限時刻がnullのとき処理を中止しエラーを返す', async () => {
    const mockNotificationServiceAdapter = {
      sendConfirmationEmail: jest.fn(),
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ConfirmationEmailInput = {
      reportDeadlineDateTime: null as any,
      aggregatedReports: [
        {
          reportId: 'report-001',
          reporterUserId: 'user-001',
          reporterName: 'Engineer A',
          yesterdayAccomplishment: 'Completed API implementation',
          todayPlan: 'Start testing phase',
          challenges: 'Database connection timeout issues',
          submissionDateTime: new Date('2024-01-15T08:30:00Z'),
        },
      ],
      managerUserId: 'manager-001',
      teamId: 'team-001',
      analysisDate: new Date('2024-01-15T09:00:00Z'),
    };

    const result = await generateAndSendConfirmationEmail(
      input,
      mockNotificationServiceAdapter,
      mockTextAnalysisServiceAdapter
    );

    expect(result).toBeDefined();
    expect(result.code).toBe('INVALID_DEADLINE_TIME');
    expect(result.message).toBe('報告受付期限時刻が設定されていません');
    expect(mockNotificationServiceAdapter.sendConfirmationEmail).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
  });
});