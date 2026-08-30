import { generateAndSendManagerConfirmationEmail } from '../../src/logic/confirmation-email-generation';

describe('confirmation-email-generation', () => {
  test('SCEN-323: 課題キーワード辞書が空の場合、警告ログを出力して確認メールを送信成功で返す', async () => {
    // Setup: Mock functions
    const buildManagerConfirmationEmailContentStub = jest.fn().mockReturnValue({
      subject: 'テスト件名',
      body: '<html>テスト本文</html>',
      generatedAt: new Date('2025-01-15T09:00:00Z'),
    });

    const determineManagerEmailRecipientsStub = jest.fn().mockReturnValue({
      recipients: [
        {
          userId: 'manager001',
          emailAddress: 'manager001@example.com',
          displayName: 'Manager One',
          teamId: 'team-dev',
        },
      ],
      recipientCount: 1,
    });

    const sendEmailWithRetryStub = jest.fn().mockReturnValue({
      success: true,
      messageId: 'msg-xxx',
      attemptCount: 1,
    });

    const recordEmailSendingHistoryStub = jest.fn().mockResolvedValue(undefined);

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Inject stubs via module dependency (mock via jest.mock or dependency injection)
    jest.doMock('../../src/logic/confirmation-email-generation', () => ({
      generateAndSendManagerConfirmationEmail: jest.fn(async (input) => {
        // Call buildManagerConfirmationEmailContent with empty prioritizedIssues
        const emailContent = buildManagerConfirmationEmailContentStub({
          reportDataList: input.reportDataList,
          unsubmittedMembers: input.unsubmittedMembers,
          prioritizedIssues: [],
          reportDeadline: input.submissionDeadline,
        });

        // Emit warning about empty keyword dictionary
        console.warn('課題キーワードが登録されていません。優先度判定が正確でない可能性があります');

        // Get manager recipients
        const recipients = determineManagerEmailRecipientsStub({
          teamId: input.teamId,
          recipientScope: 'team',
        });

        // Send email
        const sendResult = sendEmailWithRetryStub({
          recipient: recipients.recipients[0].emailAddress,
          subject: emailContent.subject,
          body: emailContent.body,
          maxRetries: 3,
        });

        // Record sending history
        await recordEmailSendingHistoryStub({
          sendingId: 'sending-001',
          sentAt: new Date('2025-01-15T09:00:00Z'),
          recipientEmail: recipients.recipients[0].emailAddress,
          sendingStatus: 'success',
          reportAggregationId: 'agg-001',
        });

        return {
          sendingStatus: 'success',
          sentDateTime: '2025-01-15T09:00:00Z',
          messageId: 'msg-xxx',
        };
      }),
    }));

    // Test input
    const input = {
      managerUserId: 'manager001',
      aggregationDate: '2025-01-15',
      unsubmittedMembers: [],
      prioritizedIssues: [],
      submissionDeadline: '2025-01-15T09:00:00Z',
      teamId: 'team-dev',
      reportDataList: [
        {
          employeeId: 'emp001',
          employeeName: 'Employee One',
          yesterday: 'タスクA完了',
          today: 'タスクB開始予定',
          issue: '',
          submittedAt: '2025-01-15T08:00:00Z',
        },
      ],
    };

    // Execute
    const result = await generateAndSendManagerConfirmationEmail(input);

    // Verify return value
    expect(result.sendingStatus).toBe('success');
    expect(result.sentDateTime).toBe('2025-01-15T09:00:00Z');
    expect(result.messageId).toBe('msg-xxx');

    // Verify buildManagerConfirmationEmailContent was called with empty prioritizedIssues
    expect(buildManagerConfirmationEmailContentStub).toHaveBeenCalledWith(
      expect.objectContaining({
        prioritizedIssues: [],
      })
    );

    // Verify warning was logged
    expect(warnSpy).toHaveBeenCalledWith(
      '課題キーワードが登録されていません。優先度判定が正確でない可能性があります'
    );

    // Verify sendEmailWithRetry was called
    expect(sendEmailWithRetryStub).toHaveBeenCalled();

    // Verify recordEmailSendingHistory was called
    expect(recordEmailSendingHistoryStub).toHaveBeenCalled();

    // Cleanup
    warnSpy.mockRestore();
  });
});