import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';

describe('日報集約メール送信機能', () => {
  // SCEN-218: [error] 日報集約メール送信機能 - 集約対象の日報データが null のとき処理が進まない
  test('集約対象の日報データが null のとき、ValidationError または TypeError が発生し、メール送信および課題抽出が実行されないこと', () => {
    const input: any = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      managerUserId: 'user-manager-001',
      submittedReports: null,
      unsubmittedMemberIds: ['user-eng-002', 'user-eng-003'],
      reportDeadlineTime: '09:00',
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    expect(() =>
      generateAndSendSummaryEmail(
        input,
        mockNotificationAdapter,
        mockTextAnalysisAdapter
      )
    ).toThrow(/入力データ|日報データ|null|undefined/i);

    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});