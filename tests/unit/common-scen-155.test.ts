import { runTx8Imp1Agent } from "../../src/agents/tx-8-imp-1/orchestrator";
import type { Tx8Imp1AiClient } from "../../src/agents/tx-8-imp-1/orchestrator";
import type { Tx8AgentInput, Tx8AgentOutput } from "../../src/agents/tx-8-imp-1/types";

describe("Tx8Imp1Agent Authorization Denial", () => {
  test("SCEN-155: runTx8Imp1Agent rejects unauthorized user attempting issue data access and report creation", async () => {
    // Setup: Create fake AI client with authorization checks
    const fakeAiClient: Tx8Imp1AiClient = {
      searchIssueData: jest.fn(async () => {
        const error = new Error(
          "User role [intern] is not authorized to access issue data and create reports. Required role: manager or above"
        );
        (error as any).name = "AuthorizationError";
        throw error;
      }),
      analyzeIssuePatterns: jest.fn(async () => {
        return { patterns: [], analysis: "" };
      }),
      generateVisualizationReport: jest.fn(async () => {
        const error = new Error(
          "User role [intern] is not authorized to access issue data and create reports. Required role: manager or above"
        );
        (error as any).name = "AuthorizationError";
        throw error;
      }),
      saveReportFile: jest.fn(async () => {
        const error = new Error(
          "User role [intern] is not authorized to access issue data and create reports. Required role: manager or above"
        );
        (error as any).name = "AuthorizationError";
        throw error;
      }),
      recordAuditLog: jest.fn(async () => {
        return { success: true };
      }),
    };

    // Setup: Define unauthorized user context
    const unauthorizedUserContext = {
      userId: "unauthorized_user",
      role: "intern",
      email: "intern@example.com",
    };

    // Setup: Create agent input
    const agentInput: Tx8AgentInput = {
      analysisPeriodStartDate: "2024-01-01T00:00:00Z",
      analysisPeriodEndDate: "2024-01-31T23:59:59Z",
      managerEmail: "manager@example.com",
      minimumDataThreshold: 10,
    };

    // Execute: Run agent with unauthorized user and fake AI client
    const result = await runTx8Imp1Agent(agentInput, fakeAiClient, unauthorizedUserContext);

    // Assert: Verify AuthorizationError is returned
    expect(result).toBeDefined();
    expect((result as any).error).toBeDefined();
    expect((result as any).error.name).toBe("AuthorizationError");
    expect((result as any).error.message).toMatch(
      /User role \[intern\] is not authorized to access issue data and create reports/
    );

    // Assert: Verify searchIssueData was called and threw authorization error
    expect(fakeAiClient.searchIssueData).toHaveBeenCalled();

    // Assert: Verify saveReportFile was not called (authorization failed early)
    expect(fakeAiClient.saveReportFile).not.toHaveBeenCalled();

    // Assert: Verify audit log was recorded with authorization denial event
    expect(fakeAiClient.recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "AUTHORIZATION_DENIED",
        userId: "unauthorized_user",
        action: expect.stringMatching(/searchIssueData|generateVisualizationReport/),
        reason: expect.stringMatching(/not authorized/),
      })
    );

    // Assert: Verify no report was generated or saved
    expect((result as any).reportId).toBeUndefined();
    expect((result as any).analysisStatus).not.toBe("completed");
  });
});