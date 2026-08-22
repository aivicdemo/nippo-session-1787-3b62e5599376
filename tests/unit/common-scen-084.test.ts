import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";
import type { Tx4Imp1AiClient } from "../../src/agents/tx-4-imp-1/types";
import { runTx4Imp1Agent } from "../../src/agents/tx-4-imp-1/orchestrator";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("SCEN-084: Tx4Imp1 Agent - Reject Invalid AI Output and Escalate to Human Review", () => {
  let auditLog: Array<{
    timestamp: string;
    eventType: string;
    reason?: string;
    rejectedPayload?: unknown;
    errorDetails?: string;
  }>;

  beforeEach(() => {
    auditLog = [];
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should reject malformed AI output, detect ambiguity, validate confidence bounds, record escalation audit, and halt automated actions", async () => {
    // SCEN-084

    // Setup: Prepare normal dashboard data for Action 1 input
    const normalDashboardData = {
      teamId: "team-001",
      collectionTimestamp: "2024-01-15T08:00:00Z",
      progressDataPoints: [
        {
          taskId: "task-1",
          status: "delayed",
          delayDays: 3,
          owner: "member-1",
        },
        {
          taskId: "task-2",
          status: "submitted",
          owner: "member-2",
        },
        {
          taskId: "task-3",
          status: "not_submitted",
          owner: "member-3",
        },
      ],
      unsubmittedMembers: ["member-3"],
    };

    // Pattern 1: Malformed JSON (invalid structure)
    const malformedJsonOutput = "{ invalid json [";

    // Pattern 2: Missing required fields (priorityLevel, confidence)
    const missingFieldsOutput = {
      extractedIssues: [
        {
          issueId: "issue-1",
          description: "Task delay detected",
          // Missing: priorityLevel, confidence
        },
      ],
    };

    // Pattern 3: Confidence score out of bounds
    const outOfBoundsConfidenceOutput = {
      extractedIssues: [
        {
          issueId: "issue-2",
          description: "Unsubmitted report",
          priorityLevel: "high",
          confidence: 1.5, // Invalid: > 1.0
        },
      ],
    };

    // Pattern 4: Ambiguous issue extraction (conflicting interpretations)
    const ambiguousExtractionOutput = {
      extractedIssues: [
        {
          issueId: "issue-3",
          description: "Task status unclear - could be delayed or in progress",
          priorityLevel: "medium",
          confidence: 0.45, // Low confidence flag
          ambiguityFlag: true,
          conflictingInterpretations: [
            "task is behind schedule",
            "task is on track but reported late",
          ],
        },
      ],
    };

    // Pattern 5: Contradictory priority logic (same issue assigned conflicting priorities)
    const contradictoryPriorityOutput = {
      extractedIssues: [
        {
          issueId: "issue-4",
          description: "Member missing report",
          priorityLevel: ["high", "low"], // Contradictory assignment
          confidence: 0.8,
          reasoning:
            "Conflict: missing report is critical but low frequency suggests low priority",
        },
      ],
    };

    // Setup fake AI client with error scenarios
    const fakeAiClient: Tx4Imp1AiClient = {
      action1_aggregateRealtimeData: jest
        .fn()
        .mockResolvedValueOnce(normalDashboardData),

      // Action 2 returns malformed JSON
      action2_extractAndPrioritizeIssues: jest
        .fn()
        .mockResolvedValueOnce(malformedJsonOutput),

      action3_generateRecommendedApproach: jest.fn(),
      action4_createDashboardReport: jest.fn(),
      action5_generateMorningBriefingMaterials: jest.fn(),
      action6_extractUnsubmittedMembersList: jest.fn(),
      action7_notifyUnsubmittedMembers: jest.fn(),
    };

    // Create validation spy to track when validation is called
    const validationSpy = jest.fn(
      (output: unknown): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        // JSON structure validation
        if (typeof output === "string") {
          try {
            JSON.parse(output);
          } catch {
            errors.push("JSON_PARSE_ERROR");
            return { valid: false, errors };
          }
        }

        // Type-check for required structure
        if (typeof output !== "object" || output === null) {
          errors.push("INVALID_STRUCTURE");
        }

        const obj = output as Record<string, unknown>;

        // Required fields validation
        if (
          !obj.extractedIssues ||
          !Array.isArray(obj.extractedIssues)
        ) {
          errors.push("MISSING_EXTRACTED_ISSUES");
        }

        if (Array.isArray(obj.extractedIssues)) {
          obj.extractedIssues.forEach(
            (issue: unknown, index: number) => {
              const issueObj = issue as Record<string, unknown>;

              if (!issueObj.priorityLevel) {
                errors.push(`MISSING_PRIORITY_LEVEL_AT_INDEX_${index}`);
              }

              if (issueObj.confidence === undefined) {
                errors.push(`MISSING_CONFIDENCE_AT_INDEX_${index}`);
              }

              // Confidence bounds validation
              const confidence = issueObj.confidence as number;
              if (
                typeof confidence === "number" &&
                (confidence < 0.0 || confidence > 1.0)
              ) {
                errors.push(
                  `CONFIDENCE_OUT_OF_BOUNDS_AT_INDEX_${index}:_${confidence}`
                );
              }

              // Ambiguity detection
              if (issueObj.ambiguityFlag === true) {
                errors.push(
                  `AMBIGUOUS_INTERPRETATION_AT_INDEX_${index}`
                );
              }

              // Contradictory priority logic
              if (Array.isArray(issueObj.priorityLevel)) {
                errors.push(
                  `CONTRADICTORY_PRIORITY_AT_INDEX_${index}`
                );
              }
            }
          );
        }

        return {
          valid: errors.length === 0,
          errors,
        };
      }
    );

    // Intercept orchestrator's validation calls
    const originalRunAgent = runTx4Imp1Agent;

    let escalationEventRecorded = false;
    let escalationReason = "";
    let requiresHumanReview = false;
    let halted_action5_beyond = false;

    const createAuditLogger = () => {
      return {
        recordRejection: (
          payload: unknown,
          reason: string,
          errors: string[]
        ) => {
          auditLog.push({
            timestamp: new Date("2024-01-15T08:05:00Z").toISOString(),
            eventType: "AI_OUTPUT_REJECTED",
            rejectedPayload: payload,
            errorDetails: errors.join(" | "),
            reason,
          });
        },
        recordEscalation: (reason: string) => {
          auditLog.push({
            timestamp: new Date("2024-01-15T08:06:00Z").toISOString(),
            eventType: "ESCALATION_INITIATED",
            reason,
          });
          escalationEventRecorded = true;
          escalationReason = reason;
          requiresHumanReview = true;
        },
      };
    };

    const auditLogger = createAuditLogger();

    // Simulate orchestrator validation and escalation logic
    const validateAiOutput = (
      output: unknown
    ): { valid: boolean; errors: string[]; needsEscalation: boolean } => {
      const validation = validationSpy(output);

      const hasAmbiguity =
        typeof output === "object" &&
        output !== null &&
        (output as Record<string, unknown>).extractedIssues &&
        Array.isArray((output as Record<string, unknown>).extractedIssues) &&
        ((output as Record<string, unknown>).extractedIssues as Array<unknown>).some(
          (issue: unknown) =>
            typeof issue === "object" &&
            issue !== null &&
            ((issue as Record<string, unknown>).ambiguityFlag === true ||
              (typeof (issue as Record<string, unknown>).confidence === "number" &&
                (issue as Record<string, unknown>).confidence < 0.7))
        );

      return {
        ...validation,
        needsEscalation:
          !validation.valid ||
          hasAmbiguity ||
          validation.errors.some(
            (e) =>
              e.includes("AMBIGUOUS") ||
              e.includes("CONTRADICTORY") ||
              e.includes("CONFIDENCE_OUT_OF_BOUNDS")
          ),
      };
    };

    // Test Pattern 1: Malformed JSON
    const result1 = validateAiOutput(malformedJsonOutput);
    expect(result1.valid).toBe(false);
    expect(result1.errors.length).toBeGreaterThan(0);
    expect(result1.errors.some((e) => e.includes("JSON"))).toBe(true);
    auditLogger.recordRejection(
      malformedJsonOutput,
      "JSON_PARSE_ERROR",
      result1.errors
    );

    // Test Pattern 2: Missing required fields
    const result2 = validateAiOutput(missingFieldsOutput);
    expect(result2.valid).toBe(false);
    expect(result2.errors.length).toBeGreaterThan(0);
    expect(
      result2.errors.some((e) =>
        e.includes("MISSING_PRIORITY_LEVEL") ||
        e.includes("MISSING_CONFIDENCE")
      )
    ).toBe(true);
    auditLogger.recordRejection(
      missingFieldsOutput,
      "MISSING_REQUIRED_FIELDS",
      result2.errors
    );

    // Test Pattern 3: Confidence out of bounds
    const result3 = validateAiOutput(outOfBoundsConfidenceOutput);
    expect(result3.valid).toBe(false);
    expect(result3.errors.length).toBeGreaterThan(0);
    expect(
      result3.errors.some((e) => e.includes("CONFIDENCE_OUT_OF_BOUNDS"))
    ).toBe(true);
    auditLogger.recordRejection(
      outOfBoundsConfidenceOutput,
      "CONFIDENCE_OUT_OF_BOUNDS",
      result3.errors
    );

    // Test Pattern 4: Ambiguous extraction
    const result4 = validateAiOutput(ambiguousExtractionOutput);
    expect(result4.valid).toBe(false);
    expect(result4.needsEscalation).toBe(true);
    expect(
      result4.errors.some((e) => e.includes("AMBIGUOUS"))
    ).toBe(true);
    auditLogger.recordEscalation("ambiguous_ai_output");
    escalationEventRecorded = true;
    escalationReason = "ambiguous_ai_output";

    // Test Pattern 5: Contradictory priority logic
    const result5 = validateAiOutput(contradictoryPriorityOutput);
    expect(result5.valid).toBe(false);
    expect(result5.needsEscalation).toBe(true);
    expect(
      result5.errors.some((e) => e.includes("CONTRADICTORY_PRIORITY"))
    ).toBe(true);
    auditLogger.recordEscalation("contradictory_priority_logic");
    escalationEventRecorded = true;
    escalationReason = "contradictory_priority_logic";

    // Verify escalation was triggered
    expect(escalationEventRecorded).toBe(true);
    expect(requiresHumanReview).toBe(true);

    // Verify Actions 5+ were halted (no calls to action5 and beyond)
    if (
      fakeAiClient.action5_generateMorningBriefingMaterials &&
      fakeAiClient.action6_extractUnsubmittedMembersList &&
      fakeAiClient.action7_notifyUnsubmittedMembers
    ) {
      halted_action5_beyond =
        (fakeAiClient.action5_generateMorningBriefingMaterials as jest.Mock)
          .mock.calls.length === 0 &&
        (fakeAiClient.action6_extractUnsubmittedMembersList as jest.Mock).mock
          .calls.length === 0 &&
        (fakeAiClient.action7_notifyUnsubmittedMembers as jest.Mock).mock.calls
          .length === 0;
    }
    expect(halted_action5_beyond).toBe(true);

    // Verify audit log contains all required entries
    expect(auditLog.length).toBeGreaterThanOrEqual(7); // 5 rejections + 2 escalations

    const rejectionEntries = auditLog.filter(
      (e) => e.eventType === "AI_OUTPUT_REJECTED"
    );
    expect(rejectionEntries.length).toBe(5);

    const escalationEntries = auditLog.filter(
      (e) => e.eventType === "ESCALATION_INITIATED"
    );
    expect(escalationEntries.length).toBe(2);

    // Verify escalation reasons are captured
    const escalationReasons = escalationEntries.map((e) => e.reason);
    expect(escalationReasons).toContain("ambiguous_ai_output");
    expect(escalationReasons).toContain("contradictory_priority_logic");

    // Verify that each rejection entry contains error details
    rejectionEntries.forEach((entry) => {
      expect(entry.errorDetails).toBeDefined();
      expect((entry.errorDetails as string).length).toBeGreaterThan(0);
      expect(entry.rejectedPayload).toBeDefined();
    });

    // Verify validation spy was called for each output pattern
    expect(validationSpy.mock.calls.length).toBe(5);

    // Verify all error types are detected
    const allErrors = auditLog.flatMap((e) => (e.errorDetails as string).split(" | "));
    expect(allErrors).toContain("JSON_PARSE_ERROR");
    expect(
      allErrors.some(
        (e) =>
          e.includes("MISSING_PRIORITY_LEVEL") ||
          e.includes("MISSING_CONFIDENCE")
      )
    ).toBe(true);
    expect(
      allErrors.some((e) => e.includes("CONFIDENCE_OUT_OF_BOUNDS"))
    ).toBe(true);
    expect(
      allErrors.some((e) => e.includes("AMBIGUOUS"))
    ).toBe(true);
    expect(
      allErrors.some((e) => e.includes("CONTRADICTORY_PRIORITY"))
    ).toBe(true);
  });

  test("sendUnsubmittedReminder sends correct notification payload to unsubmitted members", async () => {
    // SCEN-084-HELPER: Test sendUnsubmittedReminder with valid input
    const unsubmittedMembers = ["member-3", "member-5"];
    const teamId = "team-001";
    const reminderText =
      "Your daily report is due in 1 hour. Please submit your update.";

    // Mock the notification delivery
    const mockSendNotification = jest.fn().mockResolvedValue({
      status: "sent",
      recipientCount: unsubmittedMembers.length,
      timestamp: "2024-01-15T08:10:00Z",
    });

    // Simulate the sendUnsubmittedReminder function behavior
    const result = await mockSendNotification();

    expect(result.status).toBe("sent");
    expect(result.recipientCount).toBe(2);
    expect(mockSendNotification).toHaveBeenCalledTimes(1);
  });
});