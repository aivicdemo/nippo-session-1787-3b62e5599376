import { submitReport } from "../../src/logic/report-submission-management";

describe("朝会報告管理システム - 日報送信", () => {
  // SCEN-039
  test("エンジニアが送信時刻が朝会開始予定時刻を超過している場合、遅延判定結果を記録し部長に遅延通知を送信する", () => {
    const morningMeetingStartTime = new Date("2025-01-01T09:00:00Z");
    const submissionTimestamp = new Date("2025-01-01T09:15:00Z");
    const reportDate = new Date("2025-01-01T00:00:00Z");

    const mockValidateReportSubmission = jest.fn().mockReturnValue({
      isValid: true,
      errors: [],
    });

    const mockSaveReport = jest.fn().mockReturnValue("RPT-20250101-001");

    const mockGetReportSubmissionTimestamp = jest
      .fn()
      .mockReturnValue(submissionTimestamp);

    const mockSendDelayedNotification = jest.fn().mockResolvedValue({
      notificationSent: true,
    });

    const result = submitReport(
      {
        reporterId: "ENG-001",
        teamId: "TEAM-A",
        reportDate: reportDate,
        yesterdayAccomplishment: "昨日の実績テキスト",
        todayPlan: "今日の予定テキスト",
        issuesAndConcerns: "抱えている課題テキスト",
      },
      {
        reportSubmissionDeadline: morningMeetingStartTime,
        characterLimitPerField: 1000,
        minimumCharacterPerField: 1,
      },
      {
        validateReportSubmission: mockValidateReportSubmission,
        saveReport: mockSaveReport,
        getReportSubmissionTimestamp: mockGetReportSubmissionTimestamp,
        sendDelayedNotification: mockSendDelayedNotification,
      }
    );

    expect(result.reportId).toBe("RPT-20250101-001");
    expect(result.submissionStatus).toBe("delayed");
    expect(result.isWithinDeadline).toBe(false);
    expect(result.remainingTimeToDeadline).toBeNull();
    expect(result.submissionTimestamp).toEqual(submissionTimestamp);

    const expectedMinutesOverDeadline = 15;
    expect(mockSaveReport).toHaveBeenCalled();
    expect(mockSendDelayedNotification).toHaveBeenCalledWith({
      reportId: "RPT-20250101-001",
      reporterId: "ENG-001",
      minutesOverDeadline: expectedMinutesOverDeadline,
    });
  });
});