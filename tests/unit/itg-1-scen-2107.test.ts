import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { ensureDashboardDataFreshness } from "../../src/logic/manager-dashboard";
import { type DashboardDataFreshnessInput, type DashboardDataFreshnessOutput } from "../../src/logic/manager-dashboard";

describe("ensureDashboardDataFreshness", () => {
  // SCEN-2107
  test("should delete retention-period-exceeded data and keep valid data", async () => {
    const nowTimestamp = new Date("2024-01-31T10:00:00Z").getTime();
    const thirtyOneDaysAgoTimestamp = new Date("2023-12-31T10:00:00Z").getTime();
    const twentyNineDaysAgoTimestamp = new Date("2024-01-02T10:00:00Z").getTime();

    const input: DashboardDataFreshnessInput = {
      userId: "user-dept-manager-001",
      teamId: "team-eng-001",
      reportDate: "2024-01-31",
      maxStalenessSeconds: 300,
    };

    const mockTimestampNow = nowTimestamp;
    const mockRetentionDaysThreshold = 30;

    const mockDataState = {
      archivedPlansExceededRetention: [
        {
          planId: "plan-A-001",
          createdAtTimestamp: thirtyOneDaysAgoTimestamp,
          contentSummary: "対策計画A",
        },
      ],
      archivedPlansWithinRetention: [
        {
          planId: "plan-B-001",
          createdAtTimestamp: twentyNineDaysAgoTimestamp,
          contentSummary: "対策計画B",
        },
      ],
    };

    const expectedDeletedPlanIds = ["plan-A-001"];
    const expectedRetainedPlanIds = ["plan-B-001"];

    const result = await ensureDashboardDataFreshness(
      input,
      mockTimestampNow,
      mockRetentionDaysThreshold,
      mockDataState
    );

    expect(result.isDataFresh).toBe(true);
    expect(result.stalenessSeconds).toBeLessThanOrEqual(300);
    expect(result.deletedPlanIds).toEqual(expectedDeletedPlanIds);
    expect(result.retainedPlanIds).toEqual(expectedRetainedPlanIds);
    expect(result.removalReason).toBe("保持期間超過");
    expect(result.removalTimestamp).toBeDefined();

    const removalRecordedTime = new Date(result.removalTimestamp).getTime();
    expect(removalRecordedTime).toBeGreaterThanOrEqual(mockTimestampNow - 1000);
    expect(removalRecordedTime).toBeLessThanOrEqual(mockTimestampNow + 1000);
  });
});