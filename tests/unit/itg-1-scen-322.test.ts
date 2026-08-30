import { generateAndSendManagerConfirmationEmail } from '../../src/logic/confirmation-email-generation';

describe('confirmation-email-generation', () => {
  test('SCEN-322: メール送信に失敗したときの処理', async () => {
    // モック関数の定義
    const mockBuildManagerConfirmationEmailContent = jest.fn().mockReturnValue({
      subject: 'テスト件名',
      body: '<html>テスト本文</html>',
      generatedAt: new Date('2026-08-19T09:15:00Z'),
    });

    const mockDetermineManagerEmailRecipients = jest.fn().mockReturnValue({
      recipients: [
        {
          userId: 'manager-001',
          emailAddress: 'manager@example.com',
          displayName: 'テスト部長',
          teamId: 'team-001',
        },
      ],
      recipientCount: 1,
    });

    const mockSendEmailWithRetry = jest.fn().mockRejectedValue(
      new Error('ネットワーク接続に失敗しました'),
    );

    const mockRecordEmailSendingHistory = jest.fn().mockResolvedValue(undefined);

    // 入力パラメータの構築
    const managerConfirmationEmailInput = {
      managerUserId: 'manager-001',
      aggregationDate: '2026-08-19',
      unsubmittedMembers: [],
      prioritizedIssues: [
        {
          issueText: 'バグ',
          frequency: 3,
          impactScore: 10,
          priority: 'high' as const,
        },
        {
          issueText: '遅延',
          frequency: 2,
          impactScore: 5,
          priority: 'medium' as const,
        },
      ],
      submissionDeadline: '2026-08-19T09:00:00Z',
      teamId: 'team-001',
    };

    // 関数を実行して失敗を期待
    await expect(
      generateAndSendManagerConfirmationEmail(
        managerConfirmationEmailInput,
        mockBuildManagerConfirmationEmailContent,
        mockDetermineManagerEmailRecipients,
        mockSendEmailWithRetry,
        mockRecordEmailSendingHistory,
      ),
    ).rejects.toThrow(/ネットワーク接続/);

    // recordEmailSendingHistory が呼ばれていることを確認
    expect(mockRecordEmailSendingHistory).toHaveBeenCalled();
    const recordCallArg = mockRecordEmailSendingHistory.mock.calls[0][0];
    expect(recordCallArg.sendingStatus).toBe('failure');
    expect(recordCallArg.errorMessage).toContain('ネットワーク接続');
  });
});