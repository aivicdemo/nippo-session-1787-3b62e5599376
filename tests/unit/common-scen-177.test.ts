import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  // SCEN-177
  test('should send unsubmitted reminder notifications to members who have not submitted reports by deadline', async () => {
    // Setup: Create mock unsubmitted members with their user info
    const unsubmittedMembers = [
      {
        userId: 'user_001',
        userName: 'Alice Johnson',
        email: 'alice@example.com',
        teamId: 'team_eng_001',
        teamName: 'Engineering Team A',
        submissionDeadline: new Date('2024-01-15T09:00:00Z'),
      },
      {
        userId: 'user_002',
        userName: 'Bob Smith',
        email: 'bob@example.com',
        teamId: 'team_eng_001',
        teamName: 'Engineering Team A',
        submissionDeadline: new Date('2024-01-15T09:00:00Z'),
      },
      {
        userId: 'user_003',
        userName: 'Carol Davis',
        email: 'carol@example.com',
        teamId: 'team_eng_002',
        teamName: 'Engineering Team B',
        submissionDeadline: new Date('2024-01-15T09:00:00Z'),
      },
    ];

    // Setup: Mock email delivery service
    const mockEmailService = {
      sendEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'msg_001' }),
    };

    // Setup: Mock notification template
    const notificationTemplate = {
      subject: 'Reminder: Daily Report Not Yet Submitted',
      bodyTemplate: 'Hi {name}, please submit your daily report by {deadline}.',
      priorityLevel: 'normal' as const,
    };

    // Execute: Call sendUnsubmittedReminder with unsubmitted members and mock service
    const result = await sendUnsubmittedReminder(
      unsubmittedMembers,
      mockEmailService,
      notificationTemplate
    );

    // Verify: All reminder notifications were sent
    expect(result.totalNotificationsSent).toBe(3);
    expect(result.successfulSends).toBe(3);
    expect(result.failedSends).toBe(0);

    // Verify: Email service was called for each unsubmitted member
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(3);

    // Verify: First call to email service contains correct recipient
    expect(mockEmailService.sendEmail).toHaveBeenNthCalledWith(1, {
      recipientEmail: 'alice@example.com',
      recipientName: 'Alice Johnson',
      subject: 'Reminder: Daily Report Not Yet Submitted',
      body: 'Hi Alice Johnson, please submit your daily report by 2024-01-15T09:00:00Z.',
      templateId: 'unsubmitted_reminder',
      priority: 'normal',
    });

    // Verify: Second call to email service
    expect(mockEmailService.sendEmail).toHaveBeenNthCalledWith(2, {
      recipientEmail: 'bob@example.com',
      recipientName: 'Bob Smith',
      subject: 'Reminder: Daily Report Not Yet Submitted',
      body: 'Hi Bob Smith, please submit your daily report by 2024-01-15T09:00:00Z.',
      templateId: 'unsubmitted_reminder',
      priority: 'normal',
    });

    // Verify: Third call to email service
    expect(mockEmailService.sendEmail).toHaveBeenNthCalledWith(3, {
      recipientEmail: 'carol@example.com',
      recipientName: 'Carol Davis',
      subject: 'Reminder: Daily Report Not Yet Submitted',
      body: 'Hi Carol Davis, please submit your daily report by 2024-01-15T09:00:00Z.',
      templateId: 'unsubmitted_reminder',
      priority: 'normal',
    });

    // Verify: Return object structure and status
    expect(result.status).toBe('completed');
    expect(result.executedAt).toBeInstanceOf(Date);
    expect(result.sendDetails).toHaveLength(3);

    // Verify: Each send detail contains tracking information
    result.sendDetails.forEach((detail, index) => {
      expect(detail.memberId).toBe(unsubmittedMembers[index].userId);
      expect(detail.memberEmail).toBe(unsubmittedMembers[index].email);
      expect(detail.sendStatus).toBe('success');
      expect(detail.messageId).toBe('msg_001');
      expect(detail.sentAt).toBeInstanceOf(Date);
    });

    // Verify: No escalation conditions were triggered
    expect(result.escalationTriggered).toBe(false);
    expect(result.escalationReason).toBeNull();
  });
});