import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8AgentInput, Tx8AgentOutput, RecurringIssuePattern, VisualizationGraph } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1: ボトルネック変化パターン可視化レポート生成機能', () => {
  test('SCEN-2008: 影響度スコアがちょうど閾値（50/100）のとき、ボトルネック重大と判定される', async () => {
    const analysisStartDate = '2024-01-01T00:00:00Z';
    const analysisEndDate = '2024-01-31T23:59:59Z';
    const teamIds = ['team-001', 'team-002'];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = 'manager-001';

    const testInput: Tx8AgentInput = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    const mockAiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'データベース接続エラー',
            frequency: 5,
            confidence: 0.92,
          },
        ],
      }),

      assessImpactScore: jest.fn().mockResolvedValue({
        score: 50,
        confidence: 0.95,
        severity: 'critical',
      }),

      analyzeTimeSeriesPattern: jest.fn().mockResolvedValue({
        pattern: '増加傾向',
        confidence: 0.88,
      }),

      generateVisualizationGraphs: jest.fn().mockResolvedValue([
        {
          graphType: '折れ線',
          title: 'データベース接続エラー発生频度の推移',
          dataPoints: [
            { date: '2024-01-01', count: 1 },
            { date: '2024-01-15', count: 3 },
            { date: '2024-01-31', count: 5 },
          ],
        },
        {
          graphType: 'ヒートマップ',
          title: 'チーム別影響度分析',
          dataPoints: [
            { teamId: 'team-001', severity: 'high', count: 3 },
            { teamId: 'team-002', severity: 'critical', count: 2 },
          ],
        },
      ]),
    };

    const result: Tx8AgentOutput = await runTx8Imp1Agent(testInput, mockAiClient);

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);

    expect(result.recurringIssuePatterns).toBeDefined();
    expect(Array.isArray(result.recurringIssuePatterns)).toBe(true);
    expect(result.recurringIssuePatterns.length).toBeGreaterThan(0);

    const bottleneckPattern = result.recurringIssuePatterns.find(
      (pattern: RecurringIssuePattern) =>
        pattern.issueKeyword === 'データベース接続エラー'
    );

    expect(bottleneckPattern).toBeDefined();
    expect(bottleneckPattern?.occurrenceCount).toBe(5);
    expect(bottleneckPattern?.priorityScore).toBe(50);
    expect(bottleneckPattern?.timeSeriesPattern).toBe('増加傾向');

    expect(result.visualizationGraphs).toBeDefined();
    expect(Array.isArray(result.visualizationGraphs)).toBe(true);
    expect(result.visualizationGraphs.length).toBeGreaterThanOrEqual(2);

    const lineGraph = result.visualizationGraphs.find(
      (g: VisualizationGraph) => g.graphType === '折れ線'
    );
    expect(lineGraph).toBeDefined();
    expect(lineGraph?.title).toBe('データベース接続エラー発生频度の推移');
    expect(lineGraph?.dataPoints).toHaveLength(3);

    const heatmapGraph = result.visualizationGraphs.find(
      (g: VisualizationGraph) => g.graphType === 'ヒートマップ'
    );
    expect(heatmapGraph).toBeDefined();
    expect(heatmapGraph?.title).toBe('チーム別影響度分析');

    expect(result.emailSentAt).toBeDefined();
    expect(typeof result.emailSentAt).toBe('string');
    const emailSentDate = new Date(result.emailSentAt);
    expect(emailSentDate.getTime()).toBeGreaterThan(0);
    expect(emailSentDate.getTime()).toBeLessThanOrEqual(new Date().getTime());

    expect(mockAiClient.assessImpactScore).toHaveBeenCalled();
    const impactScoreCall = mockAiClient.assessImpactScore.mock.calls[0];
    expect(impactScoreCall).toBeDefined();

    const criticalPatterns = result.recurringIssuePatterns.filter(
      (pattern: RecurringIssuePattern) => pattern.priorityScore >= 50
    );
    expect(criticalPatterns.length).toBeGreaterThan(0);
    expect(
      criticalPatterns.some(
        (pattern: RecurringIssuePattern) =>
          pattern.issueKeyword === 'データベース接続エラー'
      )
    ).toBe(true);
  });
});