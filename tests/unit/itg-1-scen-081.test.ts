import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { sendConfirmationEmailToManager } from '../../src/logic/reminder-notification-service';
import type { ManagerConfirmationEmailInput } from '../../src/logic/reminder-notification-service';

describe('sendConfirmationEmailToManager', () => {
  // SCEN-081
  test('should throw InvalidManagerEmailRecipientError when manager user ID is invalid or email is not registered', async () => {
    const invalidManagerInput: ManagerConfirmationEmailInput = {
      managerUserId: 'invalid-manager-id-12345',
      aggregationDate: '2026-08-19',
      unsubmittedMembers: [],
      prioritizedIssues: [],
      submissionDeadline: '2026-08-20T09:00:00Z',
    };

    await expect(
      sendConfirmationEmailToManager(invalidManagerInput)
    ).rejects.toThrow(/指定されたマネージャーへのメール送信に失敗しました/);
  });
});