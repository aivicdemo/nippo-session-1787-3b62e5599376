import { generateWeeklyAnalysisReport } from "../../src/logic/weekly-issue-analysis";

describe("Weekly Issue Analysis Report Generation", () => {
  // SCEN-1584: [error] 週次課題傾向レポート生成機能 - プロジェクトマネージャーIDが空文字列のときエラーになる
  test("should throw error with INVALID_PROJECT_MANAGER_ID when projectManagerId is empty string", () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input = {
      aggregationStartDate: "2024-01-08",
      aggregationEndDate: "2024-01-14",
      extractedIssues: [
        {
          issueKeyword: "database performance",
          occurrenceCount: 3,
          impactScore: 85,
        },
        {
          issueKeyword: "API timeout",
          occurrenceCount: 2,
          impactScore: 72,
        },
      ],
      teamId: "team-001",
      projectManagerId: "",
    };

    expect(() =>
      generateWeeklyAnalysisReport(
        input,
        mockTextAnalysisServiceAdapter,
        mockNotificationServiceAdapter
      )
    ).toThrow(/INVALID_PROJECT_MANAGER_ID/);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});