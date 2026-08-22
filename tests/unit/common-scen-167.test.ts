import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import type { Tx9Imp1AiClient } from "../../src/agents/tx-9-imp-1/ai-client";
import { runTx9Imp1Agent } from "../../src/agents/tx-9-imp-1/orchestrator";
import { calculateProductivityMetrics } from "../../src/logic/analysis-reporting";

describe("tx-9-imp-1: 日報集約から分析報告までの自動実行エージェント", () => {
  // SCEN-167
  test("データ品質が低い場合、副作用確定前に人へ引き継ぐ", async () => {
    // Arrange
    const audit_events: Array<{
      timestamp: string;
      userId: string;
      escalationReason: string;
      dataQualityMetrics: Record<string, number>;
      escalatedToRole: string;
    }> = [];

    const mock_ai_client: Tx9Imp1AiClient = {
      action01_aggregateReportData: jest
        .fn()
        .mockResolvedValue({
          aggregated_reports: [
            {
              report_id: "rep_001",
              member_id: "mem_001",
              tasks_completed: 5,
              issues_reported: 2,
              timestamp: "2024-01-15T09:00:00Z",
            },
            {
              report_id: "rep_002",
              member_id: "mem_002",
              tasks_completed: 3,
              issues_reported: 1,
              timestamp: "2024-01-15T09:15:00Z",
            },
          ],
          period_start: "2024-01-08T00:00:00Z",
          period_end: "2024-01-15T00:00:00Z",
        }),
      action02_identifyNonSubmitters: jest
        .fn()
        .mockResolvedValue({
          non_submitters: ["mem_003", "mem_004"],
          reminder_notifications_sent: 2,
        }),
      action03_validateDataQuality: jest.fn().mockResolvedValue({
        quality_score: 0.45,
        missing_rate: 0.35,
        malformed_count: 3,
        requires_escalation: true,
        escalation_reason: "DATA_QUALITY_LOW_OR_INCOMPLETE",
      }),
      action04_classifyAndAnalyzeIssues: jest
        .fn()
        .mockResolvedValue({}),
      action05_proposeImprovementMeasures: jest
        .fn()
        .mockResolvedValue({}),
      action06_generateAnalysisReport: jest
        .fn()
        .mockResolvedValue({}),
      action07_notifyManager: jest.fn().mockResolvedValue({}),
    };

    const escalation_checkpoint = jest.fn().mockImplementation(
      (quality_data: {
        quality_score: number;
        missing_rate: number;
        malformed_count: number;
      }) => {
        if (quality_data.quality_score < 0.7) {
          return {
            escalationReason: "DATA_QUALITY_LOW_OR_INCOMPLETE",
            requiresHumanReview: true,
          };
        }
        return {
          escalationReason: null,
          requiresHumanReview: false,
        };
      }
    );

    const record_audit_event = jest.fn().mockImplementation(
      (event: {
        timestamp: string;
        userId: string;
        escalationReason: string;
        dataQualityMetrics: Record<string, number>;
        escalatedToRole: string;
      }) => {
        audit_events.push(event);
      }
    );

    // Act
    const result = await runTx9Imp1Agent(
      {
        period_start: "2024-01-08T00:00:00Z",
        period_end: "2024-01-15T00:00:00Z",
        user_id: "usr_manager_001",
        audit_log_callback: record_audit_event,
        escalation_checkpoint_fn: escalation_checkpoint,
      },
      mock_ai_client
    );

    // Assert
    // 1. Action 3 (validateDataQuality) が呼び出されたことを確認
    expect(mock_ai_client.action03_validateDataQuality).toHaveBeenCalled();

    // 2. エスカレーション判定が実行されたことを確認
    expect(escalation_checkpoint).toHaveBeenCalledWith({
      quality_score: 0.45,
      missing_rate: 0.35,
      malformed_count: 3,
    });

    // 3. Action 4（課題分類）以降が実行されないことを確認
    expect(
      mock_ai_client.action04_classifyAndAnalyzeIssues
    ).not.toHaveBeenCalled();
    expect(
      mock_ai_client.action05_proposeImprovementMeasures
    ).not.toHaveBeenCalled();
    expect(
      mock_ai_client.action06_generateAnalysisReport
    ).not.toHaveBeenCalled();

    // 4. 監査イベントが記録されたことを確認
    expect(record_audit_event).toHaveBeenCalled();
    expect(audit_events).toHaveLength(1);
    const audit_event = audit_events[0];
    expect(audit_event.timestamp).toBeDefined();
    expect(audit_event.userId).toBe("usr_manager_001");
    expect(audit_event.escalationReason).toBe(
      "DATA_QUALITY_LOW_OR_INCOMPLETE"
    );
    expect(audit_event.dataQualityMetrics.quality_score).toBe(0.45);
    expect(audit_event.dataQualityMetrics.missing_rate).toBe(0.35);
    expect(audit_event.dataQualityMetrics.malformed_count).toBe(3);
    expect(audit_event.escalatedToRole).toBe("manager");

    // 5. エージェント戻り値の状態が ESCALATED_AWAITING_HUMAN_REVIEW であることを確認
    expect(result.status).toBe("ESCALATED_AWAITING_HUMAN_REVIEW");
    expect(result.pendingHumanAction).toBe(true);
    expect(result.escalationReason).toBe("DATA_QUALITY_LOW_OR_INCOMPLETE");
    expect(result.escalatedToRole).toBe("manager");
  });
});