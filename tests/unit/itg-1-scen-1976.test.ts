import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput, type RecurringIssuePattern, type VisualizationGraph } from '../../src/agents/tx-8-imp-1/types';

describe('tx-8-imp-1: 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-1976: [normal] ボトルネック変化パターン可視化レポート生成 - 課題の発生頻度が降順で推移する場合、適切なグラフ形式が自動選択される
  test('should generate visualization report with LINE_CHART format when issue frequency shows descending trend', async () => {
    // Arrange: テストデータの準備
    const analysisStartDate = '2024-01-08T00:00:00Z';
    const analysisEndDate = '2024-01-11T23:59:59Z';
    const teamIds = ['team-001'];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = 'manager-001';

    const input: Tx8AgentInput = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    // モック化されたTextAnalysisServiceAdapter
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: 'DBコネクション障害',
          frequency: 50,
          date: '2024-01-08',
        },
        {
          keyword: 'DBコネクション障害',
          frequency: 35,
          date: '2024-01-09',
        },
        {
          keyword: 'DBコネクション障害',
          frequency: 20,
          date: '2024-01-10',
        },
        {
          keyword: 'DBコネクション障害',
          frequency: 10,
          date: '2024-01-11',
        },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('HIGH'),
    };

    // Act: ボトルネック変化パターン可視化レポート生成機能を実行
    const result = await runTx8Imp1Agent(input, mockTextAnalysisServiceAdapter);

    // Assert: 生成されたレポートの検証
    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);

    // 再発課題パターンの検証
    expect(result.recurringIssuePatterns).toBeDefined();
    expect(Array.isArray(result.recurringIssuePatterns)).toBe(true);
    expect(result.recurringIssuePatterns.length).toBeGreaterThanOrEqual(1);

    const dbConnectionPattern = result.recurringIssuePatterns.find(
      (p: RecurringIssuePattern) => p.issueKeyword === 'DBコネクション障害',
    );
    expect(dbConnectionPattern).toBeDefined();
    expect(dbConnectionPattern.occurrenceCount).toBe(4);
    expect(dbConnectionPattern.timeSeriesPattern).toBe('DESCENDING');
    expect(dbConnectionPattern.priorityScore).toBeGreaterThanOrEqual(0);
    expect(dbConnectionPattern.priorityScore).toBeLessThanOrEqual(100);

    // グラフ形式の自動選択検証
    expect(result.visualizationGraphs).toBeDefined();
    expect(Array.isArray(result.visualizationGraphs)).toBe(true);
    expect(result.visualizationGraphs.length).toBeGreaterThanOrEqual(1);

    // 折れ線グラフ（LINE_CHART）が自動選択されていることを確認
    const lineChartGraph = result.visualizationGraphs.find(
      (g: VisualizationGraph) => g.graphType === 'LINE_CHART',
    );
    expect(lineChartGraph).toBeDefined();
    expect(lineChartGraph.title).toContain('DBコネクション障害');

    // グラフのデータポイント検証
    expect(lineChartGraph.dataPoints).toBeDefined();
    expect(Array.isArray(lineChartGraph.dataPoints)).toBe(true);
    expect(lineChartGraph.dataPoints.length).toBe(4);

    // X軸とY軸のデータポイントを検証
    const expectedDataPoints = [
      { date: '2024-01-08', frequency: 50 },
      { date: '2024-01-09', frequency: 35 },
      { date: '2024-01-10', frequency: 20 },
      { date: '2024-01-11', frequency: 10 },
    ];

    lineChartGraph.dataPoints.forEach((point: any, index: number) => {
      expect(point.date).toBe(expectedDataPoints[index].date);
      expect(point.frequency).toBe(expectedDataPoints[index].frequency);
    });

    // 下降トレンドの視覚化確認
    const frequencies = lineChartGraph.dataPoints.map((p: any) => p.frequency);
    expect(frequencies[0]).toBeGreaterThan(frequencies[1]);
    expect(frequencies[1]).toBeGreaterThan(frequencies[2]);
    expect(frequencies[2]).toBeGreaterThan(frequencies[3]);

    // メタデータの検証
    expect(lineChartGraph.graphType).toBe('LINE_CHART');
    expect(result.emailSentAt).toBeDefined();
    expect(typeof result.emailSentAt).toBe('string');
    expect(new Date(result.emailSentAt).toISOString()).toBe(result.emailSentAt);

    // TextAnalysisServiceAdapterの呼び出し検証
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
  });
});