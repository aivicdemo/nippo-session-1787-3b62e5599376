import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('朝会報告管理システム', () => {
  test('SCEN-1424: [error] 課題データアーカイブ機能 - 連携元ツール識別子が空文字列のときエラーが返される', () => {
    const integrationInput = {
      integrationId: '',
      sourceIssueCount: 5,
      targetToolType: 'jira' as const,
      registeredIssueIds: ['ISSUE-001', 'ISSUE-002', 'ISSUE-003', 'ISSUE-004', 'ISSUE-005'],
      sourceIssueData: [
        {
          issueId: 'ISSUE-001',
          keyword: 'バグ対応',
          priorityScore: 85,
        },
        {
          issueId: 'ISSUE-002',
          keyword: 'パフォーマンス改善',
          priorityScore: 72,
        },
        {
          issueId: 'ISSUE-003',
          keyword: 'UI改善',
          priorityScore: 60,
        },
        {
          issueId: 'ISSUE-004',
          keyword: 'バグ対応',
          priorityScore: 78,
        },
        {
          issueId: 'ISSUE-005',
          keyword: 'セキュリティ対応',
          priorityScore: 95,
        },
      ],
    };

    expect(() => validateToolIntegrationSuccess(integrationInput)).toThrow(/連携元ツール識別子/);
  });
});