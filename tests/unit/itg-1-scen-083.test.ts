import { generateAndSendManagerConfirmationEmail } from '../../src/logic/confirmation-email-generation';

describe('朝会報告管理システム - 部長向け確認メール生成・送信', () => {
  test('SCEN-083: 日報集約完了時に部長向け確認メールを自動生成・送信し、優先度付き課題一覧と未提出者リストを含める', async () => {
    const unsubmittedMembers: Array<{ userId: string; userName: string; elapsedMinutes: number }> = [];
    const prioritizedIssues = [
      {
        issueId: 'issue-001',
        content: 'ビルド失敗が頻発している',
        priorityRank: 'high' as const,
        colorCode: '#FF0000',
        frequency: 5,
        impactScore: 85,
      },
      {
        issueId: 'issue-002',
        content: 'テスト環境の不安定性',
        priorityRank: 'medium' as const,
        colorCode: '#FFFF00',
        frequency: 3,
        impactScore: 60,
      },
      {
        issueId: 'issue-003',
        content: 'ドキュメント更新遅延',
        priorityRank: 'low' as const,
        colorCode: '#00FF00',
        frequency: 1,
        impactScore: 30,
      },
    ];

    const input = {
      managerUserId: 'manager001',
      aggregationDate: '2026-08-19',
      unsubmittedMembers,
      prioritizedIssues,
      submissionDeadline: '2026-08-19T09:00:00Z',
      teamId: 'team-A',
    };

    const result = await generateAndSendManagerConfirmationEmail(input);

    expect(result.sendingStatus).toBe('success');
    expect(result.messageId).toBe('msg-20260819-001');
    expect(result.errorMessage).toBeUndefined();
    expect(typeof result.sentDateTime).toBe('string');
    expect(result.sentDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});