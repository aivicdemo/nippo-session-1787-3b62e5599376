import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボード提出状況リアルタイム表示', () => {
  // SCEN-094: [error] 朝会開始予定時刻が null のとき、タイムアウト判定が実行されずエラーになる
  test('朝会開始予定時刻が null の場合、タイムアウト判定処理が実行されず TypeError をスロー', async () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true,
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        sentAt: new Date('2024-01-15T09:00:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue(undefined),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        sent: 0,
        failed: 0,
        pending: 0,
      }),
    };

    // morningMeetingStartTime が undefined / null に設定されている状態でテスト
    const contextWithNullMorningTime = {
      notificationServiceAdapter: mockNotificationServiceAdapter,
      morningMeetingStartTime: null as any, // 意図的に null を渡す
    };

    expect(() => {
      aggregateReportSubmissionStatus(input, contextWithNullMorningTime);
    }).toThrow(/朝会開始時刻|morningMeetingStartTime|null|undefined/i);

    // scheduleNotification が呼び出されていないことを確認
    expect(mockNotificationServiceAdapter.scheduleNotification).not.toHaveBeenCalled();
  });
});