import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type { GenerateAndSendSummaryEmailInput, GenerateAndSendSummaryEmailOutput, SubmittedReportSummary } from '../../src/logic/notification-delivery';

describe('generateAndSendSummaryEmail - Slack/Teams API integration', () => {
  // SCEN-3061: [normal] Slack API / Microsoft Teams API連携 - NotificationServiceAdapter.sendReminderNotificationが正常応答を受けた場合、指定ユーザーへのリマインド通知が配信されたと記録される
  test('should record successful reminder notification delivery status in log when NotificationServiceAdapter returns success response', async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'delivered',
        notificationId: 'NOTIF_001',
        deliveredAt: '2024-01-15T09:30:00Z',
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const submittedReports: SubmittedReportSummary[] = [
      {
        reporterId: 'USER002',
        reporterName: 'Engineer A',
        submittedAt: '2024-01-15T09:00:00Z',
        challenges: ['Database performance issue', 'API timeout'],
      },
      {
        reporterId: 'USER003',
        reporterName: 'Engineer B',
        submittedAt: '2024-01-15T09:05:00Z',
        challenges: ['Deployment script failure'],
      },
    ];

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'TEAM_001',
      reportDate: '2024-01-15',
      managerUserId: 'USER001',
      submittedReports: submittedReports,
      unsubmittedMemberIds: ['USER004', 'USER005'],
      reportDeadlineTime: '09:30',
    };

    const result: GenerateAndSendSummaryEmailOutput = await generateAndSendSummaryEmail(
      input,
      mockNotificationServiceAdapter
    );

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'USER001',
        notificationType: 'summary_email',
      })
    );

    expect(result).toEqual(
      expect.objectContaining({
        emailId: expect.any(String),
        sentAt: expect.any(String),
        recipientEmail: expect.any(String),
        includedIssueCount: 3,
        submissionSummary: expect.objectContaining({
          submittedCount: 2,
          unsubmittedCount: 2,
          submissionRate: 50,
        }),
      })
    );

    const sentAtTime = new Date(result.sentAt).getTime();
    const currentTime = new Date().getTime();
    expect(Math.abs(sentAtTime - currentTime)).toBeLessThan(5000);

    expect(result.submissionSummary.submittedCount).toBe(2);
    expect(result.submissionSummary.unsubmittedCount).toBe(2);
    expect(result.submissionSummary.submissionRate).toBe(50);
    expect(result.includedIssueCount).toBe(3);
  });
});