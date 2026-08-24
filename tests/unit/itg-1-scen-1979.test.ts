import { runTx8Imp1Agent } from "../../src/agents/tx-8-imp-1/orchestrator";
import { type Tx8AgentInput, type Tx8AgentOutput } from "../../src/agents/tx-8-imp-1/types";

describe("課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能", () => {
  // SCEN-1979: [normal] ボトルネック変化パターン可視化レポート生成 - 影響度スコアが降順で推移する場合、適切なグラフ形式が自動選択される
  test("影響度スコアが単調減少傾向のボトルネックデータから、降順トレンド強調型の折れ線グラフが自動選択される", async () => {
    // テストデータ：影響度スコアが時系列で降順に推移するボトルネックデータセット
    const analysisStartDate = "2024-01-01";
    const analysisEndDate = "2024-01-05";
    const teamIds = ["team-001"];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = "manager-001";

    // TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest
        .fn()
        .mockResolvedValueOnce({
          keywords: [
            {
              keyword: "DBレイテンシ低下",
              frequency: 5,
              impactScore: 85,
            },
          ],
        })
        .mockResolvedValueOnce({
          keywords: [
            {
              keyword: "DBレイテンシ低下",
              frequency: 4,
              impactScore: 72,
            },
          ],
        })
        .mockResolvedValueOnce({
          keywords: [
            {
              keyword: "DBレイテンシ低下",
              frequency: 3,
              impactScore: 58,
            },
          ],
        })
        .mockResolvedValueOnce({
          keywords: [
            {
              keyword: "DBレイテンシ低下",
              frequency: 2,
              impactScore: 41,
            },
          ],
        })
        .mockResolvedValueOnce({
          keywords: [
            {
              keyword: "DBレイテンシ低下",
              frequency: 1,
              impactScore: 23,
            },
          ],
        }),
      assessImpactScore: jest.fn().mockImplementation((keyword) => {
        const scoreMap: { [key: string]: number } = {
          "2024-01-01": 85,
          "2024-01-02": 72,
          "2024-01-03": 58,
          "2024-01-04": 41,
          "2024-01-05": 23,
        };
        return Promise.resolve(scoreMap["2024-01-01"] || 50);
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue("high"),
    };

    const input: Tx8AgentInput = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    // ボトルネック変化パターン可視化レポート生成機能を呼び出し
    const result: Tx8AgentOutput = await runTx8Imp1Agent(
      input,
      mockTextAnalysisAdapter
    );

    // レポート内の「グラフ形式選択ロジック」が実行されたことを検証
    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(result.reportId).toMatch(/^report-/);

    // 生成されたレポートオブジェクトのプロパティを検証
    expect(result.visualizationGraphs).toBeDefined();
    expect(Array.isArray(result.visualizationGraphs)).toBe(true);
    expect(result.visualizationGraphs.length).toBeGreaterThan(0);

    // 自動選択されたグラフ形式が記録されていることを確認
    const selectedGraph = result.visualizationGraphs[0];
    expect(selectedGraph.graphType).toBe("lineChart_descendingTrend");
    expect(selectedGraph.title).toContain("スコア継続低減傾向");

    // 時系列パターンが降順トレンドとして認識されていることを確認
    expect(result.recurringIssuePatterns).toBeDefined();
    expect(result.recurringIssuePatterns.length).toBeGreaterThan(0);

    const issuePattern = result.recurringIssuePatterns[0];
    expect(issuePattern.issueKeyword).toBe("DBレイテンシ低下");
    expect(issuePattern.occurrenceCount).toBeGreaterThanOrEqual(
      minimumRecurrenceThreshold
    );
    expect(issuePattern.timeSeriesPattern).toBe("降順トレンド");

    // 優先度スコアが検証されていることを確認
    expect(issuePattern.priorityScore).toBeDefined();
    expect(typeof issuePattern.priorityScore).toBe("number");
    expect(issuePattern.priorityScore).toBeGreaterThanOrEqual(0);
    expect(issuePattern.priorityScore).toBeLessThanOrEqual(100);

    // メール送信日時が記録されていることを確認
    expect(result.emailSentAt).toBeDefined();
    expect(result.emailSentAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // グラフのデータポイントが正しく構成されていることを確認
    expect(selectedGraph.dataPoints).toBeDefined();
    expect(Array.isArray(selectedGraph.dataPoints)).toBe(true);
    expect(selectedGraph.dataPoints.length).toBeGreaterThanOrEqual(5);

    // データポイントの値が降順で推移していることを確認
    const scores = selectedGraph.dataPoints.map((point: any) => point.score);
    expect(scores[0]).toBe(85);
    expect(scores[1]).toBe(72);
    expect(scores[2]).toBe(58);
    expect(scores[3]).toBe(41);
    expect(scores[4]).toBe(23);

    // 各データポイントで値が前のポイント以下であることを検証
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });
});