import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type { GenerateAndSendSummaryEmailInput, GenerateAndSendSummaryEmailOutput } from '../../src/logic/notification-delivery';

describe('日報集約メール送信機能', () => {
  // SCEN-213: [error] 日報集約メール送信機能 - チームメンバー情報が null のとき処理が進まない
  test('チームメンバー情報が null のとき TypeError をスロー', async () => {
    const mockNotificationServiceAdapter = {
      sendMemberReminderNotification: jest.fn().mockResolvedValue({ sent: true }),
      getTeamMemberInfo: jest.fn().mockResolvedValue(null),
      sendSummaryEmail: jest.fn().mockResolvedValue({ emailId: 'email-001', sent: true }),
    };

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      managerUserId: 'manager-001',
      submittedReports: [
        {
          reporterId: 'engineer-001',
          reporterName: 'Engineer A',
          submittedAt: '2024-01-15T08:30:00Z',
          challenges: ['データベース接続エラー', 'APIレスポンス遅延'],
        },
        {
          reporterId: 'engineer-002',
          reporterName: 'Engineer B',
          submittedAt: '2024-01-15T08:45:00Z',
          challenges: ['UI テスト失敗'],
        },
      ],
      unsubmittedMemberIds: ['engineer-003', 'engineer-004'],
      reportDeadlineTime: '09:00',
    };

    await expect(
      generateAndSendSummaryEmail(input, mockNotificationServiceAdapter)
    ).rejects.toThrow(/メンバー情報/);
  });
});