import { describe, test, expect } from '@jest/globals';
import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('Tool Integration Validation', () => {
  // SCEN-1417: [error] 課題データアーカイブ機能 - アーカイブ対象課題の配列が null のときエラーが返される
  test('should throw error when archive target issues array is null', () => {
    const nullIssuesArray = null;
    const integrationInput = {
      integrationId: 'integration-001',
      sourceIssueCount: 5,
      targetToolType: 'jira' as const,
      registeredIssueIds: ['JIRA-1', 'JIRA-2', 'JIRA-3', 'JIRA-4', 'JIRA-5'],
      sourceIssueData: [
        {
          issueId: 'SOURCE-1',
          keyword: 'performance-issue',
          priorityScore: 85,
        },
        {
          issueId: 'SOURCE-2',
          keyword: 'memory-leak',
          priorityScore: 90,
        },
        {
          issueId: 'SOURCE-3',
          keyword: 'api-timeout',
          priorityScore: 75,
        },
        {
          issueId: 'SOURCE-4',
          keyword: 'database-lock',
          priorityScore: 88,
        },
        {
          issueId: 'SOURCE-5',
          keyword: 'network-failure',
          priorityScore: 80,
        },
      ],
      archivedIssues: nullIssuesArray,
    };

    expect(() => {
      validateToolIntegrationSuccess(integrationInput);
    }).toThrow(/課題配列/);
  });
});