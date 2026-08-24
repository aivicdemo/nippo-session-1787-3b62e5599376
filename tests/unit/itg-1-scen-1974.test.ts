import { runTx8Imp1Agent } from "../../src/agents/tx-8-imp-1/orchestrator";
import { type Tx8Imp1AiClient } from "../../src/agents/tx-8-imp-1/orchestrator";
import { type Tx8AgentInput, type Tx8AgentOutput, type RecurringIssuePattern, type VisualizationGraph } from "../../src/agents/tx-8-imp-1/orchestrator";

describe("tx-8-imp-1: ボトルネック変化パターン可視化レポート生成", () => {
  // SCEN-1974: [normal] ボトルネック変化パターン可視化レポート生成 - 過去30日間の課題データ複数件で、複数課題の集約レポートが生成される
  test("過去30日間の複数課題データから、課題間の相関関係と優先順位を可視化したレポートを生成する", async () => {
    const analysisStartDate = "2024-11-15T00:00:00Z";
    const analysisEndDate = "2024-12-15T23:59:59Z";
    const recipientManagerId = "mgr-001";
    const teamIds = ["team-a", "team-b"];

    // テストデータ：過去30日間の課題データ（最小3件以上）
    const mockRecurringPatterns: RecurringIssuePattern[] = [
      {
        issueKeyword: "データベース接続タイムアウト",
        occurrenceCount: 7,
        timeSeriesPattern: "周期的",
        priorityScore: 85,
      },
      {
        issueKeyword: "メモリリーク",
        occurrenceCount: 5,
        timeSeriesPattern: "増加傾向",
        priorityScore: 78,
      },
      {
        issueKeyword: "ネットワーク遅延",
        occurrenceCount: 4,
        timeSeriesPattern: "周期的",
        priorityScore: 65,
      },
      {
        issueKeyword: "CI/CDパイプライン失敗",
        occurrenceCount: 6,
        timeSeriesPattern: "急増",
        priorityScore: 72,
      },
    ];

    const mockVisualizationGraphs: VisualizationGraph[] = [
      {
        graphType: "折れ線",
        title: "課題発生頻度の時系列推移",
        dataPoints: [
          { date: "2024-11-15", count: 2 },
          { date: "2024-11-22", count: 3 },
          { date: "2024-11-29", count: 4 },
          { date: "2024-12-06", count: 5 },
          { date: "2024-12-13", count: 6 },
        ],
      },
      {
        graphType: "棒",
        title: "課題別発生件数ランキング",
        dataPoints: [
          { keyword: "データベース接続タイムアウト", count: 7 },
          { keyword: "CI/CDパイプライン失敗", count: 6 },
          { keyword: "メモリリーク", count: 5 },
          { keyword: "ネットワーク遅延", count: 4 },
        ],
      },
      {
        graphType: "ヒートマップ",
        title: "課題間の相関関係",
        dataPoints: [
          { issue1: "データベース接続タイムアウト", issue2: "メモリリーク", correlation: 0.72 },
          { issue1: "データベース接続タイムアウト", issue2: "ネットワーク遅延", correlation: 0.58 },
          { issue1: "CI/CDパイプライン失敗", issue2: "ネットワーク遅延", correlation: 0.65 },
        ],
      },
    ];

    // TextAnalysisServiceAdapterのスタブを作成
    const mockAiClient: Tx8Imp1AiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ["データベース接続タイムアウト", "メモリリーク", "ネットワーク遅延", "CI/CDパイプライン失敗"],
        frequencies: { "データベース接続タイムアウト": 7, "メモリリーク": 5, "ネットワーク遅延": 4, "CI/CDパイプライン失敗": 6 },
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        "データベース接続タイムアウト": 85,
        "メモリリーク": 78,
        "ネットワーク遅延": 65,
        "CI/CDパイプライン失敗": 72,
      }),
      analyzeTimeSeriesPattern: jest.fn().mockResolvedValue({
        "データベース接続タイムアウト": "周期的",
        "メモリリーク": "増加傾向",
        "ネットワーク遅延": "周期的",
        "CI/CDパイプライン失敗": "急増",
      }),
      generateVisualizationGraphs: jest.fn().mockResolvedValue(mockVisualizationGraphs),
      correlateIssuePatterns: jest.fn().mockResolvedValue({
        correlations: [
          { issue1: "データベース接続タイムアウト", issue2: "メモリリーク", score: 0.72 },
          { issue1: "データベース接続タイムアウト", issue2: "ネットワーク遅延", score: 0.58 },
          { issue1: "CI/CDパイプライン失敗", issue2: "ネットワーク遅延", score: 0.65 },
        ],
      }),
    };

    const input: Tx8AgentInput = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold: 3,
      recipientManagerId,
    };

    // ボトルネック変化パターン可視化レポート生成機能を実行
    const output: Tx8AgentOutput = await runTx8Imp1Agent(input, mockAiClient);

    // 生成されたレポートを検証
    // (1) 複数課題（入力した全課題）が1つの集約レポートに統合されている
    expect(output.recurringIssuePatterns.length).toBe(4);
    expect(output.recurringIssuePatterns).toContainEqual({
      issueKeyword: "データベース接続タイムアウト",
      occurrenceCount: 7,
      timeSeriesPattern: "周期的",
      priorityScore: 85,
    });
    expect(output.recurringIssuePatterns).toContainEqual({
      issueKeyword: "メモリリーク",
      occurrenceCount: 5,
      timeSeriesPattern: "増加傾向",
      priorityScore: 78,
    });
    expect(output.recurringIssuePatterns).toContainEqual({
      issueKeyword: "ネットワーク遅延",
      occurrenceCount: 4,
      timeSeriesPattern: "周期的",
      priorityScore: 65,
    });
    expect(output.recurringIssuePatterns).toContainEqual({
      issueKeyword: "CI/CDパイプライン失敗",
      occurrenceCount: 6,
      timeSeriesPattern: "急増",
      priorityScore: 72,
    });

    // (2) 各課題ごとにキーワード、影響度スコア、出現頻度の推移が含まれている
    output.recurringIssuePatterns.forEach((pattern) => {
      expect(pattern.issueKeyword).toBeDefined();
      expect(pattern.issueKeyword.length).toBeGreaterThan(0);
      expect(pattern.occurrenceCount).toBeGreaterThanOrEqual(3);
      expect(pattern.priorityScore).toBeGreaterThanOrEqual(0);
      expect(pattern.priorityScore).toBeLessThanOrEqual(100);
      expect(["周期的", "増加傾向", "急増", "減少傾向"]).toContain(pattern.timeSeriesPattern);
    });

    // (3) 課題間の相関関係または優先順位が可視化されている
    expect(output.visualizationGraphs.length).toBeGreaterThanOrEqual(3);
    const heatmapGraph = output.visualizationGraphs.find((g) => g.graphType === "ヒートマップ");
    expect(heatmapGraph).toBeDefined();
    expect(heatmapGraph?.title).toBe("課題間の相関関係");
    expect(heatmapGraph?.dataPoints.length).toBeGreaterThan(0);

    // (4) レポート生成日時が現在時刻と一致している
    const emailSentAtDate = new Date(output.emailSentAt);
    const now = new Date();
    const timeDifference = Math.abs(now.getTime() - emailSentAtDate.getTime());
    // 5秒以内の誤差を許容
    expect(timeDifference).toBeLessThan(5000);

    // レポートはJSON形式で返却され、手動キーワード入力や外部通知を含まない集約データのみで構成されている
    expect(output.reportId).toBeDefined();
    expect(output.reportId.length).toBeGreaterThan(0);
    expect(typeof output.reportId).toBe("string");
    expect(output.recurringIssuePatterns).toBeDefined();
    expect(Array.isArray(output.recurringIssuePatterns)).toBe(true);
    expect(output.visualizationGraphs).toBeDefined();
    expect(Array.isArray(output.visualizationGraphs)).toBe(true);

    // AI クライアントのメソッドが正常に呼び出されたことを確認
    expect(mockAiClient.extractKeywords).toHaveBeenCalled();
    expect(mockAiClient.assessImpactScore).toHaveBeenCalled();
    expect(mockAiClient.analyzeTimeSeriesPattern).toHaveBeenCalled();
    expect(mockAiClient.generateVisualizationGraphs).toHaveBeenCalled();
  });
});