import { runTx10Imp1Agent } from "../../src/agents/tx-10-imp-1/orchestrator";
import { type Tx10Imp1AiClient } from "../../src/agents/tx-10-imp-1/orchestrator";

describe("Tx10Imp1Agent - Onboarding Automation Integration", () => {
  // SCEN-187
  test(
    "escalation when system failure and operational rule change occur during action 5 execution",
    async () => {
      const mockAiClient: Tx10Imp1AiClient = {
        action01_generateDeploymentSchedule: jest
          .fn()
          .mockResolvedValue({
            schedule_id: "sched_001",
            start_date: "2024-02-01",
            phases: [
              {
                phase_name: "preparation",
                deadline: "2024-02-05",
              },
              {
                phase_name: "training",
                deadline: "2024-02-12",
              },
            ],
            full_operation_start_date: "2024-02-20",
          }),

        action02_generateTrainingMaterials: jest
          .fn()
          .mockResolvedValue({
            materials: [
              {
                target_role: "Manager",
                material_id: "mat_mgr_001",
                title: "Manager Operation Guide",
                content_url: "https://example.com/mgr_guide.pdf",
              },
              {
                target_role: "Engineer",
                material_id: "mat_eng_001",
                title: "Engineer Training Materials",
                content_url: "https://example.com/eng_training.pdf",
              },
            ],
          }),

        action03_analyzeInitialReportData: jest
          .fn()
          .mockResolvedValue({
            submission_rate: 85,
            data_quality_score: 78,
            format_uniformity_score: 82,
            report_samples: [
              {
                user_id: "user_001",
                submission_timestamp: "2024-02-01T09:30:00Z",
                quality_score: 78,
              },
            ],
          }),

        action04_createFeedbackCandidates: jest
          .fn()
          .mockResolvedValue({
            feedback_candidates: [
              {
                user_id: "user_002",
                issue_type: "missing_mandatory_field",
                recommended_action: "notify_resubmission",
                severity: "medium",
              },
              {
                user_id: "user_003",
                issue_type: "low_data_quality",
                recommended_action: "provide_training",
                severity: "low",
              },
            ],
            candidates_generated_at: "2024-02-01T10:00:00Z",
          }),

        action05_generateFeedbackProposal: jest.fn().mockRejectedValue({
          error_type: "SYSTEM_FAILURE",
          error_code: "DB_CONNECTION_TIMEOUT",
          error_message: "Database connection failed after 30s timeout",
          error_timestamp: "2024-02-01T10:15:00Z",
          operational_rule_change: {
            change_type: "MANDATORY_FIELD_ADDITION",
            previous_required_fields: 3,
            new_required_fields: 4,
            new_field_name: "escalation_category",
            effective_date: "2024-02-01T10:00:00Z",
            change_detected_at: "2024-02-01T10:14:00Z",
          },
        }),

        action06_distributeFeedbackToMembers: jest.fn(),
      };

      const deploymentInput = {
        deploymentInitiationTimestamp: new Date("2024-02-01T08:00:00Z"),
        participantList: [
          {
            userId: "pm_001",
            role: "ProjectManager",
            email: "pm@example.com",
          },
          {
            userId: "mgr_001",
            role: "Manager",
            email: "manager@example.com",
          },
          {
            userId: "eng_001",
            role: "Engineer",
            email: "engineer001@example.com",
          },
          {
            userId: "eng_002",
            role: "Engineer",
            email: "engineer002@example.com",
          },
        ],
        preparationDaysRequired: 5,
        reportingDeadlineTime: "09:00",
      };

      const auditLog: Array<{
        event_type: string;
        timestamp: string;
        escalation_reason?: string;
        handover_data?: Record<string, unknown>;
      }> = [];

      const originalConsoleError = console.error;
      console.error = jest.fn((message, data) => {
        if (
          message &&
          typeof message === "string" &&
          message.includes("ESCALATION_TRIGGERED")
        ) {
          auditLog.push({
            event_type: "ESCALATION_TRIGGERED",
            timestamp: new Date().toISOString(),
            escalation_reason: data?.reason,
            handover_data: data?.handover,
          });
        }
      });

      let result: {
        escalation_status?: string;
        handover_object?: Record<string, unknown>;
        error?: Error;
      } = {};

      try {
        result = await runTx10Imp1Agent(deploymentInput, mockAiClient);
      } catch (error) {
        result.error = error instanceof Error ? error : new Error(String(error));
      }

      console.error = originalConsoleError;

      expect(mockAiClient.action01_generateDeploymentSchedule).toHaveBeenCalled();
      expect(mockAiClient.action02_generateTrainingMaterials).toHaveBeenCalled();
      expect(mockAiClient.action03_analyzeInitialReportData).toHaveBeenCalled();
      expect(mockAiClient.action04_createFeedbackCandidates).toHaveBeenCalled();

      expect(mockAiClient.action05_generateFeedbackProposal).toHaveBeenCalled();

      expect(mockAiClient.action06_distributeFeedbackToMembers).not.toHaveBeenCalled();

      if (result.error) {
        expect(result.error.message).toMatch(/DB_CONNECTION_TIMEOUT|system|failure/i);
      } else if (result.escalation_status) {
        expect(result.escalation_status).toBe("AWAITING_HUMAN_REVIEW");
        expect(result.handover_object).toBeDefined();

        const handover = result.handover_object as Record<string, unknown>;
        expect(handover).toHaveProperty("action_5_input_data");
        expect(handover).toHaveProperty("system_failure_details");
        expect(handover).toHaveProperty("operational_rule_change");
        expect(handover).toHaveProperty("current_process_state");
        expect(handover).toHaveProperty("manager_approval_required");

        const systemFailureDetails = handover.system_failure_details as Record<
          string,
          unknown
        >;
        expect(systemFailureDetails.error_code).toBe("DB_CONNECTION_TIMEOUT");
        expect(systemFailureDetails.error_type).toBe("SYSTEM_FAILURE");

        const ruleChange = handover.operational_rule_change as Record<
          string,
          unknown
        >;
        expect(ruleChange.change_type).toBe("MANDATORY_FIELD_ADDITION");
        expect(ruleChange.new_required_fields).toBe(4);
        expect(ruleChange.previous_required_fields).toBe(3);
        expect(ruleChange.new_field_name).toBe("escalation_category");

        const processState = handover.current_process_state as Record<
          string,
          unknown
        >;
        expect(processState.action_number).toBe(5);
        expect(processState.action_name).toMatch(/feedback/i);
        expect(processState.status).toBe("INTERRUPTED");

        expect(handover.manager_approval_required).toBe(true);
      }

      expect(auditLog.length).toBeGreaterThanOrEqual(1);
      const escalationEvent = auditLog.find(
        (log) => log.event_type === "ESCALATION_TRIGGERED"
      );
      expect(escalationEvent).toBeDefined();
      expect(escalationEvent?.timestamp).toBeTruthy();
      expect(escalationEvent?.escalation_reason).toBeTruthy();
      expect(escalationEvent?.handover_data).toBeTruthy();

      const nonDistributedFeedbackUsers = ["user_002", "user_003"];
      expect(mockAiClient.action06_distributeFeedbackToMembers).not.toHaveBeenCalledWith(
        expect.objectContaining({
          user_ids: expect.arrayContaining(nonDistributedFeedbackUsers),
        })
      );
    }
  );
});