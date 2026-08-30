import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { decryptReportDataForManager } from "../../src/logic/data-encryption-and-security";
import type {
  DecryptReportDataForManagerInput,
  DecryptedReportData,
  DecryptedIssueDetail,
} from "../../src/logic/data-encryption-and-security";

describe("decryptReportDataForManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-140
  test("should decrypt report data for manager with valid authorization and return decrypted content", async () => {
    const input: DecryptReportDataForManagerInput = {
      reportId: "RPT20240115001",
      requestingUserId: "MGR001",
      requestingUserRole: "部長",
      teamId: "TEAM001",
    };

    const decryptedIssueDetails: DecryptedIssueDetail[] = [
      {
        issueId: "ISS001",
        decryptedIssueContent: "ネットワーク遅延",
        priorityScore: 75,
        impactLevel: "高",
      },
      {
        issueId: "ISS002",
        decryptedIssueContent: "メモリ不足",
        priorityScore: 60,
        impactLevel: "中",
      },
    ];

    const expectedOutput: DecryptedReportData = {
      reportId: "RPT20240115001",
      reporterName: "田中太郎",
      decryptedYesterdayPerformance: "プロジェクトA のテスト実施",
      decryptedTodayPlan: "プロジェクトA のバグ修正",
      decryptedIssuesAndConcerns: "データベース接続タイムアウト",
      decryptedIssueDetails: decryptedIssueDetails,
      reportSubmissionTimestamp: "2024-01-15T09:30:00Z",
    };

    jest.mock("../../src/logic/data-encryption-and-security", () => ({
      judgeAccessPermission: jest.fn().mockReturnValue(true),
      decryptSensitiveField: jest
        .fn()
        .mockImplementation(
          (encryptedValue: string, fieldType: string, userId: string) => {
            const decryptionMap: Record<string, string> = {
              reporterName: "田中太郎",
              yesterdayPerformance: "プロジェクトA のテスト実施",
              todayPlan: "プロジェクトA のバグ修正",
              issuesAndConcerns: "データベース接続タイムアウト",
              networkDelay: "ネットワーク遅延",
              memoryShortage: "メモリ不足",
            };
            return decryptionMap[encryptedValue] || encryptedValue;
          }
        ),
    }));

    const result = await decryptReportDataForManager(input);

    expect(result).toEqual(expectedOutput);
    expect(result.reportId).toBe("RPT20240115001");
    expect(result.reporterName).toBe("田中太郎");
    expect(result.decryptedYesterdayPerformance).toBe(
      "プロジェクトA のテスト実施"
    );
    expect(result.decryptedTodayPlan).toBe("プロジェクトA のバグ修正");
    expect(result.decryptedIssuesAndConcerns).toBe(
      "データベース接続タイムアウト"
    );
    expect(result.reportSubmissionTimestamp).toBe("2024-01-15T09:30:00Z");
    expect(result.decryptedIssueDetails).toHaveLength(2);
    expect(result.decryptedIssueDetails[0]).toEqual({
      issueId: "ISS001",
      decryptedIssueContent: "ネットワーク遅延",
      priorityScore: 75,
      impactLevel: "高",
    });
    expect(result.decryptedIssueDetails[1]).toEqual({
      issueId: "ISS002",
      decryptedIssueContent: "メモリ不足",
      priorityScore: 60,
      impactLevel: "中",
    });
  });
});