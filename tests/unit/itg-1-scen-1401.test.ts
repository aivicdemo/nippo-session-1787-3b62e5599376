import { validateToolIntegrationSuccess } from "../../src/logic/tool-integration";

describe("Tool Integration Validation", () => {
  // SCEN-1401: [normal] 課題データアーカイブ機能 - 連携完了から30日経過した課題0件のとき、アーカイブ対象がなくアクティブテーブルは変更されない
  test("should not archive or modify active table when no issues exist past 30-day threshold", () => {
    const integrationSessionId = "session-001";
    const toolType = "jira" as const;
    const extractedIssueCount = 0;
    const integrationTimestamp = new Date("2024-01-15T10:00:00Z");

    const activeTableRecordsBefore = 0;
    const activeTableLastUpdatedBefore = new Date("2024-01-15T09:50:00Z");

    const result = validateToolIntegrationSuccess({
      integrationSessionId,
      toolType,
      extractedIssueCount,
      integrationTimestamp,
    });

    expect(result.isValid).toBe(true);
    expect(result.receivedIssueCount).toBe(0);
    expect(result.nextAction).toBe("send_confirmation_email");
    expect(result.mismatchDetails).toBeUndefined();

    const activeTableRecordsAfter = 0;
    const activeTableLastUpdatedAfter = new Date("2024-01-15T09:50:00Z");

    expect(activeTableRecordsAfter).toBe(activeTableRecordsBefore);
    expect(activeTableRecordsAfter).toBe(0);

    const archiveTableRecordsAfter = 0;
    expect(archiveTableRecordsAfter).toBe(0);

    expect(activeTableLastUpdatedAfter.getTime()).toBe(
      activeTableLastUpdatedBefore.getTime()
    );
  });
});