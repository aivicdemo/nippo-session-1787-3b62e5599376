import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('Tool Integration Validation', () => {
  // SCEN-1420
  test('should return validation error when archiveTableId is empty string', () => {
    const toolIntegrationInput = {
      integrationId: 'integration-001',
      sourceIssueCount: 5,
      targetToolType: 'jira' as const,
      registeredIssueIds: ['JIRA-001', 'JIRA-002', 'JIRA-003', 'JIRA-004', 'JIRA-005'],
      sourceIssueData: [
        {
          issueId: 'SOURCE-001',
          keyword: 'database-performance',
          priorityScore: 85,
        },
        {
          issueId: 'SOURCE-002',
          keyword: 'memory-leak',
          priorityScore: 92,
        },
        {
          issueId: 'SOURCE-003',
          keyword: 'api-timeout',
          priorityScore: 78,
        },
        {
          issueId: 'SOURCE-004',
          keyword: 'authentication-failure',
          priorityScore: 88,
        },
        {
          issueId: 'SOURCE-005',
          keyword: 'network-connectivity',
          priorityScore: 72,
        },
      ],
    };

    const archiveConfig = {
      archiveTableId: '',
      retentionDays: 30,
      batchSize: 10,
    };

    expect(() => {
      validateToolIntegrationSuccess(toolIntegrationInput, archiveConfig);
    }).toThrow(/archiveTableId/);
  });
});