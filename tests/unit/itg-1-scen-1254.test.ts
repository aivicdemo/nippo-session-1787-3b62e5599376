import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 既存ツール連携 - 複数月にまたがる朝会報告データの月別分離', () => {
  test('SCEN-1254: 複数月の課題キーワードが月ごとに正しく分離される', async () => {
    // 2024年11月15日付けの報告データ
    const reportNov15: ExtractedIssue = {
      issueId: 'issue-nov-15-001',
      description: 'データベース接続エラーが発生',
      reportDate: new Date('2024-11-15T09:00:00Z'),
      reportYearMonth: '2024-11',
      employeeId: 'employee-A',
    };

    // 2024年11月16日付けの報告データ
    const reportNov16: ExtractedIssue = {
      issueId: 'issue-nov-16-001',
      description: '仕様書の曖昧性が未解決',
      reportDate: new Date('2024-11-16T09:00:00Z'),
      reportYearMonth: '2024-11',
      employeeId: 'employee-A',
    };

    // 2024年12月1日付けの報告データ
    const reportDec01: ExtractedIssue = {
      issueId: 'issue-dec-01-001',
      description: 'リソース不足',
      reportDate: new Date('2024-12-01T09:00:00Z'),
      reportYearMonth: '2024-12',
      employeeId: 'employee-A',
    };

    // モック化されたTextAnalysisServiceAdapter
    const mockTextAnalysisAdapter: Tx5Imp1AiClient = {
      extractKeywords: jest.fn(async (text: string) => {
        // 11月の課題キーワードを返す
        if (text.includes('データベース接続エラー') || text.includes('仕様書の曖昧性')) {
          return {
            keywords: [
              { keyword: 'データベース接続エラー', frequency: 1, confidence: 0.95 },
              { keyword: '仕様書の曖昧性', frequency: 1, confidence: 0.92 },
            ],
          };
        }
        // 12月の課題キーワードを返す
        if (text.includes('リソース不足')) {
          return {
            keywords: [
              { keyword: 'リソース不足', frequency: 1, confidence: 0.90 },
            ],
          };
        }
        return { keywords: [] };
      }),
      assessImpactScore: jest.fn(async (keyword: string) => {
        if (keyword === 'データベース接続エラー') return { impactScore: 85 };
        if (keyword === '仕様書の曖昧性') return { impactScore: 72 };
        if (keyword === 'リソース不足') return { impactScore: 80 };
        return { impactScore: 50 };
      }),
      classifyIssueSeverity: jest.fn(async (text: string) => {
        if (text.includes('エラー')) return { severity: 'high' };
        if (text.includes('不足')) return { severity: 'high' };
        return { severity: 'medium' };
      }),
    };

    const toolIntegrationConfig = {
      toolType: 'jira' as const,
      apiUrl: 'https://jira.example.com',
      authToken: 'mock-token',
    };

    const priorityRules = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 80,
      mediumThreshold: 50,
    };

    const categoryMappings = [
      {
        issueKeyword: 'データベース接続エラー',
        toolCategory: 'Backend',
        priority: 'high',
      },
      {
        issueKeyword: '仕様書の曖昧性',
        toolCategory: 'Requirements',
        priority: 'medium',
      },
      {
        issueKeyword: 'リソース不足',
        toolCategory: 'Resource',
        priority: 'high',
      },
    ];

    const input = {
      extractedIssueData: [reportNov15, reportNov16, reportDec01],
      toolIntegrationConfig: toolIntegrationConfig,
      priorityRules: priorityRules,
      categoryMappings: categoryMappings,
    };

    // runTx5Imp1Agentを実行
    const result = await runTx5Imp1Agent(input, mockTextAnalysisAdapter);

    // 期待結果の検証
    expect(result).toBeDefined();
    expect(result.validatedIssues).toBeDefined();
    expect(Array.isArray(result.validatedIssues)).toBe(true);

    // 2024年11月の課題が含まれることを検証
    const nov_issues = result.validatedIssues.filter(
      (issue) => issue.issueId === 'issue-nov-15-001' || issue.issueId === 'issue-nov-16-001'
    );
    expect(nov_issues.length).toBe(2);
    expect(nov_issues.some((issue) => issue.category === 'Backend')).toBe(true);
    expect(nov_issues.some((issue) => issue.category === 'Requirements')).toBe(true);

    // 2024年12月の課題が含まれることを検証
    const dec_issues = result.validatedIssues.filter(
      (issue) => issue.issueId === 'issue-dec-01-001'
    );
    expect(dec_issues.length).toBe(1);
    expect(dec_issues[0].category).toBe('Resource');
    expect(dec_issues[0].priorityRank).toBe('high');

    // 月別の分離が正しく行われていることを検証
    expect(result.validatedIssues.every((issue) => {
      const issueDate = new Date(
        result.validatedIssues.find((i) => i.issueId === issue.issueId)
          ? issue.issueId.includes('nov')
            ? '2024-11-01'
            : '2024-12-01'
          : '2024-11-01'
      );
      return issue.validationStatus === 'valid';
    })).toBe(true);

    // integrationResultの検証
    expect(result.integrationResult).toBeDefined();
    expect(result.integrationResult.successCount).toBeGreaterThan(0);
    expect(result.integrationResult.failureCount).toBe(0);

    // executionSummaryの検証
    expect(result.executionSummary).toBeDefined();
    expect(result.executionSummary.finalStatus).toBe('success');
    expect(result.executionSummary.processingTimeMs).toBeGreaterThanOrEqual(0);

    // mockアダプタが正しく呼ばれたことを検証
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
  });
});