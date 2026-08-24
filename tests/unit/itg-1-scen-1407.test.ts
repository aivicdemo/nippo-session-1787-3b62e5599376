import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('Tool Integration Validation', () => {
  // SCEN-1407: [error] 課題データアーカイブ機能 - アーカイブ対象の課題IDが null のときエラーが返される
  test('should return error with code INVALID_ISSUE_ID when issue ID is null', () => {
    const input = {
      integrationId: 'integration-001',
      sourceIssueCount: 5,
      targetToolType: 'jira' as const,
      registeredIssueIds: ['JIRA-001', 'JIRA-002', 'JIRA-003', 'JIRA-004', 'JIRA-005'],
      sourceIssueData: [
        {
          issueId: null as any,
          keyword: 'database-connection',
          priorityScore: 85,
        },
      ],
    };

    expect(() => validateToolIntegrationSuccess(input)).toThrow(/INVALID_ISSUE_ID/);
  });
});