import { archiveAndManageIssueDataRetention } from "../../src/logic/issue-data-persistence";
import type { IssueRetentionPolicy, IssueRetentionResult } from "../../src/logic/issue-data-persistence";

describe("Issue Data Persistence - archiveAndManageIssueDataRetention", () => {
  // SCEN-418
  test("should return zero counts when no issues are eligible for archival or deletion", async () => {
    const retentionPolicy: IssueRetentionPolicy = {
      archiveDaysThreshold: 30,
      deleteDaysThreshold: 365,
      protectedDataCategories: ["audit_required"],
      aggregationPeriodStart: null,
      aggregationPeriodEnd: null,
    };

    const result: IssueRetentionResult = await archiveAndManageIssueDataRetention(retentionPolicy);

    expect(result.archivedCount).toBe(0);
    expect(result.deletedCount).toBe(0);
    expect(result.protectedCount).toBe(0);
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });
});