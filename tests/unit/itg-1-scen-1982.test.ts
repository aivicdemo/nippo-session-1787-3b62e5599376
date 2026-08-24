import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1: 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-1982: [normal] ボトルネック変化パターン可視化レポート生成 - 解決期間が長くなる傾向を示す場合、適切なグラフ形式が自動選択される

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('解決期間の増加傾向を示すデータセットから時系列対応グラフ形式が自動選択されること', async () => {
    // テストデータ準備: 同一チームの複数の日報レコード（5件以上）
    // 各レコードに『解決期間』フィールドを含め、後の日報ほど解決期間が段階的に長くなるデータセット
    const testReportingData = [
      {
        reportId: 'report-001',
        teamId: 'team-A',
        reportDate: '2024-01-01T09:00:00Z',
        issueKeyword: 'Database Connection Timeout',
        resolutionDays: 1,
        impactScore: 65,
        occurrenceCount: 1,
      },
      {
        reportId: 'report-002',
        teamId: 'team-A',
        reportDate: '2024-01-08T09:00:00Z',
        issueKeyword: 'Database Connection Timeout',
        resolutionDays: 3,
        impactScore: 68,
        occurrenceCount: 2,
      },
      {
        reportId: 'report-003',
        teamId: 'team-A',
        reportDate: '2024-01-15T09:00:00Z',
        issueKeyword: 'Database Connection Timeout',
        resolutionDays: 7,
        impactScore: 72,
        occurrenceCount: 3,
      },
      {
        reportId: 'report-004',
        teamId: 'team-A',
        reportDate: '2024-01-22T09:00:00Z',
        issueKeyword: 'Database Connection Timeout',
        resolutionDays: 14,
        impactScore: 78,
        occurrenceCount: 4,
      },
      {
        reportId: 'report-005',
        teamId: 'team-A',
        reportDate: '2024-01-29T09:00:00Z',
        issueKeyword: 'Database Connection Timeout',
        resolutionDays: 21,
        impactScore: 85,
        occurrenceCount: 5,
      },
    ];

    // TextAnalysisServiceAdapterをスタブ化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: 'Database Connection Timeout',
          frequency: 5,
          confidenceScore: 0.92,
        },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 78,
        affectedTeams: ['team-A'],
        severityLevel: 'high',
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
        recommendedAction: 'immediate',
      }),
    };

    // ボトルネック変化パターン可視化レポート生成の処理を実行
    const agentInput = {
      analysisStartDate: '2024-01-01T00:00:00Z',
      analysisEndDate: '2024-01-31T23:59:59Z',
      teamIds: ['team-A'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'manager-001',
    };

    // 実際のエージェント実行（スタブ化されたAIクライアントを渡す）
    const mockAiClient = {
      invokeAction01: jest
        .fn()
        .mockResolvedValue({ status: 'success', dataPoints: testReportingData }),
      invokeAction02: jest
        .fn()
        .mockResolvedValue({
          status: 'success',
          patterns: [
            {
              issueKeyword: 'Database Connection Timeout',
              timeSeriesPattern: 'increasing_trend',
              resolutionDaysTrend: [1, 3, 7, 14, 21],
            },
          ],
        }),
      invokeAction03: jest
        .fn()
        .mockResolvedValue({
          status: 'success',
          recommendedGraphTypes: ['lineChart', 'trendChart'],
          primarySelection: 'lineChart',
        }),
      invokeAction04: jest.fn().mockResolvedValue({
        status: 'success',
        graphId: 'graph-001',
        graphType: 'lineChart',
        title: 'Resolution Time Trend - Database Connection Timeout',
        dataPoints: [
          { date: '2024-01-01', resolutionDays: 1, impactScore: 65 },
          { date: '2024-01-08', resolutionDays: 3, impactScore: 68 },
          { date: '2024-01-15', resolutionDays: 7, impactScore: 72 },
          { date: '2024-01-22', resolutionDays: 14, impactScore: 78 },
          { date: '2024-01-29', resolutionDays: 21, impactScore: 85 },
        ],
      }),
      invokeAction05: jest.fn().mockResolvedValue({
        status: 'success',
        reportId: 'report-viz-001',
        visualizationGraphs: [
          {
            graphType: 'lineChart',
            title: 'Resolution Time Trend - Database Connection Timeout',
            dataPoints: [
              { date: '2024-01-01', resolutionDays: 1, impactScore: 65 },
              { date: '2024-01-08', resolutionDays: 3, impactScore: 68 },
              { date: '2024-01-15', resolutionDays: 7, impactScore: 72 },
              { date: '2024-01-22', resolutionDays: 14, impactScore: 78 },
              { date: '2024-01-29', resolutionDays: 21, impactScore: 85 },
            ],
          },
        ],
        recurringIssuePatterns: [
          {
            issueKeyword: 'Database Connection Timeout',
            occurrenceCount: 5,
            timeSeriesPattern: 'increasing_trend',
            priorityScore: 85,
          },
        ],
        emailSentAt: '2024-02-01T10:30:00Z',
      }),
    };

    const result = await runTx8Imp1Agent(agentInput, mockAiClient);

    // レスポンスオブジェクトの『graphType』フィールドの値を確認
    expect(result).toBeDefined();
    expect(result.reportId).toBe('report-viz-001');
    expect(result.visualizationGraphs).toBeDefined();
    expect(Array.isArray(result.visualizationGraphs)).toBe(true);
    expect(result.visualizationGraphs.length).toBeGreaterThan(0);

    // 生成されたレポートの実際のグラフ描画データを検証
    const primaryGraph = result.visualizationGraphs[0];
    expect(primaryGraph.graphType).toBe('lineChart');
    expect(primaryGraph.title).toContain('Resolution Time Trend');

    // 時系列トレンドを表現するグラフ形式が選択されていることを確認
    expect(['lineChart', 'trendChart']).toContain(primaryGraph.graphType);

    // グラフデータポイントが解決期間の増加傾向を表現していることを確認
    expect(primaryGraph.dataPoints).toBeDefined();
    expect(Array.isArray(primaryGraph.dataPoints)).toBe(true);
    expect(primaryGraph.dataPoints.length).toBe(5);

    const resolutionTrend = primaryGraph.dataPoints.map(
      (dp: any) => dp.resolutionDays
    );
    expect(resolutionTrend).toEqual([1, 3, 7, 14, 21]);

    // 再発課題パターンが正しく分類されていることを確認
    expect(result.recurringIssuePatterns).toBeDefined();
    expect(result.recurringIssuePatterns.length).toBeGreaterThan(0);

    const pattern = result.recurringIssuePatterns[0];
    expect(pattern.issueKeyword).toBe('Database Connection Timeout');
    expect(pattern.occurrenceCount).toBe(5);
    expect(pattern.timeSeriesPattern).toBe('increasing_trend');
    expect(pattern.priorityScore).toBe(85);

    // メール送信完了を確認
    expect(result.emailSentAt).toBeDefined();
    expect(typeof result.emailSentAt).toBe('string');

    // mockAiClient が全て呼び出されたことを検証（アクション実行の確認）
    expect(mockAiClient.invokeAction01).toHaveBeenCalled();
    expect(mockAiClient.invokeAction02).toHaveBeenCalled();
    expect(mockAiClient.invokeAction03).toHaveBeenCalled();
    expect(mockAiClient.invokeAction04).toHaveBeenCalled();
    expect(mockAiClient.invokeAction05).toHaveBeenCalled();
  });
});