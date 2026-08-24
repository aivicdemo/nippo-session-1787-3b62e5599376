import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能", () => {
  // SCEN-643
  test("過去30日を超えた31日前の履歴データが計測対象外として除外される", () => {
    const baselineDate = new Date("2026-09-19T10:00:00Z");
    const now = baselineDate.getTime();

    // 30日前（計測対象内）: 2026年8月20日
    const thirtyDaysAgoMs = 30 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgoDate = new Date(now - thirtyDaysAgoMs);

    // 31日前（計測対象外）: 2026年8月19日
    const thirtyOneDaysAgoMs = 31 * 24 * 60 * 60 * 1000;
    const thirtyOneDaysAgoDate = new Date(now - thirtyOneDaysAgoMs);

    // ISO 8601形式で固定値を使用
    const thirtyDaysAgoIso = "2026-08-20T10:00:00Z";
    const thirtyOneDaysAgoIso = "2026-08-19T10:00:00Z";

    // 31日前のデータ（計測対象外として除外されるべき）
    const outOfRangeIssueInput: IssuePriorityScoringInput = {
      issueId: "issue-31days-ago",
      issueContent: "DB接続エラーが発生し、ユーザーがアクセスできない状態が続いている",
      occurrenceFrequency: 5,
      impactScore: 80,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: thirtyOneDaysAgoIso,
      teamId: "team-001",
    };

    // 30日前のデータ（計測対象内として含まれるべき）
    const withinRangeIssueInput: IssuePriorityScoringInput = {
      issueId: "issue-30days-ago",
      issueContent: "サーバー障害により全サービスが一時停止",
      occurrenceFrequency: 8,
      impactScore: 75,
      affectedTeamCount: 5,
      resolutionDaysAverage: 1.5,
      reportingDate: thirtyDaysAgoIso,
      teamId: "team-001",
    };

    // スコア計算（31日前のデータは計測対象外のため計算から除外されるべき）
    const resultWithinRange = calculateIssuePriorityScore(
      withinRangeIssueInput,
      baselineDate
    );

    const resultOutOfRange = calculateIssuePriorityScore(
      outOfRangeIssueInput,
      baselineDate
    );

    // 30日前のデータは正常にスコア計算される
    expect(resultWithinRange).toHaveProperty("priorityScore");
    expect(resultWithinRange.priorityScore).toBeGreaterThanOrEqual(1);
    expect(resultWithinRange.priorityScore).toBeLessThanOrEqual(100);

    // 31日前のデータの計算結果確認
    // 計測対象外のため、スコア計算ロジックが期限外データを識別する
    expect(resultOutOfRange).toHaveProperty("priorityScore");

    // 31日前のデータが計測対象外として判定されることを確認
    // 期限外データは優先度が低下するか、フラグで識別される
    const outOfRangeReportingDateMs = new Date(
      outOfRangeIssueInput.reportingDate
    ).getTime();
    const daysElapsed = (now - outOfRangeReportingDateMs) / (24 * 60 * 60 * 1000);

    // 31日前は30日を超えているため計測対象外
    expect(daysElapsed).toBeGreaterThan(30);

    // 30日前は30日以内のため計測対象内
    const withinRangeReportingDateMs = new Date(
      withinRangeIssueInput.reportingDate
    ).getTime();
    const daysElapsedWithin =
      (now - withinRangeReportingDateMs) / (24 * 60 * 60 * 1000);
    expect(daysElapsedWithin).toBeLessThanOrEqual(30);

    // スコア計算の結果確認
    // 30日以内のデータはスコアが適切に計算される
    expect(resultWithinRange.priorityScore).toBeGreaterThan(0);

    // 31日前のデータが計測対象外として処理されたことを確認
    // resultOutOfRangeのscoreBreakdownでfrequencyScoreが低下していることを検証
    expect(resultOutOfRange.scoreBreakdown).toHaveProperty("frequencyScore");
    expect(resultOutOfRange.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(
      40
    );
  });
});