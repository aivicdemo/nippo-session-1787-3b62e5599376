import { deleteArchivedReports } from "../../src/logic/report-persistence";
import type { ExecutionContext } from "../../src/logic/report-persistence";

describe("Report Persistence - deleteArchivedReports", () => {
  test("SCEN-158: throws ArchiveDataNotFoundError when no archived reports older than retention threshold exist", () => {
    // Setup: Create test ExecutionContext
    const executionContext: ExecutionContext = {
      systemUserId: "system",
      operationTimestamp: "2024-12-15T10:30:00Z",
    };

    // Setup: Set retention threshold to 365 days
    const retentionThresholdDays = 365;

    // Setup: Mock identifyArchivedReportsForDeletion to return empty array
    // (simulating scenario where no archived reports older than 1 year exist)
    jest.mock("../../src/logic/report-persistence", () => {
      const actual = jest.requireActual("../../src/logic/report-persistence");
      return {
        ...actual,
        identifyArchivedReportsForDeletion: jest.fn(() => []),
      };
    });

    // Execute: Call deleteArchivedReports with empty archive list
    // Expected: ArchiveDataNotFoundError should be thrown with specific message
    expect(() => {
      deleteArchivedReports(retentionThresholdDays, executionContext);
    }).toThrow(/削除対象のアーカイブ日報が見つかりません/);
  });
});