import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx6Imp1Agent } from "../../src/agents/tx-6-imp-1/orchestrator";
import { type Tx6Imp1AiClient } from "../../src/agents/tx-6-imp-1/orchestrator";

describe("Tx6Imp1Agent - 日報収集から分析レポート生成までの自動実行", () => {
  let mockAiClient: jest.Mocked<Tx6Imp1AiClient>;
  let auditLog: Array<{
    timestamp: Date;
    action: string;
    sender: string;
    recipients: string[];
    details?: Record<string, unknown>;
  }>;

  beforeEach(() => {
    auditLog = [];

    mockAiClient = {
      action01_collectReportData: jest.fn(async () => ({
        reports: [
          {
            memberId: "emp_001",
            memberName: "田中太郎",
            submittedAt: new Date("2024-01-12T10:00:00Z"),
            content: "昨日の成果：システムA機能実装完了",
          },
          {
            memberId: "emp_002",
            memberName: "佐藤花子",
            submittedAt: new Date("2024-01-12T11:30:00Z"),
            content: "バグ修正対応、テスト実施",
          },
          {
            memberId: "emp_003",
            memberName: "鈴木次郎",
            submittedAt: null,
            content: null,
          },
          {
            memberId: "emp_004",
            memberName: "高橋美咲",
            submittedAt: new Date("2024-01-12T14:00:00Z"),
            content: "ドキュメント作成",
          },
          {
            memberId: "emp_005",
            memberName: "山本健一",
            submittedAt: new Date("2024-01-12T09:15:00Z"),
            content: "提案資料準備完了",
          },
          {
            memberId: "emp_006",
            memberName: "渡辺由美",
            submittedAt: new Date("2024-01-12T15:45:00Z"),
            content: "営業活動レポート",
          },
          {
            memberId: "emp_007",
            memberName: "伊藤誠一",
            submittedAt: null,
            content: null,
          },
          {
            memberId: "emp_008",
            memberName: "小松美優",
            submittedAt: new Date("2024-01-12T13:20:00Z"),
            content: "品質チェック完了",
          },
          {
            memberId: "emp_009",
            memberName: "林尚子",
            submittedAt: new Date("2024-01-12T16:00:00Z"),
            content: "プロジェクト進捗確認",
          },
          {
            memberId: "emp_010",
            memberName: "中村隆夫",
            submittedAt: new Date("2024-01-12T10:45:00Z"),
            content: "技術検証作業",
          },
        ],
        analysisStartDate: "2024-01-08",
        analysisEndDate: "2024-01-14",
        teamId: "team_A",
      })),

      action02_identifyAndRemindUnsubmitted: jest.fn(async (params) => {
        const unsubmittedMembers = params.reports.filter(
          (r) => r.submittedAt === null
        );
        const reminders = unsubmittedMembers.map((member) => ({
          memberId: member.memberId,
          memberName: member.memberName,
          reportUrl: `https://app.example.com/report/${member.memberId}`,
          deadline: "2024-01-12T17:00:00Z",
          reminderSentAt: new Date("2024-01-12T16:30:00Z"),
        }));

        auditLog.push({
          timestamp: new Date("2024-01-12T16:30:00Z"),
          action: "REMINDER_SENT",
          sender: "AIAgent",
          recipients: unsubmittedMembers.map((m) => m.memberId),
          details: {
            count: reminders.length,
            reminders: reminders,
          },
        });

        return {
          unsubmittedCount: unsubmittedMembers.length,
          reminders: reminders,
          sentAt: new Date("2024-01-12T16:30:00Z"),
        };
      }),

      action03_extractAndClassifyIssues: jest.fn(async (params) => ({
        issues: [
          {
            keyword: "システムA機能実装",
            occurrenceCount: 1,
            category: "実装",
          },
          {
            keyword: "バグ修正",
            occurrenceCount: 2,
            category: "品質",
          },
          {
            keyword: "テスト実施",
            occurrenceCount: 1,
            category: "品質",
          },
        ],
        extractedAt: new Date("2024-01-12T16:35:00Z"),
      })),

      action04_analyzeTrend: jest.fn(async (params) => ({
        trendAnalysis: {
          topCategories: ["品質", "実装"],
          frequencyByCategory: {
            品質: 3,
            実装: 1,
          },
          weekOverWeekChange: {
            品質: 0.15,
            実装: -0.05,
          },
        },
        analyzedAt: new Date("2024-01-12T16:40:00Z"),
      })),

      action05_scoreAndPrioritize: jest.fn(async (params) => ({
        priorityIssues: [
          {
            issueKeyword: "バグ修正",
            occurrenceCount: 2,
            priorityScore: 85,
            priorityRank: "高",
          },
          {
            issueKeyword: "システムA機能実装",
            occurrenceCount: 1,
            priorityScore: 65,
            priorityRank: "中",
          },
          {
            issueKeyword: "テスト実施",
            occurrenceCount: 1,
            priorityScore: 60,
            priorityRank: "中",
          },
        ],
        scoredAt: new Date("2024-01-12T16:45:00Z"),
      })),

      action06_generateReport: jest.fn(async (params) => ({
        reportId: "report_20240112_001",
        reportContent: {
          period: {
            startDate: "2024-01-08",
            endDate: "2024-01-14",
          },
          submissionRate: 0.8,
          unsubmittedCount: 2,
          topPriorityIssues: params.topPriorityIssues,
          trendAnalysis: params.trendAnalysis,
        },
        generatedAt: new Date("2024-01-12T16:50:00Z"),
      })),

      action07_distributionReport: jest.fn(async (params) => ({
        reportId: params.reportId,
        distributedAt: new Date("2024-01-12T16:55:00Z"),
        recipients: ["director_chief"],
      })),
    } as jest.Mocked<Tx6Imp1AiClient>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-108
  test("should execute autonomous report generation with unsubmitted member identification and reminder notification", async () => {
    const input = {
      executionTimestamp: new Date("2024-01-12T16:30:00Z"),
      analysisStartDate: "2024-01-08",
      analysisEndDate: "2024-01-14",
      teamId: "team_A",
    };

    const result = await runTx6Imp1Agent(input, mockAiClient);

    expect(mockAiClient.action01_collectReportData).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action01_collectReportData).toHaveBeenCalledWith({
      executionTimestamp: input.executionTimestamp,
      analysisStartDate: input.analysisStartDate,
      analysisEndDate: input.analysisEndDate,
      teamId: input.teamId,
    });

    const collectResult = await mockAiClient.action01_collectReportData({
      executionTimestamp: input.executionTimestamp,
      analysisStartDate: input.analysisStartDate,
      analysisEndDate: input.analysisEndDate,
      teamId: input.teamId,
    });

    expect(mockAiClient.action02_identifyAndRemindUnsubmitted).toHaveBeenCalledTimes(
      1
    );
    expect(
      mockAiClient.action02_identifyAndRemindUnsubmitted
    ).toHaveBeenCalledWith({
      reports: collectResult.reports,
      teamId: input.teamId,
    });

    const reminderResult = await mockAiClient.action02_identifyAndRemindUnsubmitted(
      {
        reports: collectResult.reports,
        teamId: input.teamId,
      }
    );

    expect(reminderResult.unsubmittedCount).toBe(2);
    expect(reminderResult.reminders).toHaveLength(2);

    const unsubmittedIds = reminderResult.reminders.map((r) => r.memberId);
    expect(unsubmittedIds).toEqual(
      expect.arrayContaining(["emp_003", "emp_007"])
    );
    expect(unsubmittedIds).not.toContain("emp_001");
    expect(unsubmittedIds).not.toContain("emp_002");
    expect(unsubmittedIds).not.toContain("emp_004");
    expect(unsubmittedIds).not.toContain("emp_005");
    expect(unsubmittedIds).not.toContain("emp_006");
    expect(unsubmittedIds).not.toContain("emp_008");
    expect(unsubmittedIds).not.toContain("emp_009");
    expect(unsubmittedIds).not.toContain("emp_010");

    const emp003Reminder = reminderResult.reminders.find(
      (r) => r.memberId === "emp_003"
    );
    expect(emp003Reminder).toBeDefined();
    expect(emp003Reminder?.memberName).toBe("鈴木次郎");
    expect(emp003Reminder?.reportUrl).toBe(
      "https://app.example.com/report/emp_003"
    );
    expect(emp003Reminder?.deadline).toBe("2024-01-12T17:00:00Z");

    const emp007Reminder = reminderResult.reminders.find(
      (r) => r.memberId === "emp_007"
    );
    expect(emp007Reminder).toBeDefined();
    expect(emp007Reminder?.memberName).toBe("伊藤誠一");
    expect(emp007Reminder?.reportUrl).toBe(
      "https://app.example.com/report/emp_007"
    );
    expect(emp007Reminder?.deadline).toBe("2024-01-12T17:00:00Z");

    expect(auditLog).toHaveLength(1);
    expect(auditLog[0].action).toBe("REMINDER_SENT");
    expect(auditLog[0].sender).toBe("AIAgent");
    expect(auditLog[0].recipients).toEqual(
      expect.arrayContaining(["emp_003", "emp_007"])
    );
    expect(auditLog[0].recipients).toHaveLength(2);
    expect(auditLog[0].details?.count).toBe(2);

    expect(mockAiClient.action03_extractAndClassifyIssues).toHaveBeenCalledTimes(
      1
    );
    expect(mockAiClient.action04_analyzeTrend).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action05_scoreAndPrioritize).toHaveBeenCalledTimes(1);

    const priorityResult = await mockAiClient.action05_scoreAndPrioritize({
      issues: [],
      trendAnalysis: {},
    });

    expect(mockAiClient.action06_generateReport).toHaveBeenCalledTimes(1);
    const reportResult = await mockAiClient.action06_generateReport({
      reportId: "report_20240112_001",
      topPriorityIssues: priorityResult.priorityIssues,
      trendAnalysis: {},
    });

    expect(reportResult.reportContent.unsubmittedCount).toBe(2);
    expect(reportResult.reportContent.submissionRate).toBe(0.8);
    expect(reportResult.reportContent.period.startDate).toBe("2024-01-08");
    expect(reportResult.reportContent.period.endDate).toBe("2024-01-14");

    expect(mockAiClient.action07_distributionReport).toHaveBeenCalledTimes(1);
    const distributionResult = await mockAiClient.action07_distributionReport({
      reportId: reportResult.reportId,
    });

    expect(result).toBeDefined();
    expect(result.reportId).toBe("report_20240112_001");
    expect(result.extractedIssueCount).toBeGreaterThan(0);
    expect(result.topPriorityIssues).toHaveLength(
      expect.any(Number)
    );
  });
});