import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import { type GenerateAndSendSummaryEmailInput, type GenerateAndSendSummaryEmailOutput } from '../../src/logic/notification-delivery';

describe('部長向けダッシュボード - 本日報告提出状況リアルタイム表示', () => {
  // SCEN-204: [normal] 日報集約メール自動送信機能 - 部長が手動でメール送信トリガーを実行した場合、統一フォーマットメールが自動送信される
  test('部長による手動トリガー実行時に、統一フォーマット日報集約メールが自動送信される', async () => {
    // Arrange
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const managerUserId = 'manager-001';
    const reportDeadlineTime = '09:00';

    const submittedReports = [
      {
        reporterId: 'engineer-001',
        reporterName: 'エンジニア太郎',
        submittedAt: '2024-01-15T08:45:00Z',
        challenges: ['データベース接続エラーが頻発している', '本番環境でのメモリリーク'],
      },
      {
        reporterId: 'engineer-002',
        reporterName: 'エンジニア花子',
        submittedAt: '2024-01-15T08:50:00Z',
        challenges: ['APIレスポンス時間が悪化', 'テストカバレッジが目標を下回っている'],
      },
      {
        reporterId: 'engineer-003',
        reporterName: 'エンジニア次郎',
        submittedAt: '2024-01-15T08:55:00Z',
        challenges: ['デプロイ手順が煩雑で自動化が必要'],
      },
      {
        reporterId: 'engineer-004',
        reporterName: 'エンジニア美咲',
        submittedAt: '2024-01-15T08:52:00Z',
        challenges: ['ログシステムの監視が不十分'],
      },
      {
        reporterId: 'engineer-005',
        reporterName: 'エンジニア健太',
        submittedAt: '2024-01-15T08:48:00Z',
        challenges: ['セキュリティ脆弱性の検査ツール導入が遅れている'],
      },
      {
        reporterId: 'engineer-006',
        reporterName: 'エンジニア由美',
        submittedAt: '2024-01-15T08:53:00Z',
        challenges: ['負荷テストの結果が基準を満たしていない'],
      },
      {
        reporterId: 'engineer-007',
        reporterName: 'エンジニア拓也',
        submittedAt: '2024-01-15T08:47:00Z',
        challenges: [],
      },
      {
        reporterId: 'engineer-008',
        reporterName: 'エンジニア麗奈',
        submittedAt: '2024-01-15T08:51:00Z',
        challenges: ['ドキュメント更新がコード変更に追いついていない'],
      },
      {
        reporterId: 'engineer-009',
        reporterName: 'エンジニア翔太',
        submittedAt: '2024-01-15T08:54:00Z',
        challenges: ['CI/CDパイプラインの安定性に問題がある'],
      },
      {
        reporterId: 'engineer-010',
        reporterName: 'エンジニア優子',
        submittedAt: '2024-01-15T08:49:00Z',
        challenges: ['開発環境の構築ドキュメントが不十分'],
      },
    ];

    const unsubmittedMemberIds: string[] = [];

    const input: GenerateAndSendSummaryEmailInput = {
      teamId,
      reportDate,
      managerUserId,
      submittedReports,
      unsubmittedMemberIds,
      reportDeadlineTime,
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 200,
        messageId: 'msg-001',
        deliveredAt: '2024-01-15T09:00:30Z',
      }),
    };

    // Act
    const result = await generateAndSendSummaryEmail(input, mockNotificationServiceAdapter);

    // Assert
    expect(result).toBeDefined();
    expect(result.emailId).toBeDefined();
    expect(result.emailId).toMatch(/^[a-zA-Z0-9\-_]+$/);
    expect(result.sentAt).toBe('2024-01-15T09:00:30Z');
    expect(result.recipientEmail).toBeDefined();
    expect(result.includedIssueCount).toBe(9);
    expect(result.submissionSummary.submittedCount).toBe(10);
    expect(result.submissionSummary.unsubmittedCount).toBe(0);
    expect(result.submissionSummary.submissionRate).toBe(100);

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(1);
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: managerUserId,
        message: expect.stringContaining('エンジニア太郎'),
      }),
    );
  });
});