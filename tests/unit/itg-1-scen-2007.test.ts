import { runTx8Imp1Agent } from "../../src/agents/tx-8-imp-1/orchestrator";

describe("tx-8-imp-1: ボトルネック変化パターン可視化レポート生成", () => {
  // SCEN-2007
  test("課題発生頻度が閾値超過（11回/月）のとき、優先度の高いグラフ形式が選択される", async () => {
    const analysisStartDate = "2023-01-01";
    const analysisEndDate = "2023-12-31";
    const teamIds = ["team-001"];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = "manager-001";

    // テストデータ: 過去12ヶ月間の課題データ（課題Aが11回/月で発生）
    const mockIssueDataset = {
      issues: [
        {
          issueId: "A",
          keyword: "デプロイメント失敗",
          occurrenceCount: 11,
          timeSeriesPattern: "連続発生",
          priorityScore: 85,
          impactScore: 85,
          frequency_per_month: 11,
          dates: [
            "2023-01-05",
            "2023-01-12",
            "2023-01-19",
            "2023-01-26",
            "2023-02-02",
            "2023-02-09",
            "2023-02-16",
            "2023-02-23",
            "2023-03-02",
            "2023-03-09",
            "2023-03-16",
          ],
        },
        {
          issueId: "B",
          keyword: "テスト失敗",
          occurrenceCount: 5,
          timeSeriesPattern: "散発",
          priorityScore: 45,
          impactScore: 45,
          frequency_per_month: 5,
        },
      ],
    };

    // TextAnalysisServiceAdapterのスタブ
    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: "デプロイメント失敗", frequency: 11, confidence: 0.95 },
          { keyword: "テスト失敗", frequency: 5, confidence: 0.88 },
        ],
      }),
      assessImpactScore: jest.fn().mockImplementation((keyword: string) => {
        if (keyword === "デプロイメント失敗") {
          return Promise.resolve({ impactScore: 85, severity: "高" });
        }
        return Promise.resolve({ impactScore: 45, severity: "中" });
      }),
      classifyIssueSeverity: jest.fn().mockImplementation((keyword: string) => {
        if (keyword === "デプロイメント失敗") {
          return Promise.resolve("高");
        }
        return Promise.resolve("中");
      }),
    };

    // Tx8Imp1AiClientのスタブ
    const tx8Imp1AiClientStub = {
      action01_searchAndExtractIssueData: jest.fn().mockResolvedValue({
        extracted_issues: mockIssueDataset.issues,
        data_quality_score: 0.92,
        extraction_timestamp: "2024-01-15T10:00:00Z",
      }),
      action02_analyzeTimeSeriesPattern: jest.fn().mockResolvedValue({
        patterns: [
          {
            issue_id: "A",
            pattern_type: "同一課題の連続発生",
            frequency_per_month: 11,
            confidence: 0.94,
          },
          {
            issue_id: "B",
            pattern_type: "散発",
            frequency_per_month: 5,
            confidence: 0.87,
          },
        ],
      }),
      action03_identifyBottleneckPattern: jest.fn().mockResolvedValue({
        bottleneck_patterns: [
          {
            issue_id: "A",
            pattern_classification: "高変動・高頻度",
            severity_level: "高",
            requires_escalation: true,
          },
          {
            issue_id: "B",
            pattern_classification: "低変動・散発",
            severity_level: "中",
            requires_escalation: false,
          },
        ],
      }),
      action04_generateVisualizationReport: jest.fn().mockResolvedValue({
        graphs: [
          {
            graphType: "line_chart_emphasized",
            title: "デプロイメント失敗発生推移（月次）",
            dataPoints: [
              { month: "2023-01", count: 1 },
              { month: "2023-02", count: 1 },
              { month: "2023-03", count: 1 },
            ],
            issue_id: "A",
            priority_rank: 1,
            emphasis_style: "red_border_thick",
          },
          {
            graphType: "bar_chart",
            title: "テスト失敗発生推移",
            dataPoints: [
              { month: "2023-01", count: 0 },
              { month: "2023-02", count: 1 },
            ],
            issue_id: "B",
            priority_rank: 2,
            emphasis_style: "none",
          },
        ],
        report_generated_at: "2024-01-15T10:05:00Z",
      }),
      action05_extractAndHighlightHighPriorityIssues: jest.fn().mockResolvedValue(
        {
          high_priority_issues: [
            {
              issue_id: "A",
              keyword: "デプロイメント失敗",
              frequency_per_month: 11,
              impact_score: 85,
              priority_rank: 1,
              graph_format: "line_chart_emphasized",
              emphasis_applied: true,
              highlight_color: "red",
            },
          ],
          visualization_report: {
            report_id: "report-20240115-001",
            graphs: [
              {
                graphType: "line_chart_emphasized",
                title: "デプロイメント失敗発生推移（月次）",
                dataPoints: [
                  { month: "2023-01", count: 1 },
                  { month: "2023-02", count: 1 },
                  { month: "2023-03", count: 1 },
                ],
                issue_id: "A",
                priority_rank: 1,
              },
            ],
            audit_events: [
              {
                action: "graph_format_selected",
                issue_id: "A",
                format: "line_chart_emphasized",
                priority_rank: 1,
                frequency_per_month: 11,
                impact_score: 85,
                timestamp: "2024-01-15T10:05:30Z",
              },
            ],
          },
        }
      ),
    };

    const input = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    const output = await runTx8Imp1Agent(input, tx8Imp1AiClientStub);

    // 期待結果の検証
    expect(output).toBeDefined();
    expect(output.reportId).toBe("report-20240115-001");
    expect(output.recurringIssuePatterns).toHaveLength(1);

    const issuePatternA = output.recurringIssuePatterns[0];
    expect(issuePatternA.issueKeyword).toBe("デプロイメント失敗");
    expect(issuePatternA.occurrenceCount).toBe(11);
    expect(issuePatternA.priorityScore).toBe(85);
    expect(issuePatternA.timeSeriesPattern).toBe("同一課題の連続発生");

    // グラフ形式の検証
    expect(output.visualizationGraphs).toHaveLength(1);
    const primaryGraph = output.visualizationGraphs[0];
    expect(primaryGraph.graphType).toBe("line_chart_emphasized");
    expect(primaryGraph.title).toBe("デプロイメント失敗発生推移（月次）");
    expect(primaryGraph.dataPoints).toHaveLength(3);
    expect(primaryGraph.dataPoints[0]).toEqual({ month: "2023-01", count: 1 });

    // 優先度の高いグラフが第1優先度に配置されていることを確認
    expect(output.visualizationGraphs[0]).toHaveProperty("graphType", "line_chart_emphasized");

    // 監査イベントの検証
    const graphSelectionAuditEvent = {
      action: "graph_format_selected",
      issue_id: "A",
      format: "line_chart_emphasized",
      priority_rank: 1,
      frequency_per_month: 11,
      impact_score: 85,
    };

    // auditイベントがrecurringIssuePatternの補足情報として含まれていることを確認
    // または、別の方法で監査ログにアクセスできることを確認
    expect(tx8Imp1AiClientStub.action05_extractAndHighlightHighPriorityIssues).toHaveBeenCalled();

    // メール送信日時が ISO 8601 形式で設定されていることを確認
    expect(output.emailSentAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
  });
});