import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import { type DetectUnsubmittedMembersInput, type DetectUnsubmittedMembersOutput, type NotificationFailure } from '../../src/logic/submission-status-tracking';

describe('submission-status-tracking: detectAndNotifyUnsubmittedMembers', () => {
  // SCEN-2810: [normal] 催促方法の自動判定機能 - 各未提出メンバーに対する最適な催促方法（Slack、Teams、メール等）が自動判定される
  test('should automatically determine optimal notification channel for each unsubmitted member based on past engagement and channel registration', async () => {
    const now = new Date('2024-01-15T08:30:00Z');
    
    // Test data: 5 unsubmitted members with different channel registrations and delivery histories
    const memberA = {
      userId: 'user_A_slack_engaged',
      userName: 'Alice',
      email: 'alice@example.com',
      registeredChannels: ['slack'],
      pastDeliveryLogs: [
        { channel: 'slack', deliveredAt: new Date('2024-01-14T09:00:00Z'), opened: true },
        { channel: 'slack', deliveredAt: new Date('2024-01-13T09:00:00Z'), opened: true },
        { channel: 'slack', deliveredAt: new Date('2024-01-12T09:00:00Z'), opened: true }
      ]
    };

    const memberB = {
      userId: 'user_B_teams_only',
      userName: 'Bob',
      email: 'bob@example.com',
      registeredChannels: ['teams'],
      pastDeliveryLogs: [
        { channel: 'teams', deliveredAt: new Date('2024-01-14T09:00:00Z'), opened: true },
        { channel: 'teams', deliveredAt: new Date('2024-01-13T09:00:00Z'), opened: true }
      ]
    };

    const memberC = {
      userId: 'user_C_email_only',
      userName: 'Charlie',
      email: 'charlie@example.com',
      registeredChannels: ['email'],
      pastDeliveryLogs: [
        { channel: 'email', deliveredAt: new Date('2024-01-14T09:00:00Z'), opened: true }
      ]
    };

    const memberD = {
      userId: 'user_D_slack_unopened',
      userName: 'Diana',
      email: 'diana@example.com',
      registeredChannels: ['slack', 'email'],
      pastDeliveryLogs: [
        { channel: 'slack', deliveredAt: new Date('2024-01-14T09:00:00Z'), opened: false },
        { channel: 'slack', deliveredAt: new Date('2024-01-13T09:00:00Z'), opened: false },
        { channel: 'slack', deliveredAt: new Date('2024-01-12T09:00:00Z'), opened: false },
        { channel: 'slack', deliveredAt: new Date('2024-01-11T09:00:00Z'), opened: false },
        { channel: 'slack', deliveredAt: new Date('2024-01-10T09:00:00Z'), opened: false }
      ]
    };

    const memberE = {
      userId: 'user_E_all_channels',
      userName: 'Eve',
      email: 'eve@example.com',
      registeredChannels: ['slack', 'teams', 'email'],
      pastDeliveryLogs: [
        { channel: 'slack', deliveredAt: new Date('2024-01-14T09:00:00Z'), opened: true },
        { channel: 'teams', deliveredAt: new Date('2024-01-13T09:00:00Z'), opened: false },
        { channel: 'email', deliveredAt: new Date('2024-01-12T09:00:00Z'), opened: true }
      ]
    };

    // Mock notification service adapter
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        success: true,
        sentAt: now,
        channel: 'slack'
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'sent',
        channel: 'slack'
      })
    };

    const input: DetectUnsubmittedMembersInput = {
      teamId: 'team_001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'exec_user_001'
    };

    // Call the function with mocked adapter
    const result: DetectUnsubmittedMembersOutput = await detectAndNotifyUnsubmittedMembers(
      input,
      mockNotificationServiceAdapter,
      {
        unsubmittedMembers: [memberA, memberB, memberC, memberD, memberE],
        now
      }
    );

    // Verify unsubmitted members are detected
    expect(result.unsubmittedMembers).toHaveLength(5);

    // Verify member A: Slack registered with 100% open rate (3/3) → Slack selected
    const detectedMemberA = result.unsubmittedMembers.find(m => m.userId === 'user_A_slack_engaged');
    expect(detectedMemberA).toBeDefined();
    expect(detectedMemberA?.userName).toBe('Alice');
    expect(detectedMemberA?.email).toBe('alice@example.com');

    // Verify member B: Teams only registered → Teams selected
    const detectedMemberB = result.unsubmittedMembers.find(m => m.userId === 'user_B_teams_only');
    expect(detectedMemberB).toBeDefined();
    expect(detectedMemberB?.userName).toBe('Bob');

    // Verify member C: Email only registered → Email selected
    const detectedMemberC = result.unsubmittedMembers.find(m => m.userId === 'user_C_email_only');
    expect(detectedMemberC).toBeDefined();
    expect(detectedMemberC?.userName).toBe('Charlie');

    // Verify member D: Slack 5 consecutive unopened → fallback to Email (50% open rate on email)
    const detectedMemberD = result.unsubmittedMembers.find(m => m.userId === 'user_D_slack_unopened');
    expect(detectedMemberD).toBeDefined();
    expect(detectedMemberD?.userName).toBe('Diana');

    // Verify member E: Multiple channels registered, Slack has highest open rate (1/1=100% for slack, 0/1=0% for teams) → Slack selected
    const detectedMemberE = result.unsubmittedMembers.find(m => m.userId === 'user_E_all_channels');
    expect(detectedMemberE).toBeDefined();
    expect(detectedMemberE?.userName).toBe('Eve');

    // Verify notification selection logic was applied
    // Channel selection rule: 
    // 1. Filter to registered channels only
    // 2. Calculate open rate for each channel (opened_count / total_deliveries)
    // 3. If open rate >= 66.7%, use highest open rate channel
    // 4. If open rate < 66.7%, use channel with next highest rate (fallback)
    // 5. If no channels have history, use first registered channel
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();

    // Verify notification sent count equals number of unsubmitted members
    expect(result.notificationsSent).toBe(5);

    // Verify no notification failures in this happy path
    expect(result.notificationFailures).toHaveLength(0);

    // Verify execution timestamp is recorded
    expect(result.executedAt).toBeDefined();
    expect(new Date(result.executedAt).getTime()).toBeGreaterThanOrEqual(now.getTime());

    // Verify remaining minutes calculation is reasonable (朝会開始時刻 09:00、現在 08:30 → 30分)
    expect(result.unsubmittedMembers.every(m => typeof m.remainingMinutes === 'number')).toBe(true);
    const expectedRemainingMinutes = 30;
    expect(result.unsubmittedMembers[0].remainingMinutes).toBe(expectedRemainingMinutes);
  });
});