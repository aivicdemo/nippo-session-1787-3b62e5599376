import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ExtractedIssue,
  ValidatedIssue,
  ToolIntegrationResult,
  ExecutionSummary,
} from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題データの既存ツール連携', () => {
  // SCEN-1211: [normal] 既存ツール連携機能 - 課題データが既存ツールに欠落なく完全に連携される
  test('should validate and integrate extracted issues to external tool without data loss', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        if (text.includes('バグ修正対応')) {
          return Promise.resolve({
            keywords: ['バグ', '修正'],
            frequency: { バグ: 1, 修正: 1 },
          });
        }
        if (text.includes('機能開発')) {
          return Promise.resolve({
            keywords: ['機能開発'],
            frequency: { 機能開発: 1 },
          });
        }
        if (text.includes('リソース不足')) {
          return Promise.resolve({
            keywords: ['リソース不足', 'スケジュール遅延'],
            frequency: { リソース不足: 1, スケジュール遅延: 1 },
          });
        }
        return Promise.resolve({
          keywords: [],
          frequency: {},
        });
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        const scoreMap: Record<string, number> = {
          バグ: 75,
          修正: 60,
          機能開発: 45,
          リソース不足: 85,
          スケジュール遅延: 80,
        };
        return Promise.resolve(scoreMap[keyword] || 50);
      }),
      classifyIssueSeverity: jest.fn((keyword: string) => {
        const severityMap: Record<string, 'high' | 'medium' | 'low'> = {
          バグ: 'high',
          修正: 'medium',
          機能開発: 'low',
          リソース不足: 'high',
          スケジュール遅延: 'high',
        };
        return Promise.resolve(severityMap[keyword] || 'medium');
      }),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(() =>
        Promise.resolve({ status: 'delivered', timestamp: new Date().toISOString() })
      ),
      scheduleNotification: jest.fn(() => Promise.resolve({ scheduled: true })),
      getDeliveryStatus: jest.fn(() =>
        Promise.resolve({ status: 'delivered' })
      ),
    };

    const toolIntegrationConfig = {
      toolType: 'jira' as const,
      apiEndpoint: 'https://jira.example.com/rest/api/2',
      apiToken: 'test-token',
      projectKey: 'TEST',
    };

    const priorityRules = {
      frequencyWeight: 0.3,
      impactWeight: 0.7,
      highThreshold: 75,
      mediumThreshold: 50,
    };

    const categoryMappings = [
      {
        reportingCategory: 'バグ',
        toolCategory: 'Bug',
        severity: 'high' as const,
      },
      {
        reportingCategory: 'リソース不足',
        toolCategory: 'Task',
        severity: 'high' as const,
      },
      {
        reportingCategory: 'スケジュール遅延',
        toolCategory: 'Task',
        severity: 'high' as const,
      },
      {
        reportingCategory: '機能開発',
        toolCategory: 'Story',
        severity: 'low' as const,
      },
    ];

    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: 'issue-001',
        text: '昨日：バグ修正対応',
        detectedKeywords: ['バグ', '修正'],
        reportingDate: '2024-01-15',
        reporterId: 'eng-001',
      },
      {
        issueId: 'issue-002',
        text: '今日：機能開発',
        detectedKeywords: ['機能開発'],
        reportingDate: '2024-01-15',
        reporterId: 'eng-002',
      },
      {
        issueId: 'issue-003',
        text: '課題：リソース不足でスケジュール遅延リスク',
        detectedKeywords: ['リソース不足', 'スケジュール遅延'],
        reportingDate: '2024-01-15',
        reporterId: 'eng-003',
      },
    ];

    const input: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input, {
      textAnalysisAdapter: mockTextAnalysisAdapter,
      notificationAdapter: mockNotificationAdapter,
    });

    expect(result.validatedIssues).toBeDefined();
    expect(Array.isArray(result.validatedIssues)).toBe(true);
    expect(result.validatedIssues.length).toBe(5);

    const validatedKeywords = result.validatedIssues.map((v) => v.category);
    expect(validatedKeywords).toContain('Bug');
    expect(validatedKeywords).toContain('Story');
    expect(validatedKeywords).toContain('Task');

    const highPriorityIssues = result.validatedIssues.filter(
      (v) => v.priorityRank === 'high'
    );
    expect(highPriorityIssues.length).toBeGreaterThanOrEqual(2);

    const mediumPriorityIssues = result.validatedIssues.filter(
      (v) => v.priorityRank === 'medium'
    );
    expect(mediumPriorityIssues.length).toBeGreaterThanOrEqual(1);

    const lowPriorityIssues = result.validatedIssues.filter(
      (v) => v.priorityRank === 'low'
    );
    expect(lowPriorityIssues.length).toBeGreaterThanOrEqual(1);

    result.validatedIssues.forEach((issue) => {
      expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);
      expect(['high', 'medium', 'low']).toContain(issue.priorityRank);
      expect(['valid', 'warning', 'invalid']).toContain(issue.validationStatus);
    });

    expect(result.integrationResult).toBeDefined();
    expect(result.integrationResult.successCount).toBeGreaterThanOrEqual(0);
    expect(result.integrationResult.failureCount).toBeGreaterThanOrEqual(0);
    expect(result.integrationResult.successCount + result.integrationResult.failureCount).toBe(
      result.validatedIssues.length
    );

    expect(result.executionSummary).toBeDefined();
    expect(result.executionSummary.executionStartTime).toBeDefined();
    expect(result.executionSummary.executionEndTime).toBeDefined();
    expect(result.executionSummary.status).toMatch(/success|partial_failure|failure/);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).toHaveBeenCalled();
  });
});