import { getSubmissionStatus } from "../../src/logic/report-submission-management";

describe("Report Submission Management - getSubmissionStatus", () => {
  test("SCEN-314: [normal] aggregates team report submission status with submitted and unsubmitted members", async () => {
    const teamId = "TEAM-001";
    const reportDate = "2024-01-15";
    const requesterId = "REQ-001";
    const reportDeadlineTime = "09:00";
    const currentTime = new Date("2024-01-15T08:45:00Z");
    
    const teamMemberIds = ["M001", "M002", "M003", "M004", "M005"];
    const submittedReports = [
      { memberId: "M001", submittedAt: "2024-01-15T08:15:00Z" },
      { memberId: "M003", submittedAt: "2024-01-15T08:22:00Z" },
    ];

    const mockJudgeAccessPermission = jest.fn().mockReturnValue(true);
    const mockRetrieveReportsByDateRange = jest.fn().mockReturnValue(submittedReports);
    const mockDecryptReportDataForManager = jest.fn().mockImplementation((data) => data);
    const mockGetTeamMembers = jest.fn().mockReturnValue(
      teamMemberIds.map((id) => ({
        memberId: id,
        memberName: `Member ${id}`,
      }))
    );

    const result = await getSubmissionStatus(
      {
        teamId,
        reportDate,
        requesterId,
      },
      {
        judgeAccessPermission: mockJudgeAccessPermission,
        retrieveReportsByDateRange: mockRetrieveReportsByDateRange,
        decryptReportDataForManager: mockDecryptReportDataForManager,
        getTeamMembers: mockGetTeamMembers,
        getCurrentTime: () => currentTime,
        getReportDeadlineTime: () => reportDeadlineTime,
      }
    );

    const expectedSubmittedCount = 2;
    const expectedUnsubmittedCount = 3;
    const expectedSubmissionRate = 40;
    const expectedRemainingMinutes = 15;
    const expectedIsOverdue = false;

    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.submittedCount).toBe(expectedSubmittedCount);
    expect(result.unsubmittedCount).toBe(expectedUnsubmittedCount);
    expect(result.submissionRate).toBe(expectedSubmissionRate);

    expect(result.submittedMembers).toHaveLength(expectedSubmittedCount);
    expect(result.submittedMembers[0]).toEqual({
      memberId: "M001",
      memberName: "Member M001",
      submittedAt: "2024-01-15T08:15:00Z",
      isLate: false,
    });
    expect(result.submittedMembers[1]).toEqual({
      memberId: "M003",
      memberName: "Member M003",
      submittedAt: "2024-01-15T08:22:00Z",
      isLate: false,
    });

    expect(result.unsubmittedMembers).toHaveLength(expectedUnsubmittedCount);
    expect(result.unsubmittedMembers).toContainEqual({
      memberId: "M002",
      memberName: "Member M002",
      remainingMinutes: expectedRemainingMinutes,
      promptPriority: "medium",
    });
    expect(result.unsubmittedMembers).toContainEqual({
      memberId: "M004",
      memberName: "Member M004",
      remainingMinutes: expectedRemainingMinutes,
      promptPriority: "medium",
    });
    expect(result.unsubmittedMembers).toContainEqual({
      memberId: "M005",
      memberName: "Member M005",
      remainingMinutes: expectedRemainingMinutes,
      promptPriority: "medium",
    });

    expect(result.displayColor).toBe(expectedIsOverdue ? "red" : "green");
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});