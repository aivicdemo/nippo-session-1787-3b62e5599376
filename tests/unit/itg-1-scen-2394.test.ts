import { describe, it, expect } from "@jest/globals";
import { extractMonthlyReportData } from "../../src/logic/monthly-performance-analysis";

describe("Monthly Performance Analysis - Data Extraction and Archival", () => {
  it("SCEN-2394: should keep in-period report data in active storage after archival processing", () => {
    // Arrange: Set aggregation period to January 2024
    const aggregationStartDate = new Date("2024-01-01T00:00:00Z");
    const aggregationEndDate = new Date("2024-01-31T23:59:59Z");

    // Create a report record within the aggregation period (2024-01-15)
    const reportRecord = {
      reportId: "REPORT-001",
      memberId: "MEMBER-A",
      memberName: "部員A",
      createdAt: new Date("2024-01-15T09:30:00Z"),
      reportContent: "昨日やったこと：タスクX完了",
      yesterdayAccomplishment: "タスクX完了",
      todayPlan: "",
      issues: [],
    };

    // Mock input data: single report within aggregation period
    const inputReports = [reportRecord];

    // Act: Extract monthly report data within the aggregation period
    const result = extractMonthlyReportData(
      inputReports,
      aggregationStartDate,
      aggregationEndDate
    );

    // Assert: Verify that the report within the aggregation period is retained in active storage
    expect(result).toBeDefined();
    expect(result.activeStorageRecords).toBeDefined();
    expect(result.activeStorageRecords.length).toBe(1);

    const retainedRecord = result.activeStorageRecords[0];
    expect(retainedRecord.reportId).toBe("REPORT-001");
    expect(retainedRecord.memberId).toBe("MEMBER-A");
    expect(retainedRecord.memberName).toBe("部員A");
    expect(retainedRecord.createdAt).toEqual(
      new Date("2024-01-15T09:30:00Z")
    );
    expect(retainedRecord.reportContent).toBe("昨日やったこと：タスクX完了");
    expect(retainedRecord.yesterdayAccomplishment).toBe("タスクX完了");

    // Verify that the report is NOT in archive storage
    expect(result.archivedRecords).toBeDefined();
    expect(result.archivedRecords.length).toBe(0);

    // Verify data integrity: all fields are preserved as-is
    expect(retainedRecord).toEqual(reportRecord);
  });
});