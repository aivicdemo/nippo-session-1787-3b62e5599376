import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { archiveAndManageIssueDataRetention } from "../../src/logic/issue-data-persistence";
import type { IssueRetentionPolicy } from "../../src/logic/issue-data-persistence";

describe("archiveAndManageIssueDataRetention", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-419
  test("should throw DataIntegrityViolationError when archival to archive area fails due to data integrity check failure", async () => {
    const policy: IssueRetentionPolicy = {
      archiveDaysThreshold: 30,
      deleteDaysThreshold: 365,
      protectedDataCategories: ["audit_required"],
    };

    const mockIdentifyIssueDataForArchival = jest
      .fn()
      .mockResolvedValue([
        {
          issueId: "issue-1",
          originalCreatedDate: "2024-01-01T10:00:00Z",
          archivedDate: "2024-02-15T10:00:00Z",
          protectionCategory: undefined,
        },
        {
          issueId: "issue-2",
          originalCreatedDate: "2024-01-05T10:00:00Z",
          archivedDate: "2024-02-15T10:00:00Z",
          protectionCategory: undefined,
        },
        {
          issueId: "issue-3",
          originalCreatedDate: "2024-01-10T10:00:00Z",
          archivedDate: "2024-02-15T10:00:00Z",
          protectionCategory: undefined,
        },
      ]);

    const mockIdentifyArchivedIssueDataForDeletion = jest
      .fn()
      .mockResolvedValue([
        {
          issueDataId: "archived-1",
          archivedDate: new Date("2023-01-15T10:00:00Z"),
          deletionEligibilityDate: new Date("2024-01-15T10:00:00Z"),
          dataCategory: "extracted_issue",
          integrityValidationStatus: "valid",
        },
      ]);

    const mockRecordIssueAuditLog = jest.fn().mockResolvedValue({
      auditLogId: "audit-1",
      recordedAt: new Date("2024-02-15T10:00:00Z"),
    });

    const mockMoveToArchiveArea = jest
      .fn()
      .mockRejectedValue(
        new Error(
          "課題データの整合性検証に失敗しました。アーカイブ処理を中止します。"
        )
      );

    const contextWithMocks = {
      identifyIssueDataForArchival: mockIdentifyIssueDataForArchival,
      identifyArchivedIssueDataForDeletion:
        mockIdentifyArchivedIssueDataForDeletion,
      recordIssueAuditLog: mockRecordIssueAuditLog,
      moveToArchiveArea: mockMoveToArchiveArea,
    };

    await expect(
      archiveAndManageIssueDataRetention(policy, contextWithMocks)
    ).rejects.toThrow(/整合性/);

    expect(mockMoveToArchiveArea).toHaveBeenCalled();
    expect(mockRecordIssueAuditLog).not.toHaveBeenCalled();
  });
});