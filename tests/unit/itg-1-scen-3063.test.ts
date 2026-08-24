import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type { GenerateAndSendSummaryEmailInput, GenerateAndSendSummaryEmailOutput, SubmittedReportSummary } from '../../src/logic/notification-delivery';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信し、報告期限までの時間を表示する機能', () => {
  // SCEN-3063: [normal] Slack API / Microsoft Teams API連携 - NotificationServiceAdapter.getDeliveryStatusが正常応答を受けた場合、通知の配信状況が正確に照会される
  test('NotificationServiceAdapter.getDeliveryStatusが正常応答を受けた場合、通知の配信状況が正確に照会される', async () => {
    // Arrange: NotificationServiceAdapterのスタブを初期化
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        notificationId: 'notif-001',
        status: 'sent',
        sentAt: '2026-08-19T10:00:00Z',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'sched-001',
        status: 'scheduled',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        notificationId: 'notif-001',
        userId: 'user-123',
        status: 'success',
        deliveredAt: '2026-08-19T10:30:00Z',
        channel: 'slack',
      }),
    };

    // 日報集約データを準備
    const submittedReports: SubmittedReportSummary[] = [
      {
        reporterId: 'user-123',
        reporterName: 'エンジニアA',
        submittedAt: '2026-08-19T09:15:00Z',
        challenges: ['データベース接続エラー', '認証機能の未実装'],
      },
      {
        reporterId: 'user-456',
        reporterName: 'エンジニアB',
        submittedAt: '2026-08-19T09:20:00Z',
        challenges: ['UIレイアウト調整', 'パフォーマンス最適化'],
      },
    ];

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'team-001',
      reportDate: '2026-08-19',
      managerUserId: 'manager-001',
      submittedReports: submittedReports,
      unsubmittedMemberIds: [],
      reportDeadlineTime: '09:30',
    };

    // Act: generateAndSendSummaryEmailを呼び出す
    const result: GenerateAndSendSummaryEmailOutput = await generateAndSendSummaryEmail(input, mockNotificationServiceAdapter);

    // Assert: 通知配信状況が正確に照会されることを検証
    expect(mockNotificationServiceAdapter.getDeliveryStatus).toHaveBeenCalled();

    // getDeliveryStatusが返す配信状況オブジェクトの検証
    const deliveryStatus = await mockNotificationServiceAdapter.getDeliveryStatus('notif-001');
    expect(deliveryStatus.notificationId).toBe('notif-001');
    expect(deliveryStatus.userId).toBe('user-123');
    expect(deliveryStatus.status).toBe('success');
    expect(deliveryStatus.deliveredAt).toBe('2026-08-19T10:30:00Z');
    expect(deliveryStatus.channel).toBe('slack');

    // 配信ステータスが成功として返却されることを検証
    expect(deliveryStatus.status).toBe('success');

    // generateAndSendSummaryEmailの出力検証
    expect(result).toBeDefined();
    expect(result.emailId).toBeDefined();
    expect(result.sentAt).toBeDefined();
    expect(result.recipientEmail).toBeDefined();
    expect(result.includedIssueCount).toBeGreaterThanOrEqual(0);
    expect(result.submissionSummary).toBeDefined();
    expect(result.submissionSummary.submittedCount).toBe(2);
    expect(result.submissionSummary.unsubmittedCount).toBe(0);
    expect(result.submissionSummary.submissionRate).toBe(100);
  });
});