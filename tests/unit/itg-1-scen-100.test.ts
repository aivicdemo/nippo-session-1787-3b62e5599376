import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { syncExtractedIssuesToExternalTool } from '../../src/logic/existing-tool-integration';
import type {
  ToolIntegrationRequest,
  ToolIntegrationResult,
  ExtractedIssueData,
} from '../../src/logic/existing-tool-integration';

describe('existing-tool-integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-100: API呼び出しがタイムアウトした場合、リトライが実行され、3回目の呼び出しで成功する
  test('should retry on timeout and succeed on third attempt', async () => {
    const extractedIssueDataList: ExtractedIssueData[] = [
      {
        issueId: 'issue-001',
        issueContent: 'Database connection pool exhausted',
        priorityScore: 85,
        impactLevel: 'high',
        extractedKeywords: ['database', 'connection', 'pool'],
        reportDate: '2024-01-15T08:00:00Z',
        reporterId: 'eng-001',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-002',
        issueContent: 'Memory leak in background service',
        priorityScore: 78,
        impactLevel: 'high',
        extractedKeywords: ['memory', 'leak', 'service'],
        reportDate: '2024-01-15T08:15:00Z',
        reporterId: 'eng-002',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-003',
        issueContent: 'API response time degradation',
        priorityScore: 62,
        impactLevel: 'medium',
        extractedKeywords: ['api', 'performance', 'latency'],
        reportDate: '2024-01-15T08:30:00Z',
        reporterId: 'eng-003',
        teamId: 'team-001',
      },
    ];

    const request: ToolIntegrationRequest = {
      extractedIssueDataList,
      externalToolType: 'jira',
      toolApiEndpoint: 'https://api.jira.example.com/v3/issues',
      toolApiAuthToken: 'token-abc123def456',
      projectManagerId: 'PM001',
      maxRetryAttempts: 3,
    };

    const result: ToolIntegrationResult = await syncExtractedIssuesToExternalTool(request);

    expect(result.integrationStatus).toBe('success');
    expect(result.syncedIssueCount).toBe(3);
    expect(result.failedIssueCount).toBe(0);
    expect(result.duplicateIssuesMerged).toBe(0);
    expect(result.retryAttemptsExecuted).toBe(2);
    expect(result.managerNotificationRequired).toBe(false);
    expect(result.failureReasonIfAny).toBeNull();
    expect(result.integrationCompletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.dataConsistencyValidationResult).toBeDefined();
    expect(result.dataConsistencyValidationResult.isConsistent).toBe(true);
    expect(result.dataConsistencyValidationResult.expectedIssueCount).toBe(3);
    expect(result.dataConsistencyValidationResult.actualIssueCountInTool).toBe(3);
    expect(result.dataConsistencyValidationResult.fieldMappingValidation).toBe(true);
    expect(result.dataConsistencyValidationResult.statusSyncValidation).toBe(true);
  });
});