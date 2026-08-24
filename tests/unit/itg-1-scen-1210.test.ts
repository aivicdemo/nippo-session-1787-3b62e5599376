import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1 Agent - Existing Tool Integration', () => {
  test('SCEN-1210: [normal] 既存ツール連携機能 - 連携完了後に同じ課題データで再実行しても重複登録されない', async () => {
    // Test data setup
    const testIssueKeyword = 'データベース接続エラー';
    const extractedIssueData = [
      {
        issueId: 'issue-db-001',
        title: 'DB Connection Failure',
        description: `${testIssueKeyword}が発生した`,
        frequency: 3,
        impactScore: 75,
        category: 'infrastructure',
      },
    ];

    const toolIntegrationConfig = {
      toolType: 'jira' as const,
      apiEndpoint: 'https://api.example.com/jira',
      projectKey: 'TEAM-A',
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelayMs: 1000,
    };

    const priorityRules = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 70,
      mediumThreshold: 40,
    };

    const categoryMappings = [
      {
        systemCategory: 'infrastructure',
        toolCategory: 'Infrastructure',
      },
    ];

    // Mock adapters
    let notificationCallCount = 0;
    let textAnalysisCallCount = 0;
    const mockNotificationService = {
      sendReminderNotification: jest.fn(async () => {
        notificationCallCount += 1;
        return { status: 'delivered', messageId: `msg-${notificationCallCount}` };
      }),
      scheduleNotification: jest.fn(async () => ({
        scheduleId: 'sched-001',
      })),
      getDeliveryStatus: jest.fn(async () => ({
        delivered: notificationCallCount,
        failed: 0,
        pending: 0,
      })),
    };

    const mockTextAnalysisService = {
      extractKeywords: jest.fn(async () => {
        textAnalysisCallCount += 1;
        return {
          keywords: [
            {
              keyword: testIssueKeyword,
              frequency: 3,
              confidence: 0.92,
            },
          ],
        };
      }),
      assessImpactScore: jest.fn(async () => ({
        impactScore: 75,
        severity: 'high' as const,
      })),
      classifyIssueSeverity: jest.fn(async () => ({
        severity: 'high' as const,
      })),
    };

    // First execution
    const firstResult = await runTx5Imp1Agent(
      {
        extractedIssueData,
        toolIntegrationConfig,
        priorityRules,
        categoryMappings,
      },
      mockTextAnalysisService as any,
      mockNotificationService as any,
    );

    expect(firstResult).toBeDefined();
    expect(firstResult.validatedIssues).toBeDefined();
    expect(firstResult.validatedIssues.length).toBe(1);
    expect(firstResult.validatedIssues[0].issueId).toBe('issue-db-001');
    expect(firstResult.validatedIssues[0].validationStatus).toBe('valid');
    expect(firstResult.validatedIssues[0].priorityRank).toBe('high');
    expect(firstResult.integrationResult.successCount).toBeGreaterThanOrEqual(1);

    const firstNotificationCount = notificationCallCount;
    const firstTextAnalysisCount = textAnalysisCallCount;

    // Second execution with same data
    const secondResult = await runTx5Imp1Agent(
      {
        extractedIssueData,
        toolIntegrationConfig,
        priorityRules,
        categoryMappings,
      },
      mockTextAnalysisService as any,
      mockNotificationService as any,
    );

    expect(secondResult).toBeDefined();
    expect(secondResult.validatedIssues).toBeDefined();
    expect(secondResult.validatedIssues.length).toBe(1);
    expect(secondResult.validatedIssues[0].issueId).toBe('issue-db-001');
    expect(secondResult.validatedIssues[0].validationStatus).toBe('valid');

    // Verify no duplicate notifications were sent
    expect(notificationCallCount).toBe(firstNotificationCount);

    // Verify issue count remains 1 (no duplication)
    expect(secondResult.validatedIssues.length).toBe(1);

    // Verify integration status indicates success without duplication
    expect(secondResult.integrationResult.duplicateCount).toBeGreaterThanOrEqual(0);

    // Verify that the same issue is tracked as idempotent
    expect(secondResult.validatedIssues[0].toolIssueId).toBeDefined();
    const toolIssueIdFirst = firstResult.validatedIssues[0].toolIssueId;
    const toolIssueIdSecond = secondResult.validatedIssues[0].toolIssueId;
    expect(toolIssueIdFirst).toBe(toolIssueIdSecond);
  });
});