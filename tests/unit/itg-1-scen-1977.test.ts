import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput } from '../../src/agents/tx-8-imp-1/types';

describe('tx-8-imp-1: ボトルネック変化パターン可視化レポート生成', () => {
  // SCEN-1977
  test('課題の発生頻度が変動する場合、適切なグラフ形式が自動選択される', async () => {
    const input: Tx8AgentInput = {
      analysisStartDate: '2024-11-01',
      analysisEndDate: '2024-11-30',
      teamIds: ['team-001'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'manager-001',
    };

    const mockTextAnalysisClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'データベース接続エラー',
            occurrenceCount: 18,
            weeklyPattern: [
              { week: 1, count: 2 },
              { week: 2, count: 5 },
              { week: 3, count: 3 },
              { week: 4, count: 8 },
            ],
          },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impacts: [
          {
            keyword: 'データベース接続エラー',
            impactScore: 78,
          },
        ],
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        classifications: [
          {
            keyword: 'データベース接続エラー',
            severity: 'high',
          },
        ],
      }),
    };

    const result: Tx8AgentOutput = await runTx8Imp1Agent(input, mockTextAnalysisClient);

    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);

    expect(Array.isArray(result.recurringIssuePatterns)).toBe(true);
    expect(result.recurringIssuePatterns.length).toBeGreaterThan(0);

    const databaseIssuePattern = result.recurringIssuePatterns.find(
      (pattern) => pattern.issueKeyword === 'データベース接続エラー'
    );
    expect(databaseIssuePattern).toBeDefined();
    expect(databaseIssuePattern!.occurrenceCount).toBe(18);
    expect(databaseIssuePattern!.timeSeriesPattern).toBe('増加傾向');
    expect(databaseIssuePattern!.priorityScore).toBe(78);

    expect(Array.isArray(result.visualizationGraphs)).toBe(true);
    expect(result.visualizationGraphs.length).toBeGreaterThan(0);

    const lineChartGraph = result.visualizationGraphs.find(
      (graph) => graph.graphType === 'lineChart'
    );
    expect(lineChartGraph).toBeDefined();
    expect(lineChartGraph!.title).toContain('発生頻度の推移');
    expect(Array.isArray(lineChartGraph!.dataPoints)).toBe(true);
    expect(lineChartGraph!.dataPoints.length).toBe(4);

    const expectedDataPoints = [
      { week: 1, count: 2 },
      { week: 2, count: 5 },
      { week: 3, count: 3 },
      { week: 4, count: 8 },
    ];
    expect(lineChartGraph!.dataPoints).toEqual(expectedDataPoints);

    expect(result.emailSentAt).toBeDefined();
    expect(typeof result.emailSentAt).toBe('string');
    const emailSentDate = new Date(result.emailSentAt);
    expect(emailSentDate.getTime()).toBeGreaterThan(0);

    expect(mockTextAnalysisClient.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisClient.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisClient.classifyIssueSeverity).toHaveBeenCalled();
  });
});