import { updateReport } from "../../src/logic/report-persistence";
import type { UpdateReportInput } from "../../src/logic/report-persistence";

describe("朝会報告管理システム - 日報更新処理", () => {
  // SCEN-154: [error] 既存の日報データを更新し、変更履歴と更新時刻を記録する - 更新後のデータが整合性検証に失敗した場合
  test("日報データの整合性検証に失敗した場合、DataIntegrityErrorを発生させる", () => {
    const updateReportInput: UpdateReportInput = {
      reportId: "RPT-001",
      updaterId: "USR-002",
      yesterdayPerformance: "昨日の作業内容",
      todayPlan: "本日の予定",
      issuesAndConcerns: "課題内容",
      priorityLevel: "high",
      attachmentIds: null,
    };

    const mockJudgeAccessPermission = jest
      .fn()
      .mockReturnValue({ isAuthorized: true, denialReason: null });

    const mockValidateReportSubmission = jest
      .fn()
      .mockReturnValue({ isValid: true, errors: [] });

    const mockEncryptReportData = jest.fn().mockImplementation(() => {
      const error = new Error("日報データの整合性検証に失敗しました");
      (error as any).name = "DataIntegrityError";
      throw error;
    });

    const mockPersistReport = jest.fn();

    expect(() =>
      updateReport(
        updateReportInput,
        mockJudgeAccessPermission,
        mockValidateReportSubmission,
        mockEncryptReportData,
        mockPersistReport
      )
    ).toThrow(/整合性検証に失敗/);
  });
});