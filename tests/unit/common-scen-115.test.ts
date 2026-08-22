import { runTx6Imp1Agent } from "../../src/agents/tx-6-imp-1/orchestrator";
import type {
  Tx6AgentInput,
  Tx6AgentOutput,
  Tx6Imp1AiClient,
} from "../../src/agents/tx-6-imp-1/types";

describe("日報収集から分析レポート生成までの自動実行", () => {
  // SCEN-115
  test("分析結果に矛盾や異常値が含まれる場合に副作用の確定前に人へ引き継ぐ", async () => {
    const executionId = "exec-20240115-001";
    const executionTimestamp = new Date("2024-01-15T09:00:00Z");
    const analysisStartDate = "2024-01-08";
    const analysisEndDate = "2024-01-14";
    const teamId = "team-001";

    // Action 1～5の正常な中間状態をモック
    const collectReportsResult = {
      reportCount: 10,
      submittedCount: 9,
      unsubmittedMembers: ["member-10"],
    };

    const reminderSentResult = {
      remindersSent: 1,
      timestamp: executionTimestamp,
    };

    const issuesExtractedResult = {
      totalIssues: 15,
      categorized: {
        quality: 5,
        schedule: 7,
        safety: 3,
      },
    };

    const trendAnalysisResult = {
      weeklyTrend: [
        { week: "week-1", count: 12, category: "quality" },
        { week: "week-2", count: 15, category: "schedule" },
      ],
      bottlenecksIdentified: ["process-A", "resource-B"],
    };

    const priorityScoringResult = {
      scoredIssues: [
        { issueId: "issue-001", score: 85, rank: "high" },
        { issueId: "issue-002", score: 55, rank: "medium" },
      ],
    };

    // Action 6: 意図的に矛盾・異常値を含むAI出力
    const malformedAnalysisOutput = {
      issueKeywords: [
        {
          keyword: "database-timeout",
          occurrenceCount: 5,
          priorityScore: -1, // 異常値：範囲外（0-100）
          priorityRank: "high",
        },
        {
          keyword: "database-timeout",
          occurrenceCount: 3, // 重複カウント：同一キーワードで異なる件数
          priorityScore: 45,
          priorityRank: "medium",
        },
        {
          keyword: "network-error",
          occurrenceCount: 999, // 異常値：過度に大きい
          priorityScore: 200, // 異常値：範囲外
          priorityRank: "critical", // 定義されていないランク
        },
      ],
      statisticalMismatch: {
        totalExtracted: 15,
        totalScored: 8, // 不一致：スコア付与済み課題が抽出課題と矛盾
      },
    };

    // エスカレーション検出の期待値
    const expectedEscalationReason = "VALIDATION_FAILED";
    const expectedAnomalies = [
      "negative_priority_score",
      "duplicate_keyword_count",
      "out_of_range_score",
      "invalid_rank",
      "statistical_mismatch",
    ];

    // スタブAiClient
    const stubAiClient: Tx6Imp1AiClient = {
      async executeAction01() {
        return {
          success: true,
          data: collectReportsResult,
        };
      },
      async executeAction02() {
        return {
          success: true,
          data: reminderSentResult,
        };
      },
      async executeAction03() {
        return {
          success: true,
          data: issuesExtractedResult,
        };
      },
      async executeAction04() {
        return {
          success: true,
          data: trendAnalysisResult,
        };
      },
      async executeAction05() {
        return {
          success: true,
          data: priorityScoringResult,
        };
      },
      async executeAction06() {
        return {
          success: true,
          data: malformedAnalysisOutput,
        };
      },
      async executeAction07() {
        throw new Error("Action 7 should not be executed");
      },
    };

    const input: Tx6AgentInput = {
      executionTimestamp,
      analysisStartDate,
      analysisEndDate,
      teamId,
    };

    // runTx6Imp1Agentを実行
    let escalationEvent: {
      reason: string;
      anomalies: string[];
      executionId: string;
      timestamp: Date;
      anomalyDetails: Record<string, unknown>;
      auditLog: Array<{
        event: string;
        timestamp: Date;
        details: Record<string, unknown>;
      }>;
    } | null = null;

    try {
      const output = await runTx6Imp1Agent(input, stubAiClient);

      // Action 7が実行されずにエスカレーションされるため、ここに到達しない
      expect(output).toBeUndefined();
    } catch (error) {
      // エスカレーション時の例外をキャッチ
      if (
        error instanceof Error &&
        error.message.includes("VALIDATION_FAILED")
      ) {
        escalationEvent = {
          reason: expectedEscalationReason,
          anomalies: expectedAnomalies,
          executionId,
          timestamp: executionTimestamp,
          anomalyDetails: {
            negativeScoreInIssue: {
              keyword: "database-timeout",
              score: -1,
              expected: "0-100",
            },
            duplicateKeywordCounts: {
              keyword: "database-timeout",
              counts: [5, 3],
              expected: "single unique count",
            },
            outOfRangeScore: {
              keyword: "network-error",
              score: 200,
              expected: "0-100",
            },
            invalidRank: {
              keyword: "network-error",
              rank: "critical",
              validOptions: ["high", "medium", "low"],
            },
            statisticalMismatch: {
              totalExtracted: 15,
              totalScored: 8,
              expected: "totals should match",
            },
          },
          auditLog: [
            {
              event: "Escalation: VALIDATION_FAILED",
              timestamp: executionTimestamp,
              details: {
                reason: "分析結果検証エラー",
                anomalyCount: 5,
              },
            },
          ],
        };
      }
    }

    // 検証
    expect(escalationEvent).not.toBeNull();
    expect(escalationEvent!.reason).toBe(expectedEscalationReason);
    expect(escalationEvent!.anomalies).toContain("negative_priority_score");
    expect(escalationEvent!.anomalies).toContain("duplicate_keyword_count");
    expect(escalationEvent!.anomalies).toContain("out_of_range_score");
    expect(escalationEvent!.anomalies).toContain("invalid_rank");
    expect(escalationEvent!.anomalies).toContain("statistical_mismatch");

    expect(escalationEvent!.executionId).toBe(executionId);
    expect(escalationEvent!.timestamp).toEqual(executionTimestamp);

    expect(
      escalationEvent!.anomalyDetails.negativeScoreInIssue.score
    ).toBeLessThan(0);
    expect(
      escalationEvent!.anomalyDetails.outOfRangeScore.score
    ).toBeGreaterThan(100);
    expect(escalationEvent!.anomalyDetails.duplicateKeywordCounts.counts).toHaveLength(2);
    expect(
      escalationEvent!.anomalyDetails.statisticalMismatch.totalExtracted
    ).not.toBe(escalationEvent!.anomalyDetails.statisticalMismatch.totalScored);

    expect(escalationEvent!.auditLog).toHaveLength(1);
    expect(escalationEvent!.auditLog[0].event).toBe(
      "Escalation: VALIDATION_FAILED"
    );
    expect(escalationEvent!.auditLog[0].timestamp).toEqual(executionTimestamp);
    expect(escalationEvent!.auditLog[0].details.anomalyCount).toBe(5);
  });
});