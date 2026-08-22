import { runTx10Imp1Agent } from "../../src/agents/tx-10-imp-1/orchestrator";
import { type Tx10AgentInput, type Tx10AgentOutput } from "../../src/agents/tx-10-imp-1/types";
import { type Tx10Imp1AiClient } from "../../src/agents/tx-10-imp-1/ai-client";

describe("Tx10Imp1Agent Escalation - FEEDBACK_OUTLIER", () => {
  // SCEN-186
  test("should escalate and halt auto-distribution when initial feedback targets have outlier metrics", async () => {
    const deploymentInitiationTimestamp = new Date("2024-01-15T08:00:00Z");
    const reportingDeadlineTime = "09:00";

    const participantList = [
      {
        userId: "PM001",
        role: "ProjectManager",
        email: "pm001@example.com",
      },
      { userId: "MGR001", role: "Manager", email: "mgr001@example.com" },
      { userId: "ENG001", role: "Engineer", email: "eng001@example.com" },
      { userId: "ENG002", role: "Engineer", email: "eng002@example.com" },
      { userId: "ENG003", role: "Engineer", email: "eng003@example.com" },
      { userId: "ENG004", role: "Engineer", email: "eng004@example.com" },
      { userId: "ENG005", role: "Engineer", email: "eng005@example.com" },
      { userId: "ENG006", role: "Engineer", email: "eng006@example.com" },
      { userId: "ENG007", role: "Engineer", email: "eng007@example.com" },
      { userId: "ENG008", role: "Engineer", email: "eng008@example.com" },
      { userId: "ENG009", role: "Engineer", email: "eng009@example.com" },
      { userId: "ENG010", role: "Engineer", email: "eng010@example.com" },
    ];

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired: 5,
      reportingDeadlineTime,
    };

    const mockAiClient: Tx10Imp1AiClient = {
      action01_generateDeploymentSchedule: jest.fn().mockResolvedValue({
        status: "success",
        deployment_schedule: {
          start_date: "2024-01-20",
          phase_1_end_date: "2024-01-25",
          phase_2_end_date: "2024-02-01",
          phase_3_end_date: "2024-02-08",
          go_live_date: "2024-02-12",
        },
      }),

      action02_generateTrainingMaterials: jest.fn().mockResolvedValue({
        status: "success",
        training_materials: [
          {
            material_type: "department_head_guide",
            title: "朝会報告管理システム 部長向けガイド",
            content_url: "https://example.com/guide-mgr.pdf",
          },
          {
            material_type: "engineer_training",
            title: "朝会報告管理システム エンジニア向け研修教材",
            content_url: "https://example.com/training-eng.pdf",
          },
        ],
      }),

      action03_collectInitialReportData: jest.fn().mockResolvedValue({
        status: "success",
        submission_count: 11,
        submission_rate: 92,
        data_quality_results: {
          ENG001: { submission_rate: 100, data_quality_score: 85 },
          ENG002: { submission_rate: 100, data_quality_score: 80 },
          ENG003: { submission_rate: 100, data_quality_score: 78 },
          ENG004: { submission_rate: 100, data_quality_score: 75 },
          ENG005: { submission_rate: 100, data_quality_score: 82 },
          ENG006: { submission_rate: 100, data_quality_score: 28 },
          ENG007: { submission_rate: 45, data_quality_score: 35 },
          ENG008: { submission_rate: 100, data_quality_score: 72 },
          ENG009: { submission_rate: 100, data_quality_score: 80 },
          ENG010: { submission_rate: 100, data_quality_score: 88 },
          MGR001: { submission_rate: 100, data_quality_score: 92 },
        },
      }),

      action04_validateReportQuality: jest.fn().mockResolvedValue({
        status: "success",
        quality_validation: {
          overall_submission_rate: 92,
          overall_data_quality_score: 75,
          format_uniformity_score: 80,
          validation_passed: true,
        },
      }),

      action05_judgeInitialFeedback: jest.fn().mockResolvedValue({
        status: "escalation_required",
        escalation_flag: true,
        escalation_reason_code: "FEEDBACK_OUTLIER",
        escalation_details: {
          outlier_count: 2,
          affected_members: [
            {
              user_id: "ENG006",
              email: "eng006@example.com",
              data_quality_score: 28,
              quality_threshold: 30,
              submission_rate: 100,
              submission_threshold: 50,
              deviation_reason: "quality_score_below_threshold",
              risk_level: "high",
            },
            {
              user_id: "ENG007",
              email: "eng007@example.com",
              data_quality_score: 35,
              quality_threshold: 30,
              submission_rate: 45,
              submission_threshold: 50,
              deviation_reason: "submission_rate_below_threshold",
              risk_level: "high",
            },
          ],
          recommended_actions: [
            "individual_coaching_for_eng006",
            "submission_process_review_for_eng007",
          ],
        },
      }),

      action06_distributeApprovedFeedback: jest.fn(),
    };

    const recordEscalationStateMock = jest.fn().mockResolvedValue({
      escalation_id: "ESC-2024-001",
      escalation_status: "PENDING_HUMAN_REVIEW",
      escalation_reason: "FEEDBACK_OUTLIER",
      reviewed_at: null,
    });

    const auditLogMock = jest.fn().mockResolvedValue({
      audit_id: "AUD-2024-001",
      action: "ESCALATION_TRIGGERED",
      escalation_trigger: "FEEDBACK_OUTLIER",
      timestamp: new Date("2024-01-15T08:30:00Z").toISOString(),
    });

    const result: Tx10AgentOutput = await runTx10Imp1Agent(input, mockAiClient, {
      recordEscalationState: recordEscalationStateMock,
      auditLog: auditLogMock,
    });

    expect(result.status).toBe("ESCALATED");
    expect(result.escalation_reason).toBe("FEEDBACK_OUTLIER");
    expect(result.pending_human_action).toBeDefined();
    expect(result.pending_human_action?.department_head_review_required).toBe(
      true
    );
    expect(result.pending_human_action?.outlier_members).toHaveLength(2);
    expect(result.pending_human_action?.outlier_members?.[0]).toEqual({
      user_id: "ENG006",
      email: "eng006@example.com",
      data_quality_score: 28,
      quality_threshold: 30,
      submission_rate: 100,
      submission_threshold: 50,
      deviation_reason: "quality_score_below_threshold",
      risk_level: "high",
    });
    expect(result.pending_human_action?.outlier_members?.[1]).toEqual({
      user_id: "ENG007",
      email: "eng007@example.com",
      data_quality_score: 35,
      quality_threshold: 30,
      submission_rate: 45,
      submission_threshold: 50,
      deviation_reason: "submission_rate_below_threshold",
      risk_level: "high",
    });

    expect(recordEscalationStateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        escalation_reason: "FEEDBACK_OUTLIER",
        status: "PENDING_HUMAN_REVIEW",
        reviewed_at: null,
      })
    );

    expect(auditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ESCALATION_TRIGGERED",
        escalation_trigger: "FEEDBACK_OUTLIER",
      })
    );

    expect(mockAiClient.action06_distributeApprovedFeedback).not.toHaveBeenCalled();

    expect(mockAiClient.action01_generateDeploymentSchedule).toHaveBeenCalled();
    expect(mockAiClient.action02_generateTrainingMaterials).toHaveBeenCalled();
    expect(mockAiClient.action03_collectInitialReportData).toHaveBeenCalled();
    expect(mockAiClient.action04_validateReportQuality).toHaveBeenCalled();
    expect(mockAiClient.action05_judgeInitialFeedback).toHaveBeenCalled();

    expect(result.pending_human_action?.escalation_timestamp).toBeDefined();
    expect(
      typeof result.pending_human_action?.escalation_timestamp === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(
          result.pending_human_action.escalation_timestamp
        )
    ).toBe(true);
  });
});