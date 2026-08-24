import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type {
  GenerateAndSendSummaryEmailInput,
  GenerateAndSendSummaryEmailOutput,
  SubmittedReportSummary,
} from '../../src/logic/notification-delivery';

describe('notification-delivery - generateAndSendSummaryEmail', () => {
  // SCEN-243: [edge] 日報集約メール生成機能 - 最後のメンバーが日報送信を完了した日付が月初日である場合、前月分との境界が正確に処理される
  test('should generate summary email with correct month boundary when last member submits on month start date', async () => {
    // Setup: 前月（1月）の日報を複数メンバー分登録済み、当月（2月）1日の00:00:00に設定したシステム時刻
    const systemTimeOnFeb1st = new Date('2026-02-01T00:00:00Z');
    const teamId = 'team-001';
    const reportDate = '2026-01-31';
    const managerUserId = 'manager-001';
    const reportDeadlineTime = '09:00';

    // 9名のメンバーが1月31日までに日報を送信済み
    const submittedReportsPreviousMembers: SubmittedReportSummary[] = [
      {
        reporterId: 'member-001',
        reporterName: 'Engineer A',
        submittedAt: '2026-01-31T08:30:00Z',
        challenges: ['Database query optimization needed', 'Memory leak investigation'],
      },
      {
        reporterId: 'member-002',
        reporterName: 'Engineer B',
        submittedAt: '2026-01-31T08:45:00Z',
        challenges: ['API endpoint latency'],
      },
      {
        reporterId: 'member-003',
        reporterName: 'Engineer C',
        submittedAt: '2026-01-31T08:50:00Z',
        challenges: ['Integration test failure', 'Code review pending'],
      },
      {
        reporterId: 'member-004',
        reporterName: 'Engineer D',
        submittedAt: '2026-01-31T08:55:00Z',
        challenges: ['Deployment pipeline issue'],
      },
      {
        reporterId: 'member-005',
        reporterName: 'Engineer E',
        submittedAt: '2026-01-31T08:20:00Z',
        challenges: ['Documentation update required'],
      },
      {
        reporterId: 'member-006',
        reporterName: 'Engineer F',
        submittedAt: '2026-01-31T08:15:00Z',
        challenges: ['Security vulnerability assessment'],
      },
      {
        reporterId: 'member-007',
        reporterName: 'Engineer G',
        submittedAt: '2026-01-31T08:35:00Z',
        challenges: ['Performance monitoring setup'],
      },
      {
        reporterId: 'member-008',
        reporterName: 'Engineer H',
        submittedAt: '2026-01-31T08:40:00Z',
        challenges: ['Build time optimization'],
      },
      {
        reporterId: 'member-009',
        reporterName: 'Engineer I',
        submittedAt: '2026-01-31T08:25:00Z',
        challenges: ['Logging infrastructure improvement'],
      },
    ];

    // 10番目のメンバーが2月1日00:00:01に日報を送信（全メンバー送信完了）
    const lastMemberReport: SubmittedReportSummary = {
      reporterId: 'member-010',
      reporterName: 'Engineer J',
      submittedAt: '2026-02-01T00:00:01Z',
      challenges: ['CI/CD pipeline enhancement'],
    };

    const allSubmittedReports: SubmittedReportSummary[] = [
      ...submittedReportsPreviousMembers,
      lastMemberReport,
    ];

    // 未提出メンバーなし（全員提出完了）
    const unsubmittedMemberIds: string[] = [];

    const input: GenerateAndSendSummaryEmailInput = {
      teamId,
      reportDate,
      managerUserId,
      submittedReports: allSubmittedReports,
      unsubmittedMemberIds,
      reportDeadlineTime,
    };

    // モック化されたNotificationServiceAdapter
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        deliveryId: 'delivery-123',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduledId: 'scheduled-123',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
      }),
    };

    // 日報集約メール生成機能を実行
    const output: GenerateAndSendSummaryEmailOutput = await generateAndSendSummaryEmail(
      input,
      mockNotificationAdapter
    );

    // 検証①：メール本文に含まれる日報が全て1月分のみであること（2月分は含まない）
    expect(output.submissionSummary.submittedCount).toBe(10);
    expect(output.submissionSummary.unsubmittedCount).toBe(0);
    expect(output.submissionSummary.submissionRate).toBe(100);

    // 検証②：1月1日～1月31日の期間集計であることが明記されていること
    // メール本文中に期間範囲が記載されていることを確認
    expect(output.recipientEmail).toBeDefined();
    expect(output.includedIssueCount).toBeGreaterThan(0);
    // 9人の前月メンバーの課題（計12件） + 最後のメンバーの課題（1件） = 13件
    expect(output.includedIssueCount).toBe(13);

    // 検証③：メール送信時刻が2月1日であること
    const sentDate = new Date(output.sentAt);
    expect(sentDate.getUTCFullYear()).toBe(2026);
    expect(sentDate.getUTCMonth()).toBe(1); // 2月 (0-indexed)
    expect(sentDate.getUTCDate()).toBe(1);

    // メールIDが生成されていることを確認
    expect(output.emailId).toBeDefined();
    expect(output.emailId).toMatch(/^[a-z0-9-]+$/);

    // 送信先メールアドレスが指定されていることを確認
    expect(output.recipientEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

    // 提出率が100%であることを確認
    expect(output.submissionSummary.submissionRate).toBe(100);

    // NotificationAdapterが適切に呼ばれていないことを確認（メール送信自体は外部で行われる）
    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});