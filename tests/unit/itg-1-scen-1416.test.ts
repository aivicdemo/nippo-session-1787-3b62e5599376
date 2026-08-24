import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';
import { type ToolIntegrationValidationResult, type MismatchDetail } from '../../src/logic/tool-integration';

describe('Tool Integration Validation', () => {
  // SCEN-1416: [error] 課題データアーカイブ機能 - PM検証完了フラグが null のときエラーが返される
  test('should return 400 validation error when pmVerificationCompleted is null', () => {
    const invalidInput = {
      integrationId: 'integration-test-001',
      sourceIssueCount: 5,
      targetToolType: 'jira' as const,
      registeredIssueIds: ['JIRA-001', 'JIRA-002', 'JIRA-003', 'JIRA-004', 'JIRA-005'],
      sourceIssueData: [
        {
          issueId: 'source-001',
          keyword: 'パフォーマンス低下',
          priorityScore: 85,
        },
        {
          issueId: 'source-002',
          keyword: 'メモリリーク',
          priorityScore: 90,
        },
        {
          issueId: 'source-003',
          keyword: 'ネットワークタイムアウト',
          priorityScore: 75,
        },
        {
          issueId: 'source-004',
          keyword: 'データベース接続エラー',
          priorityScore: 88,
        },
        {
          issueId: 'source-005',
          keyword: 'UI表示ズレ',
          priorityScore: 60,
        },
      ],
      pmVerificationCompleted: null as unknown as boolean,
    };

    expect(() => {
      validateToolIntegrationSuccess(invalidInput);
    }).toThrow(/PM検証完了フラグ/);
  });
});