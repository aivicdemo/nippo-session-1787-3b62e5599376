import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム集計機能', () => {
  // SCEN-414
  test('チームメンバー一覧が null のとき処理が中断されエラーを返す', async () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true,
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        success: true,
        sentAt: new Date('2024-01-15T09:30:00Z'),
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    let result: ReportSubmissionStatusSummary | { code: string; message: string };
    let thrownError: Error | null = null;

    try {
      result = await aggregateReportSubmissionStatus(input, null as any);
    } catch (error) {
      if (error instanceof Error) {
        thrownError = error;
      }
    }

    expect(thrownError).toBeDefined();
    expect(thrownError?.message).toMatch(/チームメンバー/);

    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});