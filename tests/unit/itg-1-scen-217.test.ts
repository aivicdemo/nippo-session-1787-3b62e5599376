import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import { type GenerateAndSendSummaryEmailInput, type GenerateAndSendSummaryEmailOutput } from '../../src/logic/notification-delivery';

describe('日報集約メール送信機能 - 空配列エラーハンドリング', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-217
  test('集約対象の日報データが空配列のとき、メール送信処理は実行されず、エラーステータスが返却される', () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      managerUserId: 'manager-001',
      submittedReports: [],
      unsubmittedMemberIds: ['member-002', 'member-003'],
      reportDeadlineTime: '09:00',
    };

    const result = generateAndSendSummaryEmail(
      input,
      mockNotificationServiceAdapter
    );

    expect(result.emailId).toBeUndefined();
    expect(result.sentAt).toBeUndefined();
    expect(result.recipientEmail).toBeUndefined();
    expect(result.includedIssueCount).toBe(0);
    expect(result.submissionSummary.submittedCount).toBe(0);
    expect(result.submissionSummary.unsubmittedCount).toBe(2);
    expect(result.submissionSummary.submissionRate).toBe(0);

    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(mockNotificationServiceAdapter.scheduleNotification).not.toHaveBeenCalled();
  });
});