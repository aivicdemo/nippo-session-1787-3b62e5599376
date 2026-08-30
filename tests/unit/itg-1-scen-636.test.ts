import { getSubmissionStatus, type SubmissionStatusQueryInput, type SubmissionStatusResult } from "../../src/logic/report-submission-management";

describe("朝会報告管理システム - 報告提出状況管理", () => {
  // SCEN-636
  test("指定日付のチーム全体の報告提出状況を集計し、提出済み・未提出メンバーと提出時刻を返す - 朝会開始時刻が過去のときというignore境界条件", () => {
    const teamId = "team-001";
    const reportDate = "2025-01-20";
    const requesterId = "user-manager-001";
    
    const morningMeetingStartTime = "09:00";
    const currentTime = new Date("2025-01-20T09:30:00Z");
    
    const queryInput: SubmissionStatusQueryInput = {
      teamId,
      reportDate,
      requesterId,
    };
    
    const mockAccessResult = { isAuthorized: true, allowedActions: ["view_team_reports"], visibleDataScope: "team_all", denialReason: null };
    const mockReports = [
      { userId: "user-eng-001", reportDate: "2025-01-20", submissionStatus: "submitted", submissionTimestamp: new Date("2025-01-20T08:45:00Z") },
      { userId: "user-eng-002", reportDate: "2025-01-20", submissionStatus: "submitted", submissionTimestamp: new Date("2025-01-20T08:50:00Z") },
      { userId: "user-eng-003", reportDate: "2025-01-20", submissionStatus: "unsubmitted", submissionTimestamp: null },
    ];
    
    const mockDecryptedReports = [
      { userId: "user-eng-001", yesterday: "実績1", today: "予定1", issues: "課題1" },
      { userId: "user-eng-002", yesterday: "実績2", today: "予定2", issues: "課題2" },
    ];
    
    const judgeAccessPermissionStub = jest.fn().mockReturnValue(mockAccessResult);
    const retrieveReportsByDateRangeStub = jest.fn().mockReturnValue(mockReports);
    const decryptReportDataForManagerStub = jest.fn().mockReturnValue(mockDecryptedReports);
    
    jest.spyOn(global, "Date").mockImplementation(() => currentTime as any);
    
    const result: SubmissionStatusResult = getSubmissionStatus(
      queryInput,
      {
        judgeAccessPermission: judgeAccessPermissionStub,
        retrieveReportsByDateRange: retrieveReportsByDateRangeStub,
        decryptReportDataForManager: decryptReportDataForManagerStub,
      }
    );
    
    expect(result).toBeDefined();
    expect(result.teamId).toBe("team-001");
    expect(result.reportDate).toBe("2025-01-20");
    expect(result.submittedCount).toBe(2);
    expect(result.pendingCount).toBe(1);
    expect(result.memberStatus).toHaveLength(3);
    
    const submittedMembers = result.memberStatus.filter(m => m.status === "submitted");
    expect(submittedMembers).toHaveLength(2);
    expect(submittedMembers[0].memberId).toBe("user-eng-001");
    expect(submittedMembers[0].submittedAt).toBe("2025-01-20T08:45:00Z");
    
    const pendingMembers = result.memberStatus.filter(m => m.status === "pending");
    expect(pendingMembers).toHaveLength(1);
    expect(pendingMembers[0].memberId).toBe("user-eng-003");
    
    const aggregatedAtTime = new Date(result.aggregatedAt);
    expect(aggregatedAtTime.getTime()).toBeGreaterThanOrEqual(currentTime.getTime());
    expect(result.aggregatedAt).toMatch(/2025-01-20T09:[3-5]\d:\d{2}Z/);
    
    judgeAccessPermissionStub.mockClear();
    retrieveReportsByDateRangeStub.mockClear();
    decryptReportDataForManagerStub.mockClear();
    jest.restoreAllMocks();
  });
});