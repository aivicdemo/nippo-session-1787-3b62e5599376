import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type { GenerateAndSendSummaryEmailInput, GenerateAndSendSummaryEmailOutput, SubmittedReportSummary } from '../../src/logic/notification-delivery';

describe('notification-delivery: generateAndSendSummaryEmail', () => {
  // SCEN-233: [edge] 日報集約メール生成機能 - チームメンバー10名全員が報告完了時、未提出者リストがちょうど0件で生成される
  test('should generate summary email with zero unsubmitted members when all 10 team members have submitted reports', async () => {
    // Arrange: スタブ化した NotificationServiceAdapter を準備
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        deliveryStatus: 'success',
        sentAt: new Date('2024-01-15T09:00:00Z').toISOString(),
      }),
      scheduleNotification: jest.fn().mockResolvedValue(true),
      getDeliveryStatus: jest.fn().mockResolvedValue('sent'),
    };

    // チームメンバー10名全員の提出データを構築
    const submittedReports: SubmittedReportSummary[] = [
      {
        reporterId: 'member-001',
        reporterName: 'Engineer A',
        submittedAt: new Date('2024-01-15T08:30:00Z').toISOString(),
        challenges: ['Database performance degradation', 'API response timeout'],
      },
      {
        reporterId: 'member-002',
        reporterName: 'Engineer B',
        submittedAt: new Date('2024-01-15T08:32:00Z').toISOString(),
        challenges: ['UI rendering issue on mobile'],
      },
      {
        reporterId: 'member-003',
        reporterName: 'Engineer C',
        submittedAt: new Date('2024-01-15T08:35:00Z').toISOString(),
        challenges: ['Memory leak in background service'],
      },
      {
        reporterId: 'member-004',
        reporterName: 'Engineer D',
        submittedAt: new Date('2024-01-15T08:40:00Z').toISOString(),
        challenges: ['Build pipeline failure'],
      },
      {
        reporterId: 'member-005',
        reporterName: 'Engineer E',
        submittedAt: new Date('2024-01-15T08:45:00Z').toISOString(),
        challenges: [],
      },
      {
        reporterId: 'member-006',
        reporterName: 'Engineer F',
        submittedAt: new Date('2024-01-15T08:50:00Z').toISOString(),
        challenges: ['Test coverage low for new feature'],
      },
      {
        reporterId: 'member-007',
        reporterName: 'Engineer G',
        submittedAt: new Date('2024-01-15T08:55:00Z').toISOString(),
        challenges: ['Security vulnerability in auth module'],
      },
      {
        reporterId: 'member-008',
        reporterName: 'Engineer H',
        submittedAt: new Date('2024-01-15T09:00:00Z').toISOString(),
        challenges: ['Deployment delay due to infrastructure issue'],
      },
      {
        reporterId: 'member-009',
        reporterName: 'Engineer I',
        submittedAt: new Date('2024-01-15T09:02:00Z').toISOString(),
        challenges: ['Code review backlog'],
      },
      {
        reporterId: 'member-010',
        reporterName: 'Engineer J',
        submittedAt: new Date('2024-01-15T09:05:00Z').toISOString(),
        challenges: ['Onboarding documentation incomplete'],
      },
    ];

    // 入力パラメータを構築（未提出メンバーなし）
    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      managerUserId: 'manager-001',
      submittedReports,
      unsubmittedMemberIds: [],
      reportDeadlineTime: '09:00',
    };

    // Act: generateAndSendSummaryEmail を実行
    const output: GenerateAndSendSummaryEmailOutput = await generateAndSendSummaryEmail(
      input,
      mockNotificationServiceAdapter,
    );

    // Assert: メール ID が生成されていることを確認
    expect(output.emailId).toBeTruthy();
    expect(typeof output.emailId).toBe('string');

    // 送信完了日時が ISO 8601 形式で記録されていることを確認
    expect(output.sentAt).toBeTruthy();
    expect(output.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 送信先メールアドレスが設定されていることを確認
    expect(output.recipientEmail).toBeTruthy();
    expect(typeof output.recipientEmail).toBe('string');

    // メール本文に含まれた優先度付き課題の件数を検証
    // submittedReports の challenges 配列から課題数をカウント
    const totalChallenges = submittedReports.reduce((sum, report) => sum + report.challenges.length, 0);
    expect(output.includedIssueCount).toBe(totalChallenges);

    // 提出状況サマリーを検証
    expect(output.submissionSummary).toBeTruthy();
    expect(output.submissionSummary.submittedCount).toBe(10);
    expect(output.submissionSummary.unsubmittedCount).toBe(0);
    expect(output.submissionSummary.submissionRate).toBe(1.0);

    // NotificationServiceAdapter が呼び出されていないことを確認（全員提出のため催促不要）
    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});