import { describe, test, expect } from "@jest/globals";
import { archiveAndManageIssueDataRetention } from "../../src/logic/issue-data-persistence";
import type { IssueRetentionPolicy } from "../../src/logic/issue-data-persistence";

describe("Issue Data Persistence - Archive and Retention Management", () => {
  // SCEN-171
  test("should throw InvalidRetentionPolicyError when archiveDaysThreshold is negative", () => {
    const invalidPolicy: IssueRetentionPolicy = {
      archiveDaysThreshold: -30,
      deleteDaysThreshold: 365,
      protectedDataCategories: ["audit_required"],
    };

    expect(() => archiveAndManageIssueDataRetention(invalidPolicy)).toThrow(
      /保持期間ルール/
    );
  });
});