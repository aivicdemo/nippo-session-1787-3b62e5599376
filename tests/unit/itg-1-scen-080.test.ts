import { sendConfirmationEmailToManager } from '../../src/logic/reminder-notification-service';

describe('朝会報告管理システム - 部長向け確認メール送信', () => {
  // SCEN-080: [normal] 日報集約完了時に部長向け確認メールを自動生成・配信し、未提出者リストと優先度付き課題一覧を含める
  test('sendConfirmationEmailToManagerが代表的な正常入力を設計どおり処理する', async () => {
    const managerUserId = 'MGR-001';
    const aggregationDate = '2026-08-19';
    const submissionDeadline = '2026-08-19T09:30:00Z';
    const teamId = 'TEAM-A';

    const unsubmittedMembers = [
      {
        employeeId: 'ENG-002',
        employeeName: '山田太郎'
      },
      {
        employeeId: 'ENG-005',
        employeeName: '鈴木花子'
      }
    ];

    const prioritizedIssues = [
      {
        issueKeyword: 'ビルドエラー',
        frequency: 3,
        priority: 'high'
      },
      {
        issueKeyword: 'テスト環境不安定',
        frequency: 2,
        priority: 'medium'
      },
      {
        issueKeyword: 'レビュー待ち',
        frequency: 1,
        priority: 'low'
      }
    ];

    const result = await sendConfirmationEmailToManager({
      managerUserId,
      aggregationDate,
      unsubmittedMembers,
      prioritizedIssues,
      submissionDeadline,
      teamId
    });

    expect(result.sendingStatus).toBe('success');
    expect(result.sentDateTime).toBeDefined();
    expect(typeof result.sentDateTime).toBe('string');
    expect(result.messageId).toBeDefined();
    expect(typeof result.messageId).toBe('string');
    expect(result.messageId.length).toBeGreaterThan(0);
  });
});