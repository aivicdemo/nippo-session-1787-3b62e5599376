import { describe, test, expect } from "@jest/globals";
import { validateToolIntegrationSuccess } from "../../src/logic/tool-integration";

describe("Tool Integration Validation", () => {
  test("SCEN-1413: validateToolIntegrationSuccess should throw ERR_INVALID_TIMESTAMP when currentTimestamp is null", () => {
    const input = {
      integrationSessionId: "session-001",
      toolType: "jira" as const,
      extractedIssueCount: 5,
      integrationTimestamp: new Date("2024-01-15T09:00:00Z"),
      currentTimestamp: null,
    };

    expect(() => validateToolIntegrationSuccess(input)).toThrow(/ERR_INVALID_TIMESTAMP/);
  });
});