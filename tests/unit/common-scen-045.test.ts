import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  test('SCEN-045: sendUnsubmittedReminder identifies unsubmitted members and returns structured data with timestamps', async () => {
    const unsubmittedMembers = ['memberA', 'memberC'];
    const checkTimestamp = '2024-01-15T09:00:00Z';
    const submissionDeadline = '2024-01-15T08:30:00Z';

    const result = await sendUnsubmittedReminder({
      allMembers: [
        { id: 'memberA', name: 'Member A', email: 'a@example.com' },
        { id: 'memberB', name: 'Member B', email: 'b@example.com' },
        { id: 'memberC', name: 'Member C', email: 'c@example.com' },
        { id: 'memberD', name: 'Member D', email: 'd@example.com' },
        { id: 'memberE', name: 'Member E', email: 'e@example.com' },
        { id: 'memberF', name: 'Member F', email: 'f@example.com' },
        { id: 'memberG', name: 'Member G', email: 'g@example.com' },
        { id: 'memberH', name: 'Member H', email: 'h@example.com' },
        { id: 'memberI', name: 'Member I', email: 'i@example.com' },
        { id: 'memberJ', name: 'Member J', email: 'j@example.com' },
      ],
      submittedMemberIds: ['memberB', 'memberD', 'memberE', 'memberF', 'memberG', 'memberH', 'memberI', 'memberJ'],
      submissionDeadline: submissionDeadline,
      checkTimestamp: checkTimestamp,
    });

    expect(result.unsubmittedMembers).toEqual(unsubmittedMembers);
    expect(result.checkTimestamp).toBe(checkTimestamp);
    expect(result.submissionDeadline).toBe(submissionDeadline);
    expect(result.unsubmittedCount).toBe(2);
    expect(result.totalMemberCount).toBe(10);
    expect(result.submittedCount).toBe(8);
  });
});