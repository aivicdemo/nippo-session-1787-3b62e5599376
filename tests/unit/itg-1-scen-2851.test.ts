import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import type { DetectUnsubmittedMembersInput, DetectUnsubmittedMembersOutput, NotificationFailure } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー催促通知機能', () => {
  let notificationServiceAdapterStub: {
    sendReminderNotification: jest.Mock;
  };

  beforeEach(() => {
    notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn(),
    };
  });

  // SCEN-2851: [normal] 未提出メンバー催促通知機能 - NotificationServiceAdapterが正常応答したとき、催促通知の配信ステータスが返される
  test('should return delivery status and record notification log when NotificationServiceAdapter responds successfully', async () => {
    const input: DetectUnsubmittedMembersInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'user-manager-001',
    };

    const successfulDeliveryResponse = {
      status: 'success' as const,
      deliveryId: 'delivery-12345',
      timestamp: '2024-01-15T08:30:00Z',
      channel: 'slack' as const,
    };

    notificationServiceAdapterStub.sendReminderNotification.mockResolvedValueOnce(
      successfulDeliveryResponse
    );

    const output: DetectUnsubmittedMembersOutput = await detectAndNotifyUnsubmittedMembers(
      input,
      notificationServiceAdapterStub
    );

    expect(output.notificationsSent).toBe(1);
    expect(output.notificationFailures).toEqual([]);
    expect(output.unsubmittedMembers).toBeDefined();
    expect(Array.isArray(output.unsubmittedMembers)).toBe(true);
    expect(output.executedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    expect(notificationServiceAdapterStub.sendReminderNotification).toHaveBeenCalled();
    const callArgs = notificationServiceAdapterStub.sendReminderNotification.mock.calls[0];
    expect(callArgs).toBeDefined();
    expect(callArgs[0]).toHaveProperty('channel');
  });
});