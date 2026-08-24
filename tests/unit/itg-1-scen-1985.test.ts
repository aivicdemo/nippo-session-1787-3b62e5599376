import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput, type RecurringIssuePattern, type VisualizationGraph } from '../../src/agents/tx-8-imp-1/types';

describe('tx-8-imp-1: Recurring Issue Pattern Visualization Report Generation', () => {
  // SCEN-1985
  test('should generate identical report content when executed twice with same analysis data', async () => {
    const analysisStartDate = '2024-01-01T00:00:00Z';
    const analysisEndDate = '2024-01-31T23:59:59Z';
    const teamIds = ['team-001', 'team-002'];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = 'manager-001';

    const mockRecurringPatterns: RecurringIssuePattern[] = [
      {
        issueKeyword: 'データベース接続タイムアウト',
        occurrenceCount: 12,
        timeSeriesPattern: '増加傾向',
        priorityScore: 92,
      },
      {
        issueKeyword: 'API応答遅延',
        occurrenceCount: 8,
        timeSeriesPattern: '周期的',
        priorityScore: 78,
      },
      {
        issueKeyword: 'メモリリーク',
        occurrenceCount: 5,
        timeSeriesPattern: '急増',
        priorityScore: 85,
      },
    ];

    const mockVisualizationGraphs: VisualizationGraph[] = [
      {
        graphType: '折れ線',
        title: '課題発生数の時系列推移',
        dataPoints: [
          { date: '2024-01-01', count: 2 },
          { date: '2024-01-08', count: 5 },
          { date: '2024-01-15', count: 8 },
          { date: '2024-01-22', count: 12 },
          { date: '2024-01-29', count: 15 },
        ],
      },
      {
        graphType: '棒',
        title: 'キーワード別課題発生数',
        dataPoints: [
          { keyword: 'データベース接続タイムアウト', frequency: 12 },
          { keyword: 'メモリリーク', frequency: 5 },
          { keyword: 'API応答遅延', frequency: 8 },
        ],
      },
      {
        graphType: '円',
        title: '優先度別課題分布',
        dataPoints: [
          { priorityLevel: '高', percentage: 60 },
          { priorityLevel: '中', percentage: 30 },
          { priorityLevel: '低', percentage: 10 },
        ],
      },
    ];

    const stubAiClient = {
      analyzeRecurringPatterns: jest.fn().mockResolvedValue({
        recurringPatterns: mockRecurringPatterns,
        visualizationGraphs: mockVisualizationGraphs,
      }),
    };

    const input: Tx8AgentInput = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    const firstExecutionResult: Tx8AgentOutput = await runTx8Imp1Agent(input, stubAiClient);

    const firstReportId = firstExecutionResult.reportId;
    const firstRecurringIssuePatterns = firstExecutionResult.recurringIssuePatterns;
    const firstVisualizationGraphs = firstExecutionResult.visualizationGraphs;
    const firstEmailSentAt = firstExecutionResult.emailSentAt;

    expect(firstReportId).toBeDefined();
    expect(firstReportId).toMatch(/^report-/);
    expect(firstRecurringIssuePatterns).toHaveLength(3);
    expect(firstRecurringIssuePatterns[0].issueKeyword).toBe('データベース接続タイムアウト');
    expect(firstRecurringIssuePatterns[0].occurrenceCount).toBe(12);
    expect(firstRecurringIssuePatterns[0].timeSeriesPattern).toBe('増加傾向');
    expect(firstRecurringIssuePatterns[0].priorityScore).toBe(92);
    expect(firstRecurringIssuePatterns[1].issueKeyword).toBe('API応答遅延');
    expect(firstRecurringIssuePatterns[1].occurrenceCount).toBe(8);
    expect(firstRecurringIssuePatterns[1].priorityScore).toBe(78);
    expect(firstRecurringIssuePatterns[2].issueKeyword).toBe('メモリリーク');
    expect(firstRecurringIssuePatterns[2].occurrenceCount).toBe(5);
    expect(firstRecurringIssuePatterns[2].priorityScore).toBe(85);
    expect(firstVisualizationGraphs).toHaveLength(3);
    expect(firstVisualizationGraphs[0].graphType).toBe('折れ線');
    expect(firstVisualizationGraphs[0].title).toBe('課題発生数の時系列推移');
    expect(firstVisualizationGraphs[0].dataPoints).toHaveLength(5);
    expect(firstVisualizationGraphs[1].graphType).toBe('棒');
    expect(firstVisualizationGraphs[2].graphType).toBe('円');
    expect(firstEmailSentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    stubAiClient.analyzeRecurringPatterns.mockClear();
    stubAiClient.analyzeRecurringPatterns.mockResolvedValue({
      recurringPatterns: mockRecurringPatterns,
      visualizationGraphs: mockVisualizationGraphs,
    });

    const secondExecutionResult: Tx8AgentOutput = await runTx8Imp1Agent(input, stubAiClient);

    const secondReportId = secondExecutionResult.reportId;
    const secondRecurringIssuePatterns = secondExecutionResult.recurringIssuePatterns;
    const secondVisualizationGraphs = secondExecutionResult.visualizationGraphs;

    expect(secondRecurringIssuePatterns).toHaveLength(firstRecurringIssuePatterns.length);
    expect(secondRecurringIssuePatterns[0].issueKeyword).toBe(firstRecurringIssuePatterns[0].issueKeyword);
    expect(secondRecurringIssuePatterns[0].occurrenceCount).toBe(firstRecurringIssuePatterns[0].occurrenceCount);
    expect(secondRecurringIssuePatterns[0].timeSeriesPattern).toBe(firstRecurringIssuePatterns[0].timeSeriesPattern);
    expect(secondRecurringIssuePatterns[0].priorityScore).toBe(firstRecurringIssuePatterns[0].priorityScore);
    expect(secondRecurringIssuePatterns[1].issueKeyword).toBe(firstRecurringIssuePatterns[1].issueKeyword);
    expect(secondRecurringIssuePatterns[1].occurrenceCount).toBe(firstRecurringIssuePatterns[1].occurrenceCount);
    expect(secondRecurringIssuePatterns[1].priorityScore).toBe(firstRecurringIssuePatterns[1].priorityScore);
    expect(secondRecurringIssuePatterns[2].issueKeyword).toBe(firstRecurringIssuePatterns[2].issueKeyword);
    expect(secondRecurringIssuePatterns[2].occurrenceCount).toBe(firstRecurringIssuePatterns[2].occurrenceCount);
    expect(secondRecurringIssuePatterns[2].priorityScore).toBe(firstRecurringIssuePatterns[2].priorityScore);

    expect(secondVisualizationGraphs).toHaveLength(firstVisualizationGraphs.length);
    expect(secondVisualizationGraphs[0].graphType).toBe(firstVisualizationGraphs[0].graphType);
    expect(secondVisualizationGraphs[0].title).toBe(firstVisualizationGraphs[0].title);
    expect(secondVisualizationGraphs[0].dataPoints).toEqual(firstVisualizationGraphs[0].dataPoints);
    expect(secondVisualizationGraphs[1].graphType).toBe(firstVisualizationGraphs[1].graphType);
    expect(secondVisualizationGraphs[1].title).toBe(firstVisualizationGraphs[1].title);
    expect(secondVisualizationGraphs[1].dataPoints).toEqual(firstVisualizationGraphs[1].dataPoints);
    expect(secondVisualizationGraphs[2].graphType).toBe(firstVisualizationGraphs[2].graphType);
    expect(secondVisualizationGraphs[2].title).toBe(firstVisualizationGraphs[2].title);
    expect(secondVisualizationGraphs[2].dataPoints).toEqual(firstVisualizationGraphs[2].dataPoints);

    expect(secondReportId).toBeDefined();
    expect(secondReportId).toMatch(/^report-/);
  });
});