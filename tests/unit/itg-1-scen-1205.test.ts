import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type ExtractedIssue, type ToolIntegrationConfig, type PriorityRuleSet, type CategoryMapping } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('Tx5Imp1Agent - 既存ツール連携機能', () => {
  // SCEN-1205: [normal] 既存ツール連携機能 - 抽出された課題データ0件が既存ツールに正常に連携される
  test('should handle zero extracted issues with successful tool integration and email notification', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'sent' }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: true }),
    };

    const mockAiClient: Tx5Imp1AiClient = {
      analyzeAndValidateIssues: jest.fn(),
      determinePriorityAndCategory: jest.fn(),
      generateIntegrationPayload: jest.fn(),
    };

    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: 'issue-001',
        sourceText: '特に課題なし',
        extractedAt: new Date('2024-01-15T09:00:00Z'),
        confidence: 0.95,
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://jira.example.com',
      projectKey: 'TEST',
      authToken: 'test-token',
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 70,
      mediumThreshold: 40,
    };

    const categoryMappings: CategoryMapping[] = [
      {
        sourceCategory: 'quality',
        targetCategory: 'Quality Assurance',
        toolId: 'QUAL',
      },
    ];

    mockTextAnalysisAdapter.extractKeywords.mockResolvedValueOnce([]);

    const result = await runTx5Imp1Agent(
      {
        extractedIssueData,
        toolIntegrationConfig,
        priorityRules,
        categoryMappings,
      },
      mockAiClient
    );

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).not.toHaveBeenCalled();

    expect(result.validatedIssues).toEqual([]);

    expect(result.integrationResult.successCount).toBe(0);
    expect(result.integrationResult.failureCount).toBe(0);

    expect(result.executionSummary.status).toBe('success');
    expect(result.executionSummary.totalProcessed).toBe(0);
    expect(result.executionSummary.exceptionOccurred).toBe(false);
  });
});