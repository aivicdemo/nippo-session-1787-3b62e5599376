import { generateAndSendConfirmationEmail } from '../../src/logic/notification-delivery';
import type { ConfirmationEmailInput, ConfirmationEmailOutput } from '../../src/logic/notification-delivery';

describe('generateAndSendConfirmationEmail', () => {
  // SCEN-438: [normal] 日報集約・課題抽出・優先度判定・確認メール生成配信機能 - NotificationServiceAdapterが確認メール配信を正常応答した場合、配信ステータスが返される
  test('should return delivery status when confirmation email is sent successfully', async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        deliveryStatus: 'success',
        deliveryId: 'email-delivery-001',
        sentAt: '2024-01-15T09:30:00Z',
        recipientId: 'manager-user-001',
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const reportDeadlineDateTime = new Date('2024-01-15T09:00:00Z');
    const analysisDate = new Date('2024-01-15');

    const aggregatedReports = [
      {
        reportId: 'report-001',
        reporterUserId: 'user-001',
        reporterName: 'Engineer A',
        yesterdayAccomplishment: 'Completed feature X development',
        todayPlan: 'Testing feature X',
        challenges: 'Performance issue with database query',
        submissionDateTime: new Date('2024-01-15T08:45:00Z'),
      },
      {
        reportId: 'report-002',
        reporterUserId: 'user-002',
        reporterName: 'Engineer B',
        yesterdayAccomplishment: 'Code review for feature Y',
        todayPlan: 'Fix review comments',
        challenges: 'Unclear requirements for feature Z',
        submissionDateTime: new Date('2024-01-15T08:50:00Z'),
      },
    ];

    const input: ConfirmationEmailInput = {
      reportDeadlineDateTime,
      aggregatedReports,
      managerUserId: 'manager-user-001',
      teamId: 'team-001',
      analysisDate,
    };

    const output: ConfirmationEmailOutput = await generateAndSendConfirmationEmail(
      input,
      mockNotificationServiceAdapter
    );

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();
    expect(output.emailId).toBeDefined();
    expect(output.emailId).toBeTruthy();
    expect(output.sentDateTime).toEqual(reportDeadlineDateTime);
    expect(output.extractedIssuesCount).toBeGreaterThan(0);
    expect(output.prioritizedIssuesList).toBeDefined();
    expect(Array.isArray(output.prioritizedIssuesList)).toBe(true);
    expect(output.submissionStatus).toBeDefined();
    expect(output.submissionStatus.submittedCount).toBe(2);
    expect(output.submissionStatus.unsubmittedMembers).toBeDefined();
  });
});