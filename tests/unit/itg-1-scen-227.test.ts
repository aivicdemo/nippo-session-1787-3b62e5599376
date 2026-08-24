import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type { GenerateAndSendSummaryEmailInput } from '../../src/logic/notification-delivery';

describe('部長向けダッシュボード - 本日の報告提出状況リアルタイム表示', () => {
  // SCEN-227: [error] 日報集約メール送信機能 - 部長の権限が確認できないときエラーになる
  test('部長権限情報が取得不可の場合、権限確認失敗エラーが発生してメール送信されない', async () => {
    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      managerUserId: 'manager-001',
      submittedReports: [
        {
          reporterId: 'engineer-001',
          reporterName: 'Taro Yamada',
          submittedAt: '2024-01-15T08:45:00Z',
          challenges: ['データベース接続がタイムアウトする', 'APIレスポンス時間が遅い'],
        },
        {
          reporterId: 'engineer-002',
          reporterName: 'Hanako Tanaka',
          submittedAt: '2024-01-15T08:50:00Z',
          challenges: ['テストケース不足'],
        },
      ],
      unsubmittedMemberIds: ['engineer-003', 'engineer-004'],
      reportDeadlineTime: '09:00',
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        success: true,
        deliveryStatus: 'sent',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduled: true,
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'pending',
      }),
      verifyManagerAuthorization: jest.fn().mockResolvedValue(null),
    };

    await expect(
      generateAndSendSummaryEmail(input, mockNotificationServiceAdapter),
    ).rejects.toThrow(/部長権限/);
  });
});