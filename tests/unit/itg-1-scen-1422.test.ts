import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('Tool Integration Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1422
  test('should return INVALID_TABLE_ID error when tableId is empty string', () => {
    const input = {
      integrationId: 'integration-001',
      sourceIssueCount: 5,
      targetToolType: 'jira' as const,
      registeredIssueIds: ['JIRA-001', 'JIRA-002', 'JIRA-003', 'JIRA-004', 'JIRA-005'],
      sourceIssueData: [
        {
          issueId: 'ISSUE-001',
          keyword: 'database_performance',
          priorityScore: 85,
        },
        {
          issueId: 'ISSUE-002',
          keyword: 'api_timeout',
          priorityScore: 72,
        },
        {
          issueId: 'ISSUE-003',
          keyword: 'memory_leak',
          priorityScore: 90,
        },
        {
          issueId: 'ISSUE-004',
          keyword: 'concurrent_bug',
          priorityScore: 78,
        },
        {
          issueId: 'ISSUE-005',
          keyword: 'cache_issue',
          priorityScore: 65,
        },
      ],
      tableId: '',
    };

    expect(() => validateToolIntegrationSuccess(input)).toThrow(/INVALID_TABLE_ID/);
  });
});