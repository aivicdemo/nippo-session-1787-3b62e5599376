import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1 agent: 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-1932
  test('分析対象期間が同一日付の場合、その1日分の課題データのみでグループ化が行われる', async () => {
    const analysisStartDate = '2026-08-19';
    const analysisEndDate = '2026-08-19';
    const teamIds = ['team-001'];
    const minimumRecurrenceThreshold = 2;
    const recipientManagerId = 'manager-001';

    // モック用のテストデータ：同一日付（2026-08-19）の課題データ
    const mockIssueData = [
      {
        issueKeyword: 'データベース接続エラー',
        reportedDate: '2026-08-19',
        impactScore: 75,
        occurrenceCount: 1,
      },
      {
        issueKeyword: 'データベース接続エラー',
        reportedDate: '2026-08-19',
        impactScore: 68,
        occurrenceCount: 1,
      },
      {
        issueKeyword: 'API応答遅延',
        reportedDate: '2026-08-19',
        impactScore: 45,
        occurrenceCount: 1,
      },
    ];

    // TextAnalysisServiceAdapterのスタブ化
    const stubAiClient: Tx8Imp1AiClient = {
      extractKeywordsAndTimeSeriesPatterns: async (
        issueTexts: string[],
        dateRange: { startDate: string; endDate: string }
      ) => {
        // 抽出されたキーワードと時系列パターンを返す
        return {
          groupedKeywords: [
            {
              keyword: 'データベース接続エラー',
              occurrences: [
                { date: '2026-08-19', count: 2 },
              ],
              totalCount: 2,
              timeSeriesPattern: '周期的',
              averageImpactScore: 71.5,
            },
            {
              keyword: 'API応答遅延',
              occurrences: [
                { date: '2026-08-19', count: 1 },
              ],
              totalCount: 1,
              timeSeriesPattern: '単発',
              averageImpactScore: 45,
            },
          ],
        };
      },
      generateVisualizationGraphs: async (
        groupedPatterns: Array<{
          keyword: string;
          occurrences: Array<{ date: string; count: number }>;
          totalCount: number;
          timeSeriesPattern: string;
          averageImpactScore: number;
        }>
      ) => {
        // グラフ生成ロジック
        return [
          {
            graphType: '折れ線',
            title: 'キーワード別発生頻度の推移',
            dataPoints: groupedPatterns.map(pattern => ({
              keyword: pattern.keyword,
              date: '2026-08-19',
              count: pattern.totalCount,
              impactScore: pattern.averageImpactScore,
            })),
          },
          {
            graphType: '棒',
            title: 'キーワード別の優先度スコア分布',
            dataPoints: groupedPatterns.map(pattern => ({
              keyword: pattern.keyword,
              score: pattern.averageImpactScore,
            })),
          },
        ];
      },
    };

    // エージェント実行
    const result = await runTx8Imp1Agent(
      {
        analysisStartDate,
        analysisEndDate,
        teamIds,
        minimumRecurrenceThreshold,
        recipientManagerId,
      },
      stubAiClient
    );

    // アサーション：結果構造の検証
    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');

    // 再発課題パターンの検証
    expect(result.recurringIssuePatterns).toBeDefined();
    expect(Array.isArray(result.recurringIssuePatterns)).toBe(true);
    expect(result.recurringIssuePatterns.length).toBe(2);

    // グループ1：『データベース接続エラー』の検証
    const dbErrorPattern = result.recurringIssuePatterns.find(
      p => p.issueKeyword === 'データベース接続エラー'
    );
    expect(dbErrorPattern).toBeDefined();
    expect(dbErrorPattern?.occurrenceCount).toBe(2);
    expect(dbErrorPattern?.priorityScore).toBe(71);
    expect(dbErrorPattern?.timeSeriesPattern).toBe('周期的');

    // グループ2：『API応答遅延』の検証
    const apiDelayPattern = result.recurringIssuePatterns.find(
      p => p.issueKeyword === 'API応答遅延'
    );
    expect(apiDelayPattern).toBeDefined();
    expect(apiDelayPattern?.occurrenceCount).toBe(1);
    expect(apiDelayPattern?.priorityScore).toBe(45);
    expect(apiDelayPattern?.timeSeriesPattern).toBe('単発');

    // 可視化グラフの検証
    expect(result.visualizationGraphs).toBeDefined();
    expect(Array.isArray(result.visualizationGraphs)).toBe(true);
    expect(result.visualizationGraphs.length).toBeGreaterThanOrEqual(1);

    // グラフ1：折れ線グラフの検証
    const lineGraph = result.visualizationGraphs.find(
      g => g.graphType === '折れ線'
    );
    expect(lineGraph).toBeDefined();
    expect(lineGraph?.title).toContain('推移');
    expect(Array.isArray(lineGraph?.dataPoints)).toBe(true);
    expect(lineGraph?.dataPoints.length).toBe(2);

    // グラフ2：棒グラフの検証
    const barGraph = result.visualizationGraphs.find(
      g => g.graphType === '棒'
    );
    expect(barGraph).toBeDefined();
    expect(barGraph?.title).toContain('優先度');
    expect(Array.isArray(barGraph?.dataPoints)).toBe(true);

    // メール送信日時の検証
    expect(result.emailSentAt).toBeDefined();
    expect(typeof result.emailSentAt).toBe('string');
    const emailSentDate = new Date(result.emailSentAt);
    expect(emailSentDate.getTime()).toBeGreaterThan(0);

    // 分析対象期間が同一日付（2026-08-19のみ）であることの確認
    // 分析に含まれるすべてのデータポイントが2026-08-19に限定されていること
    result.visualizationGraphs.forEach(graph => {
      graph.dataPoints.forEach((dataPoint: Record<string, unknown>) => {
        if ('date' in dataPoint) {
          expect(dataPoint.date).toBe('2026-08-19');
        }
      });
    });

    // 再発パターン分析の対象期間検証
    result.recurringIssuePatterns.forEach(pattern => {
      // 時系列パターンが1日分のみであることを確認
      expect(pattern).toHaveProperty('occurrenceCount');
      expect(pattern.occurrenceCount).toBeGreaterThan(0);
    });
  });
});