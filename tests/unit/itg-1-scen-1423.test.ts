import { describe, it, expect } from '@jest/globals';
import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('朝会報告管理システム - ツール連携検証', () => {
  it('SCEN-1423: 連携元ツール識別子が null のときエラーが返される', () => {
    const invalidInput = {
      integrationId: 'integ-001',
      sourceIssueCount: 5,
      targetToolType: 'jira' as const,
      registeredIssueIds: ['issue-1', 'issue-2', 'issue-3', 'issue-4', 'issue-5'],
      sourceIssueData: [
        {
          issueId: null,
          keyword: 'パフォーマンス',
          priorityScore: 75
        }
      ]
    };

    expect(() => {
      validateToolIntegrationSuccess(invalidInput);
    }).toThrow(/連携元ツール識別子/);
  });
});