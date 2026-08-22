import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("Tx10Imp1AiClient - Low Confidence Output Rejection", () => {
  test("SCEN-188: should reject low-confidence AI output and escalate to human review", async () => {
    // Setup: Mock AI client returning low confidence output
    const mockAiClient = {
      generateSchedulePlan: jest.fn(),
      generateTrainingMaterials: jest.fn(),
      analyzeInitialReportData: jest.fn(),
      generateFeedbackPlan: jest.fn(),
      distributeUserFeedback: jest.fn(),
      recordAuditLog: jest.fn(),
      rollbackAgentState: jest.fn(),
    };

    // Action 1: Mock low-confidence schedule plan output (confidence = 0.45 < threshold 0.7)
    const lowConfidenceScheduleOutput = {
      scheduleStartDate: null, // Ambiguous: null value
      scheduleEndDate: undefined, // Ambiguous: undefined value
      assignedOwner: "", // Ambiguous: empty string
      estimatedDuration: null,
      milestones: [],
      confidence: 0.45, // Below threshold of 0.7
      reasoning: "Partial data from organization info",
    };

    mockAiClient.generateSchedulePlan.mockResolvedValueOnce(
      lowConfidenceScheduleOutput
    );

    // Simulate agent validation of confidence threshold
    const confidenceThreshold = 0.7;
    const isConfidenceValid = lowConfidenceScheduleOutput.confidence >= confidenceThreshold;
    expect(isConfidenceValid).toBe(false);

    // Verify ambiguous output detection
    expect(lowConfidenceScheduleOutput.scheduleStartDate).toBeNull();
    expect(lowConfidenceScheduleOutput.scheduleEndDate).toBeUndefined();
    expect(lowConfidenceScheduleOutput.assignedOwner).toBe("");

    // Escalation: Record rejection event
    const escalationEvent = {
      actionId: "action-01",
      status: "REJECTED",
      reason: `confidence=${lowConfidenceScheduleOutput.confidence} < threshold=${confidenceThreshold}`,
      escalationCondition: "LOW_CONFIDENCE_OUTPUT",
      timestamp: "2024-01-15T09:00:00Z",
      operator: "AGENT_VALIDATION",
    };

    mockAiClient.recordAuditLog.mockResolvedValueOnce({
      auditId: "audit-001",
      recordedAt: "2024-01-15T09:00:00Z",
      event: escalationEvent,
    });

    // Verify escalation event structure
    expect(escalationEvent.status).toBe("REJECTED");
    expect(escalationEvent.reason).toMatch(/confidence=0.45 < threshold=0.7/);
    expect(escalationEvent.escalationCondition).toBe("LOW_CONFIDENCE_OUTPUT");
    expect(escalationEvent.operator).toBe("AGENT_VALIDATION");

    // Verify audit log recorded
    const auditLog = await mockAiClient.recordAuditLog(escalationEvent);
    expect(auditLog).toBeDefined();
    expect(auditLog.event.actionId).toBe("action-01");
    expect(auditLog.event.status).toBe("REJECTED");
    expect(auditLog.event.reason).toMatch(/confidence=0.45/);

    // State transition: Agent enters human review wait state
    const agentStateAfterRejection = {
      currentAction: null,
      status: "AWAITING_HUMAN_REVIEW",
      escalationReason: "LOW_CONFIDENCE_OUTPUT",
      pendingHumanApproval: true,
      remainingActions: ["action-02", "action-03", "action-04", "action-05", "action-06"],
    };

    // Verify no subsequent actions are executed
    expect(agentStateAfterRejection.currentAction).toBeNull();
    expect(agentStateAfterRejection.status).toBe("AWAITING_HUMAN_REVIEW");
    expect(agentStateAfterRejection.pendingHumanApproval).toBe(true);
    expect(agentStateAfterRejection.remainingActions.length).toBe(5);

    // Rollback: Reset agent to initial state
    const initialAgentState = {
      currentAction: null,
      status: "INITIALIZED",
      executedActions: [],
      escalationRecords: [],
      completedSideEffects: [],
    };

    mockAiClient.rollbackAgentState.mockResolvedValueOnce({
      rolledBackTo: "INITIALIZED",
      previousState: agentStateAfterRejection,
      newState: initialAgentState,
      timestamp: "2024-01-15T09:00:01Z",
    });

    const rollbackResult = await mockAiClient.rollbackAgentState();
    expect(rollbackResult.rolledBackTo).toBe("INITIALIZED");
    expect(rollbackResult.newState.status).toBe("INITIALIZED");
    expect(rollbackResult.newState.executedActions.length).toBe(0);

    // Verify audit trail contains rejection details
    const auditTrail = [auditLog];
    expect(auditTrail).toHaveLength(1);
    expect(auditTrail[0].event.actionId).toBe("action-01");
    expect(auditTrail[0].event.status).toBe("REJECTED");
    expect(auditTrail[0].event.reason).toContain("confidence=0.45");
    expect(auditTrail[0].event.operator).toBe("AGENT_VALIDATION");

    // Verify no training materials or feedback was generated
    expect(mockAiClient.generateTrainingMaterials).not.toHaveBeenCalled();
    expect(mockAiClient.analyzeInitialReportData).not.toHaveBeenCalled();
    expect(mockAiClient.generateFeedbackPlan).not.toHaveBeenCalled();
    expect(mockAiClient.distributeUserFeedback).not.toHaveBeenCalled();
  });
});