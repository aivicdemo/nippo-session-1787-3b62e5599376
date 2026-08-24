import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type TextAnalysisServiceAdapter } from '../../src/external/text-analysis-service.adapter';

describe('tx-5-imp-1 課題の影響度判定エラーハンドリング', () => {
  // SCEN-1225: [error] 既存ツール連携機能 - 課題の影響度判定結果が null のとき処理が中断される
  test('影響度判定結果が null のとき、処理が中断されエラーログに記録される', async () => {
    const mockErrorLogs: string[] = [];
    const originalConsoleError = console.error;
    console.error = jest.fn((message: string) => {
      mockErrorLogs.push(message);
      originalConsoleError(message);
    });

    try {
      const textAnalysisServiceStub: Partial<TextAnalysisServiceAdapter> = {
        extractKeywords: jest.fn().mockResolvedValue({
          keywords: ['サーバー障害', '対応'],
          frequencies: { 'サーバー障害': 5, '対応': 3 },
        }),
        assessImpactScore: jest.fn().mockResolvedValue(null),
        classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
      };

      const aiClientStub: Tx5Imp1AiClient = {
        validateAndPrioritizeIssues: jest.fn().mockResolvedValue({
          validatedIssues: [],
          validationErrors: [],
        }),
        mapIssuesToExistingToolCategories: jest.fn().mockResolvedValue({
          mappedIssues: [],
          unmappedCount: 0,
        }),
      };

      const extractedIssueData = [
        {
          issueId: 'issue-001',
          content: 'サーバー障害の対応',
          reportedBy: 'engineer-001',
          reportedAt: new Date('2024-01-15T09:00:00Z'),
          category: 'infrastructure',
        },
      ];

      const toolIntegrationConfig = {
        toolType: 'jira' as const,
        apiEndpoint: 'https://jira.example.com',
        apiKey: 'stub-api-key',
        projectKey: 'PROJ',
      };

      const priorityRules = {
        frequencyWeight: 0.4,
        impactWeight: 0.6,
        highThreshold: 70,
        mediumThreshold: 40,
      };

      const categoryMappings = [
        {
          sourceCategory: 'infrastructure',
          targetCategory: 'Infrastructure',
          toolType: 'jira' as const,
        },
      ];

      const result = await runTx5Imp1Agent(
        {
          extractedIssueData,
          toolIntegrationConfig,
          priorityRules,
          categoryMappings,
        },
        aiClientStub as Tx5Imp1AiClient,
        textAnalysisServiceStub as TextAnalysisServiceAdapter
      );

      expect(result.validatedIssues).toEqual([]);
      expect(result.integrationResult.successCount).toBe(0);
      expect(result.integrationResult.failureCount).toBe(1);
      expect(result.executionSummary.status).toBe('execution_failed');
      expect(mockErrorLogs.some((log) =>
        log.includes('課題の影響度判定結果が null のため処理が中断された')
      )).toBe(true);
    } finally {
      console.error = originalConsoleError;
    }
  });
});