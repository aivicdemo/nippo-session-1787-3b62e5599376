import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import { type DetectUnsubmittedMembersInput, type DetectUnsubmittedMembersOutput } from '../../src/logic/submission-status-tracking';

describe('Unsubmitted Members Priority Detection Dashboard - 30 Minutes Before Deadline', () => {
  // SCEN-2831: [edge] 未提出メンバー優先度判定機能 - 報告期限の30分より前の時点では未提出メンバーリストが表示されない
  test('should not display unsubmitted members list and should not send notifications when current time is 30 minutes before deadline', async () => {
    // Setup: Fixed deadline at 09:00 JST
    const reportDate = '2024-01-15';
    const morningMeetingStartTime = '09:00';
    const teamId = 'team-engineering-001';
    const executorUserId = 'user-manager-001';

    // System current time set to 08:30 (30 minutes before 09:00 deadline)
    const currentTime = new Date('2024-01-15T08:30:00+09:00');
    jest.useFakeTimers();
    jest.setSystemTime(currentTime);

    // Mock NotificationServiceAdapter
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent' as const,
        sentAt: new Date(),
        errorMessage: null,
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduled: true,
        scheduledTime: new Date(),
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        deliveryStatus: 'pending',
      }),
    };

    const input: DetectUnsubmittedMembersInput = {
      teamId,
      reportDate,
      morningMeetingStartTime,
      executorUserId,
    };

    // Execute function with mocked notification adapter
    const output: DetectUnsubmittedMembersOutput = await detectAndNotifyUnsubmittedMembers(
      input,
      mockNotificationAdapter
    );

    // Assertions: Verify notifications were NOT sent
    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(mockNotificationAdapter.scheduleNotification).not.toHaveBeenCalled();

    // Assertions: Verify unsubmitted members list is empty or not populated
    expect(output.unsubmittedMembers).toEqual([]);
    expect(output.notificationsSent).toBe(0);

    // Assertions: Verify no notification failures recorded
    expect(output.notificationFailures).toEqual([]);

    // Assertions: Verify execution timestamp reflects the mock time
    expect(new Date(output.executedAt).getTime()).toBeLessThanOrEqual(currentTime.getTime());

    jest.useRealTimers();
  });
});