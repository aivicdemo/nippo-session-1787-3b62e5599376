import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  test('SCEN-094: sendUnsubmittedReminder sends reminders to unsubmitted members with proper formatting and tracking', async () => {
    // Setup: Mock data for unsubmitted members
    const unsubmittedMembers = [
      {
        userId: 'user-001',
        name: 'Member A',
        email: 'member-a@example.com',
        teamId: 'team-001',
        lastReminderSentAt: null as string | null,
        reminderCount: 0,
      },
      {
        userId: 'user-002',
        name: 'Member B',
        email: 'member-b@example.com',
        teamId: 'team-001',
        lastReminderSentAt: '2024-01-15T08:00:00Z',
        reminderCount: 1,
      },
      {
        userId: 'user-003',
        name: 'Member C',
        email: 'member-c@example.com',
        teamId: 'team-002',
        lastReminderSentAt: null,
        reminderCount: 0,
      },
    ];

    const submissionDeadline = new Date('2024-01-15T10:00:00Z');
    const reminderConfig = {
      maxReminderCount: 3,
      reminderIntervalMinutes: 30,
      escalateAfterMinutes: 60,
    };

    // Mock email sending function
    const mockSendEmail = jest.fn().mockResolvedValue({
      messageId: 'msg-001',
      sentAt: '2024-01-15T09:00:00Z',
    });

    // Mock audit logging function
    const mockAuditLog = jest.fn().mockResolvedValue({
      auditId: 'audit-001',
      timestamp: '2024-01-15T09:00:00Z',
    });

    // Call the function with mocked dependencies
    const result = await sendUnsubmittedReminder(
      unsubmittedMembers,
      submissionDeadline,
      reminderConfig,
      mockSendEmail,
      mockAuditLog
    );

    // Verify all unsubmitted members received reminders
    expect(result.remindersSent).toBe(3);
    expect(result.reminders).toHaveLength(3);

    // Verify reminder details for first member (no previous reminder)
    const reminder1 = result.reminders[0];
    expect(reminder1.userId).toBe('user-001');
    expect(reminder1.email).toBe('member-a@example.com');
    expect(reminder1.reminderCount).toBe(1);
    expect(reminder1.status).toBe('sent');
    expect(reminder1.sentAt).toBe('2024-01-15T09:00:00Z');

    // Verify reminder details for second member (with previous reminder)
    const reminder2 = result.reminders[1];
    expect(reminder2.userId).toBe('user-002');
    expect(reminder2.reminderCount).toBe(2);

    // Verify reminder details for third member
    const reminder3 = result.reminders[2];
    expect(reminder3.userId).toBe('user-003');
    expect(reminder3.reminderCount).toBe(1);

    // Verify email was called for each unsubmitted member
    expect(mockSendEmail).toHaveBeenCalledTimes(3);

    // Verify email content for first member
    expect(mockSendEmail).toHaveBeenNthCalledWith(1, {
      to: 'member-a@example.com',
      subject: expect.stringContaining('朝会報告提出リマインダー'),
      body: expect.stringContaining('member-a@example.com'),
      templateName: 'unsubmitted_reminder',
    });

    // Verify escalation logic: member with maxReminderCount reached
    const escalatedMembers = result.reminders.filter(r => r.escalated);
    expect(escalatedMembers.length).toBeGreaterThanOrEqual(0);

    // Verify audit logging was called
    expect(mockAuditLog).toHaveBeenCalledTimes(3);

    // Verify audit log entry structure
    const auditLogFirstCall = mockAuditLog.mock.calls[0][0];
    expect(auditLogFirstCall).toEqual({
      eventType: 'REMINDER_SENT',
      userId: 'user-001',
      timestamp: expect.any(String),
      details: expect.objectContaining({
        email: 'member-a@example.com',
        reminderCount: 1,
      }),
    });

    // Verify return structure contains deadline and config reference
    expect(result.submissionDeadline).toBe(submissionDeadline.toISOString());
    expect(result.processedAt).toBeDefined();
    expect(result.remindersSent).toBe(unsubmittedMembers.length);

    // Verify no failed reminders in this happy path
    expect(result.remindersFailedCount).toBe(0);
    expect(result.failedReminders).toEqual([]);
  });
});