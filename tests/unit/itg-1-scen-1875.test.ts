import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx7Imp1Agent } from "../../src/agents/tx-7-imp-1/orchestrator";
import type {
  Tx7Imp1AgentInput,
  Tx7Imp1AgentOutput,
  Tx7Imp1AiClient,
} from "../../src/agents/tx-7-imp-1/orchestrator";

describe("朝会報告管理システム - 月次課題傾向分析レポート生成", () => {
  // SCEN-1875
  test("月初レポート生成時に複数PM候補から通知対象PMが一意に特定される", async () => {
    // ========== テストデータセット準備 ==========
    const targetMonth = "2024-01";
    const triggerTimestamp = new Date("2024-01-01T09:00:00Z");
    const managerUserId = "mgr_00001";

    // 複数のプロジェクトマネージャー候補
    const pmCandidates = [
      { pm_id: "pm_00123", authority_level: 2, name: "PM Alpha" },
      { pm_id: "pm_00124", authority_level: 1, name: "PM Beta" },
      { pm_id: "pm_00125", authority_level: 1, name: "PM Gamma" },
    ];

    // 複数PM参照を含む課題データ
    const reportedIssuesWithPmRefs = [
      {
        issue_id: "iss_001",
        title: "Database performance degradation",
        pm_responsible: ["pm_00123", "pm_00124"],
        frequency: 5,
        impact_level: "high",
        days_to_resolve: 3,
      },
      {
        issue_id: "iss_002",
        title: "API timeout under load",
        pm_responsible: ["pm_00124", "pm_00125"],
        frequency: 3,
        impact_level: "medium",
        days_to_resolve: 2,
      },
      {
        issue_id: "iss_003",
        title: "Documentation incomplete",
        pm_responsible: ["pm_00123"],
        frequency: 2,
        impact_level: "low",
        days_to_resolve: 1,
      },
    ];

    // ========== Tx7Imp1AiClient スタブの準備 ==========
    const aiClientStub: Tx7Imp1AiClient = {
      executeAction01: async (prompt: string) => {
        // Action 1: レポート生成トリガー確認
        return {
          is_monthly_trigger: true,
          trigger_date: "2024-01-01",
          trigger_reason: "scheduled",
        };
      },

      executeAction02: async (prompt: string) => {
        // Action 2: 蓄積報告データ抽出
        return {
          extracted_record_count: 3,
          target_month: "2024-01",
          records: reportedIssuesWithPmRefs,
          has_multiple_pm_refs: true,
          data_quality_score: 0.92,
        };
      },

      executeAction03: async (prompt: string) => {
        // Action 3: レポート生成処理
        return {
          report_id: "rpt_2024_01_001",
          report_title: "Monthly Issue Trend Analysis - January 2024",
          pm_candidates: pmCandidates,
          pm_candidate_count: 3,
          issue_summary_count: 3,
        };
      },

      executeAction04: async (prompt: string) => {
        // Action 4: 時系列変化分析
        return {
          daily_metrics: [
            { date: "2024-01-01", bottleneck_severity: 0.3 },
            { date: "2024-01-15", bottleneck_severity: 0.5 },
            { date: "2024-01-31", bottleneck_severity: 0.4 },
          ],
          trend_direction: "stable",
        };
      },

      executeAction05: async (prompt: string) => {
        // Action 5: ボトルネック推移分析
        return {
          bottleneck_pattern: "recurring",
          top_recurring_issues: [
            "Database performance degradation",
            "API timeout under load",
          ],
          resolution_time_avg: 2.5,
        };
      },

      executeAction06: async (prompt: string) => {
        // Action 6: チーム別パフォーマンス指標
        return {
          team_metrics: {
            issue_resolution_speed: 2.5,
            report_submission_rate: 0.95,
            issue_recurrence_rate: 0.18,
          },
        };
      },

      executeAction07: async (prompt: string) => {
        // Action 7: 優先度付け分析結果作成 + PM一意特定
        return {
          prioritized_challenges: [
            {
              challenge_id: "chl_001",
              title: "Database performance degradation",
              priority_score: 85,
              occurrence_frequency: 5,
              impact_level: "high",
              resolution_days_average: 3,
            },
            {
              challenge_id: "chl_002",
              title: "API timeout under load",
              priority_score: 72,
              occurrence_frequency: 3,
              impact_level: "medium",
              resolution_days_average: 2,
            },
          ],
          selected_notify_pm_id: "pm_00123",
          selection_reason:
            "Highest authority level (authority_level=2) and primary responsible for top-priority issues",
          pm_selection_confidence: 0.98,
        };
      },

      executeAction08: async (prompt: string) => {
        // Action 8: 部長への分析レポート提示
        return {
          delivery_status: "queued_for_delivery",
          recipient_user_id: "pm_00123",
          report_package_id: "pkg_2024_01_001",
        };
      },
    };

    // ========== runTx7Imp1Agent を呼び出す ==========
    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp,
      targetMonth,
      managerUserId,
      includeDetailedAnalysis: true,
    };

    const result: Tx7Imp1AgentOutput = await runTx7Imp1Agent(
      agentInput,
      aiClientStub
    );

    // ========== 結果を検証 ==========

    // 1. レポートID が生成されている
    expect(result.reportId).toBe("rpt_2024_01_001");

    // 2. 実行ステータスが success
    expect(result.executionStatus).toBe("success");

    // 3. 分析結果サマリーが存在する
    expect(result.analysisResultSummary).toBeDefined();

    // 4. 優先度付き課題が上位5件以内
    const prioritizedChallenges =
      result.analysisResultSummary.topPriorityChallenges;
    expect(prioritizedChallenges.length).toBeLessThanOrEqual(5);
    expect(prioritizedChallenges.length).toBeGreaterThan(0);

    // 5. 最上位課題の優先度スコアが 85
    expect(prioritizedChallenges[0].priorityScore).toBe(85);
    expect(prioritizedChallenges[0].occurrenceFrequency).toBe(5);
    expect(prioritizedChallenges[0].impactLevel).toBe("high");
    expect(prioritizedChallenges[0].resolutionDaysAverage).toBe(3);

    // 6. 2番目の課題の優先度スコアが 72
    expect(prioritizedChallenges[1].priorityScore).toBe(72);
    expect(prioritizedChallenges[1].occurrenceFrequency).toBe(3);
    expect(prioritizedChallenges[1].impactLevel).toBe("medium");
    expect(prioritizedChallenges[1].resolutionDaysAverage).toBe(2);

    // 7. ボトルネック傾向分析が存在する
    const bottleneckTrend = result.analysisResultSummary.bottleneckTrend;
    expect(bottleneckTrend).toBeDefined();

    // 8. 日次ボトルネック深刻度推移が 3 日分記録されている
    expect(bottleneckTrend.timeSeriesData.length).toBe(3);
    expect(bottleneckTrend.timeSeriesData[0].date).toMatch(/2024-01-01/);
    expect(bottleneckTrend.timeSeriesData[1].date).toMatch(/2024-01-15/);
    expect(bottleneckTrend.timeSeriesData[2].date).toMatch(/2024-01-31/);

    // 9. ボトルネック改善傾向が "stable"
    expect(bottleneckTrend.improvementTrend).toBe("stable");

    // 10. 繰り返し発生課題キーワードが 2 件
    expect(bottleneckTrend.recurringIssuePattern.length).toBe(2);
    expect(bottleneckTrend.recurringIssuePattern[0]).toBe(
      "Database performance degradation"
    );

    // 11. チーム別パフォーマンス指標が存在する
    const performanceMetrics =
      result.analysisResultSummary.performanceMetrics;
    expect(performanceMetrics).toBeDefined();

    // 12. 課題解決速度が 2.5 日
    expect(performanceMetrics.issue_resolution_speed).toBe(2.5);

    // 13. 報告提出率が 95%
    expect(performanceMetrics.report_submission_rate).toBe(0.95);

    // 14. 課題再発率が 18%
    expect(performanceMetrics.issue_recurrence_rate).toBe(0.18);

    // 15. ★ 最重要: 通知対象PM が pm_00123 に一意に特定されている
    expect(result.analysisResultSummary.notifyTargetPmId).toBe("pm_00123");

    // 16. ★ PM特定の根拠が記録されている
    expect(result.analysisResultSummary.pmSelectionReason).toBe(
      "Highest authority level (authority_level=2) and primary responsible for top-priority issues"
    );

    // 17. PM特定信頼度が 98%
    expect(result.analysisResultSummary.pmSelectionConfidence).toBe(0.98);

    // 18. 複数PM候補数が正確に 3
    expect(result.analysisResultSummary.pmCandidateCount).toBe(3);

    // 19. 抽出レコード数が 3
    expect(result.analysisResultSummary.extractedRecordCount).toBe(3);

    // 20. データ品質スコアが 92%
    expect(result.analysisResultSummary.dataQualityScore).toBe(0.92);

    // 21. 配信タイムスタンプが有効な ISO 8601 日付
    expect(result.deliveryTimestamp).toBeInstanceOf(Date);
    expect(result.deliveryTimestamp.toISOString()).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );

    // 22. NotificationServiceAdapter への通知対象が複数でなく単一 PM
    // （実装内部で NotificationServiceAdapter.sendReminderNotification が呼ばれた場合、
    //   recipientUserId が単一の文字列 pm_00123 であり、配列でないことを確認）
    expect(typeof result.analysisResultSummary.notifyTargetPmId).toBe(
      "string"
    );
    expect(result.analysisResultSummary.notifyTargetPmId).not.toContain(",");
  });
});