import { generateAndSendManagerConfirmationEmail } from '../../src/logic/confirmation-email-generation';

describe('generateAndSendManagerConfirmationEmail', () => {
  test('SCEN-281: throws error when manager email address is not registered', async () => {
    const determineManagerEmailRecipientsStub = jest.fn().mockResolvedValue({
      recipients: [],
      recipientCount: 0,
    });

    const buildManagerConfirmationEmailContentStub = jest.fn();
    const sendEmailWithRetryStub = jest.fn();
    const recordEmailSendingHistoryStub = jest.fn();

    const input = {
      managerUserId: 'manager-001',
      aggregationDate: '2025-01-15',
      unsubmittedMembers: [],
      prioritizedIssues: [
        { keyword: 'APIバグ', frequency: 3, priority: 'high' },
        { keyword: 'ドキュメント未整備', frequency: 2, priority: 'medium' },
      ],
      submissionDeadline: '2025-01-15T09:00:00Z',
      teamId: 'team-A',
    };

    await expect(
      generateAndSendManagerConfirmationEmail(
        input,
        determineManagerEmailRecipientsStub,
        buildManagerConfirmationEmailContentStub,
        sendEmailWithRetryStub,
        recordEmailSendingHistoryStub
      )
    ).rejects.toThrow(/部長のメールアドレスが見つかりません/);

    expect(buildManagerConfirmationEmailContentStub).not.toHaveBeenCalled();
    expect(sendEmailWithRetryStub).not.toHaveBeenCalled();
    expect(recordEmailSendingHistoryStub).not.toHaveBeenCalled();
  });
});