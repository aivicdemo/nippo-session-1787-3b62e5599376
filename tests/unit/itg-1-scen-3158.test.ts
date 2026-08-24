import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  test('SCEN-3158: 権限外のデータ参照とツール操作を段階的に拒否する', async () => {
    const userContext = {
      userId: 'user-unauthorized',
      permissionLevel: 'viewer' as const,
      requiredPermissions: ['read:extracted_issues_data', 'write:jira_integration', 'write:audit_events']
    };

    const extractedIssueData = [
      {
        issueId: 'issue-001',
        content: 'Database connection timeout in production',
        severity: 'HIGH' as const,
        category: '本番障害',
        frequency: 3,
        affectedTeams: ['backend', 'devops'],
        reportedAt: new Date('2024-01-15T08:00:00Z'),
        resolvedAt: null,
        resolution: null
      }
    ];

    const toolIntegrationConfig = {
      targetToolType: 'jira' as const,
      jiraProjectKey: 'OPS',
      asanaProjectId: 'asana-ops-001',
      authToken: 'test-token-jira',
      baseUrl: 'https://jira.example.com'
    };

    const priorityRules = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 70,
      mediumThreshold: 40,
      lowThreshold: 0
    };

    const categoryMappings = [
      {
        systemCategory: '本番障害',
        jiraCategory: 'Production Incident',
        asanaCategory: 'Incident'
      }
    ];

    let authorizationDeniedCount = 0;
    let toolOperationDeniedCount = 0;
    let auditLogWriteDeniedCount = 0;

    const fakeAiClient: Tx5Imp1AiClient = {
      validateExtractedIssues: async () => {
        authorizationDeniedCount++;
        const error = new Error(
          'User does not have read permission for extracted_issues_data'
        );
        (error as any).statusCode = 403;
        (error as any).code = 'AUTHORIZATION_DENIED';
        throw error;
      },
      judgePriorityAndCategory: async () => {
        toolOperationDeniedCount++;
        const error = new Error(
          'User lacks write permission for Jira integration'
        );
        (error as any).statusCode = 403;
        (error as any).code = 'TOOL_OPERATION_AUTHORIZATION_DENIED';
        throw error;
      },
      executeToolIntegration: async () => {
        toolOperationDeniedCount++;
        const error = new Error(
          'User lacks write permission for Jira integration'
        );
        (error as any).statusCode = 403;
        (error as any).code = 'TOOL_OPERATION_AUTHORIZATION_DENIED';
        throw error;
      },
      recordIntegrationStatus: async () => {
        auditLogWriteDeniedCount++;
        const error = new Error(
          'User cannot write to audit_events table'
        );
        (error as any).statusCode = 403;
        (error as any).code = 'AUDIT_LOG_WRITE_DENIED';
        throw error;
      }
    };

    const result = await runTx5Imp1Agent(
      {
        extractedIssueData,
        toolIntegrationConfig,
        priorityRules,
        categoryMappings,
        userContext
      },
      fakeAiClient
    );

    expect(result.executionStatus).toBe('EXECUTION_HALTED_AUTHORIZATION_DENIED');
    expect(result.reason).toContain('User user-unauthorized lacks required permissions');
    expect(result.reason).toContain('read:extracted_issues_data');
    expect(result.reason).toContain('write:jira_integration');
    expect(result.reason).toContain('write:audit_events');

    expect(result.validatedIssues).toEqual([]);
    expect(result.integrationResult.successCount).toBe(0);
    expect(result.integrationResult.failureCount).toBe(0);
    expect(result.integrationResult.skippedCount).toBeGreaterThanOrEqual(0);

    expect(result.executionSummary.totalActionsAttempted).toBe(1);
    expect(result.executionSummary.totalActionsCompleted).toBe(0);
    expect(result.executionSummary.exceptionOccurred).toBe(true);
    expect(result.executionSummary.finalStatus).toBe('AUTHORIZATION_DENIED');

    expect(authorizationDeniedCount).toBe(1);

    expect(result.sideEffects).toEqual({
      jiraIssuesCreated: 0,
      asanaIssuesCreated: 0,
      auditEventsRecorded: 0,
      notificationsSent: 0
    });

    expect(result.executionLog).toContain('AUTHORIZATION_DENIED');
    expect(result.executionLog).not.toContain('TOOL_INTEGRATION_SUCCESS');
  });
});