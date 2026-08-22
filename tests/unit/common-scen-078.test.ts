import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  test('SCEN-078: sendUnsubmittedReminder sends reminders to all unsubmitted members with correct structure', async () => {
    // Setup: prepare test data with unsubmitted members
    const unsubmittedMembers = [
      {
        memberId: 'M001',
        memberName: 'Alice Johnson',
        teamId: 'T001',
        email: 'alice@company.com',
        lastSubmittedAt: new Date('2024-01-14T09:00:00Z'),
      },
      {
        memberId: 'M002',
        memberName: 'Bob Smith',
        teamId: 'T001',
        email: 'bob@company.com',
        lastSubmittedAt: new Date('2024-01-14T08:30:00Z'),
      },
      {
        memberId: 'M003',
        memberName: 'Carol White',
        teamId: 'T002',
        email: 'carol@company.com',
        lastSubmittedAt: new Date('2024-01-13T10:00:00Z'),
      },
    ];

    const submissionDeadline = new Date('2024-01-15T09:30:00Z');
    const currentTimestamp = new Date('2024-01-15T09:15:00Z');

    // Mock global fetch for sending notifications
    global.fetch = jest.fn((url: string, options: any) => {
      if (url.includes('/notifications/send')) {
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, sentCount: 1 }), {
            status: 200,
          })
        );
      }
      return Promise.reject(new Error('Unexpected fetch call'));
    });

    // Execute: call sendUnsubmittedReminder with test data
    const result = await sendUnsubmittedReminder({
      unsubmittedMembers,
      submissionDeadline,
      currentTimestamp,
    });

    // Verify: check result structure matches contract
    expect(result).toHaveProperty('remindersSent');
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('successCount');
    expect(result).toHaveProperty('failureCount');
    expect(result).toHaveProperty('executionTimestamp');

    // Verify: check count values
    expect(result.totalCount).toBe(3);
    expect(result.successCount).toBe(3);
    expect(result.failureCount).toBe(0);

    // Verify: check remindersSent array contains all members
    expect(result.remindersSent).toHaveLength(3);

    // Verify: each sent reminder has required fields
    result.remindersSent.forEach((reminder: any) => {
      expect(reminder).toHaveProperty('memberId');
      expect(reminder).toHaveProperty('memberName');
      expect(reminder).toHaveProperty('email');
      expect(reminder).toHaveProperty('sentAt');
      expect(reminder).toHaveProperty('reminderType');
      expect(['initial', 'escalated']).toContain(reminder.reminderType);
    });

    // Verify: execution timestamp is within acceptable range (±5 seconds)
    const timeDiff = Math.abs(
      result.executionTimestamp.getTime() - currentTimestamp.getTime()
    );
    expect(timeDiff).toBeLessThanOrEqual(5000);

    // Verify: fetch was called for each member
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/notifications/send'),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });
});