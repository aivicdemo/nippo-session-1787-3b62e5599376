import { describe, test, expect, beforeEach } from "@jest/globals";
import { ensureDashboardDataFreshness } from "../../src/logic/manager-dashboard";

describe("DashboardDataFreshness", () => {
  test("SCEN-2142: [edge] Protected audit data is retained beyond retention period and not deleted during auto-purge", () => {
    // Setup: Initialize test data with protection rule
    const reportIdToProtect = "RPT-2024-001";
    const reportCreatedAt = new Date("2024-01-01T00:00:00Z");
    const retentionDays = 30;
    const retentionExpiryDate = new Date("2024-01-31T00:00:00Z");
    const currentSimulatedDate = new Date("2024-02-15T00:00:00Z");
    const daysAfterExpiry = 15;

    // Verify setup preconditions
    expect(reportCreatedAt.toISOString()).toBe("2024-01-01T00:00:00Z");
    expect(retentionExpiryDate.toISOString()).toBe("2024-01-31T00:00:00Z");
    expect(
      Math.floor(
        (currentSimulatedDate.getTime() - retentionExpiryDate.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    ).toBe(daysAfterExpiry);

    // Input: Dashboard data freshness check with protected report
    const freshnessInput = {
      userId: "user-dept-head-001",
      teamId: "team-engineering-001",
      reportDate: "2024-02-15",
      maxStalenessSeconds: 300,
      protectedReports: [
        {
          reportId: reportIdToProtect,
          createdAt: reportCreatedAt.toISOString(),
          protectionReason: "audit_critical",
          protectionStatus: "active",
          retentionDays: retentionDays,
        },
      ],
      currentSystemDate: currentSimulatedDate.toISOString(),
    };

    // Execute: Check data freshness with protection rules applied
    const result = ensureDashboardDataFreshness(freshnessInput);

    // Assertions: Verify protected data is retained and not deleted
    expect(result).toStrictEqual({
      isDataFresh: true,
      lastUpdateTimestamp: expect.any(String),
      displayTimestamp: currentSimulatedDate.toISOString(),
      stalenessSeconds: expect.any(Number),
      protectedDataRetentionStatus: {
        totalProtectedRecords: 1,
        retainedReportIds: [reportIdToProtect],
        deletionExemptionReasons: ["audit_critical"],
        purgeExecutionLog: [
          {
            reportId: reportIdToProtect,
            action: "retained",
            reason:
              "Protection rule applied: audit_critical - data excluded from deletion",
            timestamp: expect.any(String),
          },
        ],
      },
    });

    // Verify the protected report is NOT in the deletion list
    expect(
      result.protectedDataRetentionStatus.retainedReportIds
    ).toContain(reportIdToProtect);
    expect(result.protectedDataRetentionStatus.totalProtectedRecords).toBe(1);

    // Verify retention exceeded but data persists
    const daysSinceCreation = Math.floor(
      (currentSimulatedDate.getTime() - reportCreatedAt.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    expect(daysSinceCreation).toBeGreaterThan(retentionDays);

    // Verify audit log contains expected exclusion message
    const purgeLog = result.protectedDataRetentionStatus.purgeExecutionLog.find(
      (log) => log.reportId === reportIdToProtect
    );
    expect(purgeLog).toBeDefined();
    expect(purgeLog?.action).toBe("retained");
    expect(purgeLog?.reason).toMatch(/Protection rule applied/);
    expect(purgeLog?.reason).toMatch(/audit_critical/);
    expect(purgeLog?.reason).toMatch(/excluded from deletion/);

    // Verify protection status remains active
    expect(result.protectedDataRetentionStatus.deletionExemptionReasons).toContain(
      "audit_critical"
    );
  });
});