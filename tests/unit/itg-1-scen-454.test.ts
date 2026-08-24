import { generateAndSendConfirmationEmail } from '../../src/logic/notification-delivery';
import type { ConfirmationEmailInput, ConfirmationEmailOutput } from '../../src/logic/notification-delivery';

describe('朝会報告集約・課題抽出・優先度判定・確認メール自動生成配信機能', () => {
  // SCEN-454
  test('報告データの送信完了タイムスタンプが空のとき処理を中止しエラーを返す', () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const aggregatedReportsWithNullTimestamp: ConfirmationEmailInput['aggregatedReports'] = [
      {
        reportId: 'report-001',
        reporterUserId: 'user-001',
        reporterName: 'エンジニアA',
        yesterdayAccomplishment: 'タスクA完了',
        todayPlan: 'タスクB開始',
        challenges: 'リソース不足',
        submissionDateTime: null as any,
      },
    ];

    const input: ConfirmationEmailInput = {
      reportDeadlineDateTime: new Date('2024-01-15T09:00:00Z'),
      aggregatedReports: aggregatedReportsWithNullTimestamp,
      managerUserId: 'manager-001',
      teamId: 'team-001',
      analysisDate: new Date('2024-01-15T00:00:00Z'),
    };

    expect(() =>
      generateAndSendConfirmationEmail(input, mockNotificationServiceAdapter, mockTextAnalysisServiceAdapter)
    ).toThrow(/タイムスタンプ/);

    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});