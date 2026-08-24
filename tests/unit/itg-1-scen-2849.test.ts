import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import { type DetectUnsubmittedMembersInput, type DetectUnsubmittedMembersOutput } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー催促通知機能 - 段階的通知方法変更', () => {
  // SCEN-2849
  test('再催促ルール適用時、段階的に通知方法が変更される', async () => {
    const day1_timestamp = new Date('2024-01-15T09:00:00Z');
    const day2_timestamp = new Date('2024-01-16T09:00:00Z');
    const day3_timestamp = new Date('2024-01-17T09:00:00Z');

    const teamId = 'team-engineering-001';
    const reportDate = '2024-01-15';
    const morningMeetingStartTime = '09:00';
    const executorUserId = 'user-dept-manager-001';

    const unsubmittedMembersDay1 = [
      {
        userId: 'user-engineer-a-001',
        userName: 'Engineer A',
        email: 'engineer-a@company.com',
        remainingMinutes: -120,
      },
      {
        userId: 'user-engineer-b-001',
        userName: 'Engineer B',
        email: 'engineer-b@company.com',
        remainingMinutes: -120,
      },
      {
        userId: 'user-engineer-c-001',
        userName: 'Engineer C',
        email: 'engineer-c@company.com',
        remainingMinutes: -120,
      },
    ];

    // Day 1: Initial reminder via Slack
    const notificationServiceAdapterDay1 = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        sentAt: day1_timestamp,
        channel: 'slack',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        delivered: true,
        channel: 'slack',
        sentAt: day1_timestamp,
      }),
    };

    const inputDay1: DetectUnsubmittedMembersInput = {
      teamId,
      reportDate,
      morningMeetingStartTime,
      executorUserId,
    };

    const resultDay1 = await detectAndNotifyUnsubmittedMembers(
      inputDay1,
      notificationServiceAdapterDay1,
    );

    expect(resultDay1.unsubmittedMembers).toHaveLength(3);
    expect(resultDay1.notificationsSent).toBe(3);
    expect(resultDay1.notificationFailures).toHaveLength(0);
    expect(notificationServiceAdapterDay1.sendReminderNotification).toHaveBeenCalledTimes(3);

    // Day 2: Re-reminder after 24+ hours via Microsoft Teams
    const notificationServiceAdapterDay2 = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        sentAt: day2_timestamp,
        channel: 'teams',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        delivered: true,
        channel: 'teams',
        sentAt: day2_timestamp,
      }),
    };

    const inputDay2: DetectUnsubmittedMembersInput = {
      teamId,
      reportDate: '2024-01-16',
      morningMeetingStartTime,
      executorUserId,
    };

    const resultDay2 = await detectAndNotifyUnsubmittedMembers(
      inputDay2,
      notificationServiceAdapterDay2,
    );

    expect(resultDay2.unsubmittedMembers).toHaveLength(3);
    expect(resultDay2.notificationsSent).toBe(3);
    expect(resultDay2.notificationFailures).toHaveLength(0);

    const callsDay2 = notificationServiceAdapterDay2.sendReminderNotification.mock.calls;
    callsDay2.forEach((call) => {
      expect(call[0]).toMatchObject({
        channel: 'teams',
      });
    });

    // Day 3: Final reminder after 72+ hours via Email + Dashboard Warning
    const notificationServiceAdapterDay3 = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        sentAt: day3_timestamp,
        channel: 'email',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        delivered: true,
        channel: 'email',
        sentAt: day3_timestamp,
      }),
    };

    const inputDay3: DetectUnsubmittedMembersInput = {
      teamId,
      reportDate: '2024-01-17',
      morningMeetingStartTime,
      executorUserId,
    };

    const resultDay3 = await detectAndNotifyUnsubmittedMembers(
      inputDay3,
      notificationServiceAdapterDay3,
    );

    expect(resultDay3.unsubmittedMembers).toHaveLength(3);
    expect(resultDay3.notificationsSent).toBe(3);
    expect(resultDay3.notificationFailures).toHaveLength(0);

    const callsDay3 = notificationServiceAdapterDay3.sendReminderNotification.mock.calls;
    callsDay3.forEach((call) => {
      expect(call[0]).toMatchObject({
        channel: 'email',
      });
    });

    // Verify notification progression across all three days
    expect(resultDay1.executedAt).toBeDefined();
    expect(resultDay2.executedAt).toBeDefined();
    expect(resultDay3.executedAt).toBeDefined();

    const unsubmittedUserIdsDay1 = new Set(
      resultDay1.unsubmittedMembers.map((m) => m.userId),
    );
    const unsubmittedUserIdsDay2 = new Set(
      resultDay2.unsubmittedMembers.map((m) => m.userId),
    );
    const unsubmittedUserIdsDay3 = new Set(
      resultDay3.unsubmittedMembers.map((m) => m.userId),
    );

    expect(unsubmittedUserIdsDay1).toEqual(
      new Set([
        'user-engineer-a-001',
        'user-engineer-b-001',
        'user-engineer-c-001',
      ]),
    );
    expect(unsubmittedUserIdsDay2).toEqual(
      new Set([
        'user-engineer-a-001',
        'user-engineer-b-001',
        'user-engineer-c-001',
      ]),
    );
    expect(unsubmittedUserIdsDay3).toEqual(
      new Set([
        'user-engineer-a-001',
        'user-engineer-b-001',
        'user-engineer-c-001',
      ]),
    );

    // Verify channels progressed as expected
    const channel1 = notificationServiceAdapterDay1.sendReminderNotification.mock.calls[0][0]
      .channel;
    const channel2 = notificationServiceAdapterDay2.sendReminderNotification.mock.calls[0][0]
      .channel;
    const channel3 = notificationServiceAdapterDay3.sendReminderNotification.mock.calls[0][0]
      .channel;

    expect(channel1).toBe('slack');
    expect(channel2).toBe('teams');
    expect(channel3).toBe('email');
  });
});