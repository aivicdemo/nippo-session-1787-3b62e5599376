import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AgentInput, Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1 agent orchestrator', () => {
  // SCEN-1226: [error] 既存ツール連携機能 - 課題の影響度判定結果が空文字のとき処理が中断される
  test('should handle empty impact severity from text analysis service and rollback with error message', async () => {
    const extractedIssueData = [
      {
        issueId: 'issue-001',
        title: 'Database Connection Timeout',
        description: 'データベース接続タイムアウトが頻発している',
        reportedBy: 'eng-001',
        reportedAt: new Date('2024-01-15T08:00:00Z'),
      },
    ];

    const toolIntegrationConfig = {
      toolType: 'jira' as const,
      apiEndpoint: 'https://jira.example.com/api/v3',
      projectKey: 'DEV',
    };

    const priorityRules = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highFrequencyThreshold: 3,
      highImpactThreshold: 70,
    };

    const categoryMappings = [
      {
        systemCategory: 'infrastructure',
        toolCategory: 'DEV-INFRA',
      },
    ];

    const input: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    const stubTextAnalysisClient: Tx5Imp1AiClient = {
      extractKeywords: async () => ({
        keywords: [
          { keyword: 'timeout', frequency: 5 },
          { keyword: 'database', frequency: 4 },
        ],
      }),
      assessImpactScore: async () => ({
        impactScore: 85,
      }),
      classifyIssueSeverity: async () => ({
        severity: '',
      }),
    };

    const output = await runTx5Imp1Agent(input, stubTextAnalysisClient);

    expect(output.validationResult).toBeDefined();
    expect(output.validationResult.failedCount).toBeGreaterThan(0);
    expect(output.integrationStatus).toBe('partial_failure');
    expect(output.systemNotification).toContain('課題分析が一時的に利用できません');
    expect(output.errorLog).toMatch(/classifyIssueSeverity returned empty string/);
    expect(output.rollbackExecuted).toBe(true);
    expect(output.confirmationEmailSent).toBe(false);
  });
});