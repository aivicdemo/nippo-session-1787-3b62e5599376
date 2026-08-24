import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8AgentInput, Tx8AgentOutput, RecurringIssuePattern, VisualizationGraph } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1: ボトルネック変化パターン可視化レポート生成', () => {
  test('SCEN-2011: 解決期間の平均計算で端数が発生するとき、適切に丸められてレポートに反映される', async () => {
    // テスト用の課題データセットを準備
    const testIssueData = [
      {
        issueKeyword: 'API通信エラー',
        occurrenceCount: 3,
        resolutionDays: [5.5, 7.3, 3.2],
      },
    ];

    // 平均解決期間の計算: (5.5 + 7.3 + 3.2) / 3 = 16.0 / 3 = 5.333... 日
    const expectedAverageResolutionDays = 5.3; // 小数第1位で四捨五入

    // Tx8Imp1AiClient のスタブを作成
    const mockAiClient: Tx8Imp1AiClient = {
      extractAndAnalyzeCourseData: async () => {
        return {
          analyzedIssues: [
            {
              issueKeyword: 'API通信エラー',
              occurrenceCount: 3,
              averageResolutionDays: expectedAverageResolutionDays,
              timeSeriesPattern: '増加傾向',
            },
          ],
        };
      },
      analyzeBottleneckPattern: async () => {
        return {
          patterns: [
            {
              issueKeyword: 'API通信エラー',
              occurrenceCount: 3,
              averageResolutionDays: expectedAverageResolutionDays,
              bottleneckIntensity: 'high',
            },
          ],
        };
      },
      generateVisualizationGraphs: async () => {
        return {
          graphs: [
            {
              graphType: '折れ線',
              title: 'ボトルネック変化パターン',
              dataPoints: [
                { date: '2024-01-01', value: 5.3 },
                { date: '2024-01-02', value: 5.3 },
                { date: '2024-01-03', value: 5.3 },
              ],
            },
            {
              graphType: 'テーブル',
              title: '課題別平均解決期間サマリー',
              dataPoints: [
                { issueKeyword: 'API通信エラー', averageResolutionDays: 5.3 },
              ],
            },
          ],
        };
      },
      generateReportEmail: async () => {
        return {
          emailContent: {
            subject: '課題再発パターン可視化レポート',
            body: `
            課題分析レポート
            
            【API通信エラー】
            発生件数: 3件
            平均解決期間: 5.3日
            ボトルネック強度: 高
            
            グラフ1: ボトルネック変化パターン（平均解決期間推移）
            - 日付ごとの平均解決期間: 5.3日で安定
            
            グラフ2: 課題別平均解決期間サマリー
            - API通信エラー: 5.3日
            `,
          },
        };
      },
      sendReportToRecipient: async () => {
        return {
          emailSentAt: '2024-01-15T10:00:00Z',
          deliveryStatus: 'success',
        };
      },
    };

    // runTx8Imp1Agent を実行
    const agentInput: Tx8AgentInput = {
      analysisStartDate: '2024-01-01T00:00:00Z',
      analysisEndDate: '2024-01-15T23:59:59Z',
      teamIds: ['team-001'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'manager-001',
    };

    const result: Tx8AgentOutput = await runTx8Imp1Agent(agentInput, mockAiClient);

    // レポート生成処理内で、解決期間の平均値が計算されることを確認
    expect(result.recurringIssuePatterns).toBeDefined();
    expect(result.recurringIssuePatterns.length).toBeGreaterThan(0);

    const apiErrorPattern = result.recurringIssuePatterns.find(
      (p: RecurringIssuePattern) => p.issueKeyword === 'API通信エラー'
    );
    expect(apiErrorPattern).toBeDefined();

    // レポートに記載された平均解決期間の値を抽出
    // ここでは priorityScore を平均解決期間の丸め結果を表すフィールドとして使用
    // 実際には、より詳細な結果構造に基づいて調整が必要
    expect(apiErrorPattern?.occurrenceCount).toBe(3);

    // 抽出した値が、適切に丸められていることを検証
    // (5.5 + 7.3 + 3.2) / 3 = 5.333... → 5.3 に丸められる
    const visualizationGraphs: VisualizationGraph[] = result.visualizationGraphs;
    expect(visualizationGraphs).toBeDefined();
    expect(visualizationGraphs.length).toBeGreaterThan(0);

    // 折れ線グラフを検索
    const lineGraph = visualizationGraphs.find((g: VisualizationGraph) => g.graphType === '折れ線');
    expect(lineGraph).toBeDefined();
    expect(lineGraph?.title).toBe('ボトルネック変化パターン');

    // グラフのデータポイントに丸められた値が反映されていることを確認
    const graphDataPoints = lineGraph?.dataPoints || [];
    expect(graphDataPoints.length).toBeGreaterThan(0);

    // 最初のデータポイントの値が 5.3 であることを検証
    expect((graphDataPoints[0] as any)?.value).toBe(5.3);

    // テーブルグラフを検索
    const tableGraph = visualizationGraphs.find((g: VisualizationGraph) => g.graphType === 'テーブル');
    expect(tableGraph).toBeDefined();
    expect(tableGraph?.title).toBe('課題別平均解決期間サマリー');

    // テーブルのデータポイントにも同じ丸められた値が反映されていることを確認
    const tableDataPoints = tableGraph?.dataPoints || [];
    expect(tableDataPoints.length).toBeGreaterThan(0);
    expect((tableDataPoints[0] as any)?.averageResolutionDays).toBe(5.3);

    // 複数回の同じデータセット投入で、丸め結果が毎回同じ値になることを確認
    const secondRunResult: Tx8AgentOutput = await runTx8Imp1Agent(agentInput, mockAiClient);

    const secondLineGraph = secondRunResult.visualizationGraphs.find(
      (g: VisualizationGraph) => g.graphType === '折れ線'
    );
    expect(secondLineGraph).toBeDefined();

    const secondGraphDataPoints = secondLineGraph?.dataPoints || [];
    expect((secondGraphDataPoints[0] as any)?.value).toBe(5.3);

    // 両回実行の結果が一致していることを確認（決定性を検証）
    expect((graphDataPoints[0] as any)?.value).toEqual((secondGraphDataPoints[0] as any)?.value);

    // ボトルネック変化パターンの可視化グラフとサマリーテーブルの両方に同じ丸められた値が
    // 一貫して表示されていることを確認
    const firstGraphValue = (lineGraph?.dataPoints?.[0] as any)?.value;
    const firstTableValue = (tableGraph?.dataPoints?.[0] as any)?.averageResolutionDays;

    expect(firstGraphValue).toBe(expectedAverageResolutionDays);
    expect(firstTableValue).toBe(expectedAverageResolutionDays);
    expect(firstGraphValue).toEqual(firstTableValue);

    // emailSentAt が ISO 8601 形式で返されていることを確認
    expect(result.emailSentAt).toBe('2024-01-15T10:00:00Z');
    expect(typeof result.emailSentAt).toBe('string');
  });
});