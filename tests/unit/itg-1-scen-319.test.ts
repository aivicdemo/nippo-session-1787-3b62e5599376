import { generateAndSendManagerConfirmationEmail } from '../../src/logic/confirmation-email-generation';

describe('generateAndSendManagerConfirmationEmail', () => {
  test('SCEN-319: [normal] 日報集約完了時に、部長向け確認メールを自動生成して送信し、優先度付き課題一覧と未提出者リストを含める', async () => {
    // テスト用のデータ構成
    const managerUserId = 'manager001';
    const aggregationDate = '2025-01-15';
    const teamId = 'team001';
    const submissionDeadline = '2025-01-15T09:00:00Z';
    
    const unsubmittedMembers: Array<{ userId: string; userName: string; elapsedMinutes: number }> = [];
    
    const prioritizedIssues = [
      {
        issueText: 'バグ',
        frequency: 3,
        impactScore: 10,
        priority: 'high' as const,
        color: '#FF0000'
      },
      {
        issueText: '遅延',
        frequency: 2,
        impactScore: 5,
        priority: 'medium' as const,
        color: '#FFFF00'
      }
    ];

    const managerConfirmationEmailInput = {
      managerUserId: managerUserId,
      aggregationDate: aggregationDate,
      teamId: teamId,
      submissionDeadline: submissionDeadline,
      prioritizedIssues: prioritizedIssues,
      unsubmittedMembers: unsubmittedMembers
    };

    // スタブ実装
    const mockBuildManagerConfirmationEmailContent = jest.fn().mockReturnValue({
      subject: '【朝会報告】本日の集約報告と課題一覧',
      body: '<html><body><h1>朝会報告集約</h1><p>提出済み: 10名</p><h2>課題一覧</h2><ul><li>バグ (優先度: 高)</li><li>遅延 (優先度: 中)</li></ul></body></html>',
      generatedAt: new Date('2025-01-15T10:00:00Z')
    });

    const mockDetermineManagerEmailRecipients = jest.fn().mockReturnValue({
      recipients: [
        {
          userId: managerUserId,
          emailAddress: 'director@company.example.com',
          displayName: 'Director Name',
          teamId: teamId
        }
      ],
      recipientCount: 1
    });

    const mockSendEmailWithRetry = jest.fn().mockResolvedValue({
      success: true,
      messageId: 'msg-20250115-001',
      attemptCount: 1
    });

    const mockRecordEmailSendingHistory = jest.fn().mockResolvedValue({
      recordedAt: new Date('2025-01-15T10:00:00Z'),
      historyId: 'history-001'
    });

    // 関数実行
    const result = await generateAndSendManagerConfirmationEmail(
      managerConfirmationEmailInput,
      mockBuildManagerConfirmationEmailContent,
      mockDetermineManagerEmailRecipients,
      mockSendEmailWithRetry,
      mockRecordEmailSendingHistory
    );

    // アサーション
    expect(result.sendingStatus).toBe('success');
    expect(result.messageId).toBe('msg-20250115-001');
    expect(result.sentDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    
    // スタブが正しく呼び出されたことを確認
    expect(mockBuildManagerConfirmationEmailContent).toHaveBeenCalledWith(
      expect.objectContaining({
        issues: prioritizedIssues,
        unsubmittedMembers: unsubmittedMembers
      })
    );
    
    expect(mockDetermineManagerEmailRecipients).toHaveBeenCalledWith(
      expect.objectContaining({
        managerUserId: managerUserId,
        teamId: teamId
      })
    );
    
    expect(mockSendEmailWithRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: 'director@company.example.com',
        subject: '【朝会報告】本日の集約報告と課題一覧'
      })
    );

    expect(mockRecordEmailSendingHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        managerUserId: managerUserId,
        aggregationDate: aggregationDate,
        messageId: 'msg-20250115-001',
        sendingStatus: 'success'
      })
    );
  });
});