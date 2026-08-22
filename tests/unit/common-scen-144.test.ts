import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("notification-delivery", () => {
  test("SCEN-144: sendUnsubmittedReminder executes contract-compliant autonomous action", async () => {
    // Setup: Initialize fake AI client matching Tx8Imp1AiClient structure
    const mockAiClient = {
      callAction01: jest.fn(),
      callAction02: jest.fn(),
      callAction03: jest.fn(),
      callAction04: jest.fn(),
      callAction05: jest.fn(),
    };

    const mockSystemApi = {
      searchIssues: jest.fn(),
      close: jest.fn(),
    };

    // Mock sample issue data with 15 records
    const sampleIssueData = Array.from({ length: 15 }, (_, index) => ({
      issue_id: `ISSUE-${String(index + 1).padStart(3, "0")}`,
      occurrence_date: new Date(
        Date.UTC(2024, 0, 15 - index)
      ).toISOString(),
      category: ["defect", "performance", "design", "documentation"][
        index % 4
      ],
      description: `Sample issue description ${index + 1}`,
    }));

    // Setup: Initialize stub API to return sample data
    mockSystemApi.searchIssues.mockResolvedValueOnce({
      status: 200,
      data: sampleIssueData,
    });

    // Action 1: Verify mock for buildAction01Prompt
    const mockBuildAction01Prompt = jest.fn().mockReturnValue({
      version: "v1.0",
      prompt: "Extract issue data from reporting system",
    });

    // Setup: Configure fake AI client to return extracted data
    mockAiClient.callAction01.mockResolvedValueOnce({
      extracted_issues: sampleIssueData,
      extraction_status: "success",
      record_count: 15,
    });

    // Execute: Call sendUnsubmittedReminder
    const result = await sendUnsubmittedReminder({
      system_api: mockSystemApi,
      ai_client: mockAiClient,
      build_action_01_prompt: mockBuildAction01Prompt,
      timestamp: new Date("2024-01-15T08:00:00Z"),
    });

    // Assertion 1: Verify buildAction01Prompt was called exactly once
    expect(mockBuildAction01Prompt).toHaveBeenCalledTimes(1);

    // Assertion 2: Verify API stub was called exactly once
    expect(mockSystemApi.searchIssues).toHaveBeenCalledTimes(1);

    // Assertion 3: Verify AI client Action 1 was invoked
    expect(mockAiClient.callAction01).toHaveBeenCalledTimes(1);

    // Assertion 4: Verify extracted data contains all 15 records with required fields
    expect(result.extracted_issues).toBeDefined();
    expect(result.extracted_issues.length).toBe(15);

    result.extracted_issues.forEach((issue, index) => {
      expect(issue.issue_id).toBeDefined();
      expect(issue.occurrence_date).toBeDefined();
      expect(issue.category).toBeDefined();
      expect(issue.description).toBeDefined();
      expect(issue.issue_id).toBe(sampleIssueData[index].issue_id);
      expect(issue.occurrence_date).toBe(sampleIssueData[index].occurrence_date);
      expect(issue.category).toBe(sampleIssueData[index].category);
      expect(issue.description).toBe(sampleIssueData[index].description);
    });

    // Assertion 5: Verify audit event was recorded
    expect(result.audit_events).toBeDefined();
    expect(result.audit_events.length).toBeGreaterThan(0);

    const action01Event = result.audit_events.find(
      (e) => e.event_type === "action_01_executed"
    );
    expect(action01Event).toBeDefined();
    expect(action01Event.data_count).toBe(15);
    expect(action01Event.timestamp).toBeDefined();

    // Assertion 6: Verify extraction status is success
    expect(result.extraction_status).toBe("success");

    // Assertion 7: Verify state transition capability
    expect(result.orchestration_state).toBe("action_01_complete");
    expect(result.output_data_loss).toBe(false);

    // Cleanup: Reset mock and close stub API
    mockSystemApi.close();
    jest.clearAllMocks();
  });
});