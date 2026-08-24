import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AiClient, Tx5Imp1AgentInput, Tx5Imp1AgentOutput, ExtractedIssue, ToolIntegrationConfig, PriorityRuleSet, CategoryMapping, ValidatedIssue } from '../../src/agents/tx-5-imp-1/types';

// SCEN-1237
describe('tx-5-imp-1: 課題データの一部が欠落している場合に欠落したレコードのみ連携エラーとして記録される', () => {
  let mockAiClient: jest.Mocked<Tx5Imp1AiClient>;
  let errorLogRecords: Array<{ recordId: string; errorContent: string; recordedAt: string }> = [];
  let keywordDictionaryRecords: ValidatedIssue[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    errorLogRecords = [];
    keywordDictionaryRecords = [];

    mockAiClient = {
      analyzeAndValidateIssues: jest.fn(),
      validateIssuePriority: jest.fn(),
      determineToolIntegrationCategory: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should record only incomplete records to error log while successfully storing complete records to keyword dictionary', async () => {
    const completeIssue1: ExtractedIssue = {
      issueId: 'issue-001',
      keyword: 'データベース接続エラー',
      frequency: 3,
      impactScore: 75,
      category: 'Infrastructure',
    };

    const completeIssue2: ExtractedIssue = {
      issueId: 'issue-002',
      keyword: 'メモリリーク',
      frequency: 2,
      impactScore: 85,
      category: 'Code Quality',
    };

    const completeIssue3: ExtractedIssue = {
      issueId: 'issue-003',
      keyword: 'テストカバレッジ低下',
      frequency: 4,
      impactScore: 60,
      category: 'Testing',
    };

    const incompleteIssue1: ExtractedIssue = {
      issueId: 'issue-004',
      keyword: '',
      frequency: 1,
      impactScore: 50,
      category: 'Documentation',
    };

    const incompleteIssue2: ExtractedIssue = {
      issueId: 'issue-005',
      keyword: '',
      frequency: 2,
      impactScore: 40,
      category: 'Performance',
    };

    const extractedIssueData: ExtractedIssue[] = [
      completeIssue1,
      completeIssue2,
      completeIssue3,
      incompleteIssue1,
      incompleteIssue2,
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://jira.example.com/rest/api/3',
      projectKey: 'PROJ',
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 75,
      mediumThreshold: 50,
    };

    const categoryMappings: CategoryMapping[] = [
      { sourceName: 'Infrastructure', targetName: 'Infra', targetToolId: 'cat-infra' },
      { sourceName: 'Code Quality', targetName: 'Quality', targetToolId: 'cat-quality' },
      { sourceName: 'Testing', targetName: 'Test', targetToolId: 'cat-test' },
      { sourceName: 'Documentation', targetName: 'Docs', targetToolId: 'cat-docs' },
      { sourceName: 'Performance', targetName: 'Perf', targetToolId: 'cat-perf' },
    ];

    const input: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    mockAiClient.analyzeAndValidateIssues.mockImplementation(async (issues) => {
      const results = issues.map((issue) => {
        if (!issue.keyword || issue.keyword.trim() === '') {
          throw new Error('キーワードが存在しません');
        }
        const priorityScore =
          issue.frequency * priorityRules.frequencyWeight +
          issue.impactScore * priorityRules.impactWeight;
        const priorityRank =
          priorityScore >= priorityRules.highThreshold
            ? 'high'
            : priorityScore >= priorityRules.mediumThreshold
              ? 'medium'
              : 'low';
        return {
          issueId: issue.issueId,
          priorityScore: Math.round(priorityScore),
          priorityRank,
          category: issue.category,
          validationStatus: 'valid' as const,
        };
      });
      return results;
    });

    mockAiClient.validateIssuePriority.mockImplementation(async (issue) => {
      return {
        issueId: issue.issueId,
        isValid: issue.keyword !== '',
        confidenceScore: issue.keyword !== '' ? 0.95 : 0.0,
      };
    });

    mockAiClient.determineToolIntegrationCategory.mockImplementation(async (issue, mappings) => {
      const mapping = mappings.find((m) => m.sourceName === issue.category);
      return {
        issueId: issue.issueId,
        targetCategory: mapping?.targetName || issue.category,
        toolCategoryId: mapping?.targetToolId || '',
      };
    });

    const result = await runTx5Imp1Agent(input, mockAiClient);

    const completeResults = result.validatedIssues.filter(
      (issue) => issue.validationStatus === 'valid'
    );
    expect(completeResults).toHaveLength(3);
    expect(completeResults.map((r) => r.issueId)).toEqual(['issue-001', 'issue-002', 'issue-003']);

    keywordDictionaryRecords = completeResults;
    expect(keywordDictionaryRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          issueId: 'issue-001',
          priorityScore: expect.any(Number),
          validationStatus: 'valid',
        }),
        expect.objectContaining({
          issueId: 'issue-002',
          priorityScore: expect.any(Number),
          validationStatus: 'valid',
        }),
        expect.objectContaining({
          issueId: 'issue-003',
          priorityScore: expect.any(Number),
          validationStatus: 'valid',
        }),
      ])
    );

    expect(result.integrationResult.failedCount).toBeGreaterThanOrEqual(2);
    expect(result.integrationResult.issues).toBeDefined();

    const failedIssueIds = result.integrationResult.issues
      .filter((issue: any) => !issue.success)
      .map((issue: any) => issue.issueId);
    expect(failedIssueIds).toContain('issue-004');
    expect(failedIssueIds).toContain('issue-005');

    result.integrationResult.issues.forEach((issue: any) => {
      if (!issue.success) {
        if (issue.issueId === 'issue-004' || issue.issueId === 'issue-005') {
          expect(issue.errorMessage).toMatch(/キーワード/);
        }
      }
    });

    expect(result.executionSummary.status).toBe('partial_failure');
    expect(result.executionSummary.totalProcessed).toBeGreaterThanOrEqual(5);
    expect(result.executionSummary.successCount).toBe(3);
    expect(result.executionSummary.failureCount).toBeGreaterThanOrEqual(2);
  });
});