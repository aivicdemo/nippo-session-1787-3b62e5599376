import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput, type RecurringIssuePattern, type VisualizationGraph } from '../../src/agents/tx-8-imp-1/types';
import { type TextAnalysisServiceAdapter } from '../../src/external/TextAnalysisServiceAdapter';

describe('tx-8-imp-1: Recurring Issue Pattern Analysis and Visualization', () => {
  test('SCEN-1975: [normal] ボトルネック変化パターン可視化レポート生成 - 課題の発生頻度が昇順で推移する場合、適切なグラフ形式が自動選択される', async () => {
    // Arrange: テストデータ準備
    const analysisStartDate = '2024-01-01T00:00:00Z';
    const analysisEndDate = '2024-01-04T23:59:59Z';
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

    // スタブ: TextAnalysisServiceAdapter の extractKeywords メソッド
    // 日報データから『DB接続エラー』の出現頻度を返すよう設定
    const mockTextAnalysisAdapter: Partial<TextAnalysisServiceAdapter> = {
      extractKeywords: jest.fn(async (text: string) => {
        // 日報テキスト内の『DB接続エラー』の出現回数を模擬
        // 1日目: 1件、2日目: 2件、3日目: 3件、4日目: 5件の昇順推移
        const dbErrorMatch = (text.match(/DB接続エラー/g) || []).length;
        return {
          keywords: [
            { keyword: 'DB接続エラー', frequency: dbErrorMatch },
          ],
          totalKeywordsExtracted: 1,
        };
      }),
      assessImpactScore: jest.fn(async (keyword: string) => ({
        keyword,
        impactScore: 75,
        teamWaveEffect: 0.8,
      })),
      classifyIssueSeverity: jest.fn(async (issueText: string) => ({
        severity: 'high',
        confidence: 0.85,
      })),
    };

    // テスト用の日報データを準備
    // 日付: 2024-01-01～2024-01-04
    // 課題キーワード『DB接続エラー』の発生件数: 1, 2, 3, 5（昇順）
    const mockDailyReports = [
      {
        date: '2024-01-01',
        reportText: 'DB接続エラー',
        issueContent: 'DB接続エラー が1回発生',
      },
      {
        date: '2024-01-02',
        reportText: 'DB接続エラー DB接続エラー',
        issueContent: 'DB接続エラー が2回発生',
      },
      {
        date: '2024-01-03',
        reportText: 'DB接続エラー DB接続エラー DB接続エラー',
        issueContent: 'DB接続エラー が3回発生',
      },
      {
        date: '2024-01-04',
        reportText: 'DB接続エラー DB接続エラー DB接続エラー DB接続エラー DB接続エラー',
        issueContent: 'DB接続エラー が5回発生',
      },
    ];

    // Act: ボトルネック変化パターン可視化レポート生成機能を実行
    const output: Tx8AgentOutput = await runTx8Imp1Agent(
      input,
      mockTextAnalysisAdapter as TextAnalysisServiceAdapter,
      mockDailyReports
    );

    // Assert: 期待結果を検証

    // 1. レポートが正常に生成されていることを確認
    expect(output).toBeDefined();
    expect(output.reportId).toBeTruthy();
    expect(typeof output.reportId).toBe('string');

    // 2. 再発パターンが正確に分析されていることを確認
    expect(output.recurringIssuePatterns).toBeDefined();
    expect(Array.isArray(output.recurringIssuePatterns)).toBe(true);

    // 『DB接続エラー』パターンが検出されていることを確認
    const dbErrorPattern = output.recurringIssuePatterns.find(
      (pattern: RecurringIssuePattern) => pattern.issueKeyword === 'DB接続エラー'
    );
    expect(dbErrorPattern).toBeDefined();
    expect(dbErrorPattern?.occurrenceCount).toBe(11); // 1 + 2 + 3 + 5 = 11

    // 3. 時系列パターンが『増加傾向』と判定されていることを確認
    expect(dbErrorPattern?.timeSeriesPattern).toMatch(/増加傾向|上昇|昇順/);

    // 4. 優先度スコアが 0～100 の範囲内であることを確認
    expect(dbErrorPattern?.priorityScore).toBeGreaterThanOrEqual(0);
    expect(dbErrorPattern?.priorityScore).toBeLessThanOrEqual(100);

    // 5. 可視化グラフが自動選択されていることを確認
    expect(output.visualizationGraphs).toBeDefined();
    expect(Array.isArray(output.visualizationGraphs)).toBe(true);
    expect(output.visualizationGraphs.length).toBeGreaterThan(0);

    // 6. グラフ形式が『折れ線グラフ』または『棒グラフ』として自動選択されていることを確認
    const selectedGraphTypes = output.visualizationGraphs.map((graph: VisualizationGraph) => graph.graphType);
    const hasLineOrBarGraph = selectedGraphTypes.some((type: string) =>
      type.match(/折れ線|line|棒|bar/i)
    );
    expect(hasLineOrBarGraph).toBe(true);

    // 7. グラフのタイトルが適切であることを確認
    const graphWithDbError = output.visualizationGraphs.find((graph: VisualizationGraph) =>
      graph.title.includes('DB接続エラー') || graph.title.includes('ボトルネック') || graph.title.includes('変化')
    );
    expect(graphWithDbError).toBeDefined();
    expect(graphWithDbError?.title).toBeTruthy();

    // 8. グラフのデータポイントが正確にプロットされていることを確認
    const dataPointsGraph = output.visualizationGraphs.find((graph: VisualizationGraph) =>
      graph.graphType.match(/折れ線|line|棒|bar/i) && graph.title.includes('DB接続エラー')
    );

    if (dataPointsGraph && dataPointsGraph.dataPoints) {
      // X軸に日数（1-4日目）がプロットされていることを確認
      expect(dataPointsGraph.dataPoints.length).toBeGreaterThanOrEqual(4);

      // Y軸に『DB接続エラー』の発生件数（1, 2, 3, 5）がプロットされていることを確認
      const expectedValues = [1, 2, 3, 5];
      const actualValues = dataPointsGraph.dataPoints
        .map((point: { [key: string]: number | string }) => point.value || point.count || point.frequency)
        .filter((val: number | string) => typeof val === 'number') as number[];

      // 昇順推移が確認できることを検証
      expectedValues.forEach((expectedValue: number, index: number) => {
        if (index < actualValues.length) {
          expect(actualValues[index]).toBe(expectedValue);
        }
      });
    }

    // 9. メール送信日時が ISO 8601 形式で記録されていることを確認
    expect(output.emailSentAt).toBeTruthy();
    expect(typeof output.emailSentAt).toBe('string');
    // ISO 8601 形式の簡易チェック
    expect(output.emailSentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // 10. グラフが右肩上がりの傾向を表現していることを確認
    if (dataPointsGraph && dataPointsGraph.dataPoints && dataPointsGraph.dataPoints.length >= 2) {
      const firstValue = dataPointsGraph.dataPoints[0].value as number;
      const lastValue = dataPointsGraph.dataPoints[dataPointsGraph.dataPoints.length - 1].value as number;
      expect(lastValue).toBeGreaterThan(firstValue);
    }
  });
});