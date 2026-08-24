import { describe, test, expect } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";

describe("課題の優先度スコア計算 - 重複キーワード処理", () => {
  test("SCEN-599: 複数課題の優先度判定において、重複したキーワードを含む場合、スコア計算が正確に行われる", () => {
    const issueA: IssuePriorityScoringInput = {
      issueId: "issue-a-001",
      issueContent: "DB接続エラーが発生してDB接続エラーで業務停止。ユーザーがログイン画面でエラーを報告",
      occurrenceFrequency: 3,
      impactScore: 85,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-15",
      teamId: "team-001",
    };

    const issueB: IssuePriorityScoringInput = {
      issueId: "issue-b-002",
      issueContent: "ログイン画面でタイムアウトしてDB接続エラーになった",
      occurrenceFrequency: 2,
      impactScore: 72,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1,
      reportingDate: "2024-01-15",
      teamId: "team-001",
    };

    const textAnalysisStub = {
      extractKeywords: jest.fn((content: string) => {
        if (content.includes("DB接続エラーが発生してDB接続エラーで業務停止")) {
          return Promise.resolve({
            keywords: [
              { keyword: "DB接続エラー", frequency: 3 },
              { keyword: "ログイン画面", frequency: 2 },
            ],
          });
        }
        if (content.includes("ログイン画面でタイムアウトしてDB接続エラーになった")) {
          return Promise.resolve({
            keywords: [
              { keyword: "ログイン画面", frequency: 1 },
              { keyword: "DB接続エラー", frequency: 1 },
            ],
          });
        }
        return Promise.resolve({ keywords: [] });
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        const scoreMap: { [key: string]: number } = {
          "DB接続エラー": 85,
          "ログイン画面": 60,
        };
        return Promise.resolve({ impactScore: scoreMap[keyword] || 0 });
      }),
      classifyIssueSeverity: jest.fn(() => Promise.resolve({ severity: "high" })),
    };

    const resultA = calculateIssuePriorityScore(issueA, textAnalysisStub);
    const resultB = calculateIssuePriorityScore(issueB, textAnalysisStub);

    expect(resultA.priorityScore).toBe(145);
    expect(resultB.priorityScore).toBe(145);
    expect(resultA.scoreBreakdown.frequencyScore).toBeGreaterThan(0);
    expect(resultA.scoreBreakdown.impactScore).toBeGreaterThan(0);
    expect(resultB.scoreBreakdown.frequencyScore).toBeGreaterThan(0);
    expect(resultB.scoreBreakdown.impactScore).toBeGreaterThan(0);
  });
});

interface IssuePriorityScoringInput {
  issueId: string;
  issueContent: string;
  occurrenceFrequency: number;
  impactScore: number;
  affectedTeamCount: number;
  resolutionDaysAverage: number;
  reportingDate: string;
  teamId: string;
}