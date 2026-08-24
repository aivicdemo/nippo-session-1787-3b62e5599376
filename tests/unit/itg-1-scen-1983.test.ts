import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1: ボトルネック変化パターン可視化レポート生成', () => {
  test('SCEN-1983: 解決期間が不規則に変動する場合、適切なグラフ形式が自動選択される', async () => {
    const bottleneckDataPoints = [
      { sequenceOrder: 1, resolutionDays: 3 },
      { sequenceOrder: 2, resolutionDays: 8 },
      { sequenceOrder: 3, resolutionDays: 2 },
      { sequenceOrder: 4, resolutionDays: 15 },
      { sequenceOrder: 5, resolutionDays: 5 },
      { sequenceOrder: 6, resolutionDays: 12 },
      { sequenceOrder: 7, resolutionDays: 1 },
      { sequenceOrder: 8, resolutionDays: 20 },
      { sequenceOrder: 9, resolutionDays: 4 },
      { sequenceOrder: 10, resolutionDays: 18 },
    ];

    const mockAiClient = {
      analyzeBottleneckPattern: jest.fn().mockResolvedValue({
        selectedGraphType: 'LineChart',
        timeSeriesPattern: 'irregular_variation',
        confidenceScore: 0.92,
      }),
      extractBottleneckKeywords: jest.fn().mockResolvedValue([
        { keyword: 'performance_degradation', frequency: 8, impactScore: 78 },
        { keyword: 'resource_constraint', frequency: 6, impactScore: 65 },
      ]),
      generateVisualizationData: jest.fn().mockResolvedValue({
        graphType: 'LineChart',
        title: 'ボトルネック解決期間の推移',
        xAxisLabel: 'ボトルネック順序',
        yAxisLabel: '解決期間（日）',
        dataPoints: [
          { x: 1, y: 3, label: '1' },
          { x: 2, y: 8, label: '2' },
          { x: 3, y: 2, label: '3' },
          { x: 4, y: 15, label: '4' },
          { x: 5, y: 5, label: '5' },
          { x: 6, y: 12, label: '6' },
          { x: 7, y: 1, label: '7' },
          { x: 8, y: 20, label: '8' },
          { x: 9, y: 4, label: '9' },
          { x: 10, y: 18, label: '10' },
        ],
      }),
      generateReportMetadata: jest.fn().mockResolvedValue({
        reportId: 'report-20240115-001',
        generatedAt: '2024-01-15T09:30:00Z',
        analysisMethod: 'time_series_variation_detection',
      }),
    };

    const input = {
      analysisStartDate: '2024-01-01T00:00:00Z',
      analysisEndDate: '2024-01-31T23:59:59Z',
      teamIds: ['team-001'],
      minimumRecurrenceThreshold: 2,
      recipientManagerId: 'manager-001',
      bottleneckDataInput: bottleneckDataPoints,
    };

    const result = await runTx8Imp1Agent(input, mockAiClient);

    expect(result).toBeDefined();
    expect(result.reportId).toBe('report-20240115-001');
    expect(result.visualizationGraphs).toBeDefined();
    expect(result.visualizationGraphs.length).toBeGreaterThan(0);

    const lineChart = result.visualizationGraphs.find(
      (graph: any) => graph.graphType === 'LineChart'
    );
    expect(lineChart).toBeDefined();
    expect(lineChart.title).toBe('ボトルネック解決期間の推移');
    expect(lineChart.dataPoints).toBeDefined();
    expect(lineChart.dataPoints.length).toBe(10);

    const expectedYValues = [3, 8, 2, 15, 5, 12, 1, 20, 4, 18];
    lineChart.dataPoints.forEach((point: any, index: number) => {
      expect(point.y).toBe(expectedYValues[index]);
      expect(point.x).toBe(index + 1);
    });

    expect(lineChart.dataPoints[0].y).toBe(3);
    expect(lineChart.dataPoints[1].y).toBe(8);
    expect(lineChart.dataPoints[2].y).toBe(2);
    expect(lineChart.dataPoints[3].y).toBe(15);
    expect(lineChart.dataPoints[4].y).toBe(5);
    expect(lineChart.dataPoints[5].y).toBe(12);
    expect(lineChart.dataPoints[6].y).toBe(1);
    expect(lineChart.dataPoints[7].y).toBe(20);
    expect(lineChart.dataPoints[8].y).toBe(4);
    expect(lineChart.dataPoints[9].y).toBe(18);

    expect(result.recurringIssuePatterns).toBeDefined();
    expect(result.recurringIssuePatterns.length).toBeGreaterThan(0);

    const performanceDegradationPattern = result.recurringIssuePatterns.find(
      (pattern: any) => pattern.issueKeyword === 'performance_degradation'
    );
    expect(performanceDegradationPattern).toBeDefined();
    expect(performanceDegradationPattern.occurrenceCount).toBe(8);
    expect(performanceDegradationPattern.priorityScore).toBe(78);

    expect(result.emailSentAt).toBeDefined();
    expect(typeof result.emailSentAt).toBe('string');
    expect(result.emailSentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    expect(mockAiClient.analyzeBottleneckPattern).toHaveBeenCalled();
    expect(mockAiClient.generateVisualizationData).toHaveBeenCalled();
    expect(mockAiClient.generateReportMetadata).toHaveBeenCalled();
  });
});