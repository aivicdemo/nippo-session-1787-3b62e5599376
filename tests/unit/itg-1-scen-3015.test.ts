import { describe, test, expect } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from "../../src/logic/issue-extraction-prioritization";

describe("課題優先度スコア計算 - 同一スコア課題の順序一貫性", () => {
  test("SCEN-3015: 同一優先度スコアを持つ複数課題が5回連続実行で一貫した順序を保つ", () => {
    // テストデータ: 同一優先度スコア（75点）を持つ課題3件
    // 課題ID、タイトル、作成日時が異なる
    const issue_a_input: IssuePriorityScoringInput = {
      issueId: "issue-001",
      issueContent: "Database connection timeout occurring frequently",
      occurrenceFrequency: 8,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-10",
      teamId: "team-dev-alpha",
    };

    const issue_b_input: IssuePriorityScoringInput = {
      issueId: "issue-002",
      issueContent: "Memory leak in background service",
      occurrenceFrequency: 8,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-11",
      teamId: "team-dev-alpha",
    };

    const issue_c_input: IssuePriorityScoringInput = {
      issueId: "issue-003",
      issueContent: "API response latency degradation",
      occurrenceFrequency: 8,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-12",
      teamId: "team-dev-alpha",
    };

    const test_inputs = [issue_a_input, issue_b_input, issue_c_input];

    // 5回連続実行して各回の結果を記録
    const execution_results: IssuePriorityScoringOutput[][] = [];

    for (let iteration = 0; iteration < 5; iteration++) {
      const iteration_results: IssuePriorityScoringOutput[] = test_inputs.map(
        (input) => calculateIssuePriorityScore(input)
      );
      execution_results.push(iteration_results);
    }

    // 全て の実行結果が同じ優先度スコア（75点）を持つことを確認
    for (let iteration = 0; iteration < 5; iteration++) {
      const results = execution_results[iteration];
      for (const result of results) {
        expect(result.priorityScore).toBe(75);
      }
    }

    // 同一優先度スコア課題の順序が5回全て一致していることを確認
    // 最初の実行結果を基準順序として記録
    const baseline_order = execution_results[0].map((result) => result.issueId);

    // 2回目以降の実行結果を基準順序と比較
    for (let iteration = 1; iteration < 5; iteration++) {
      const current_order = execution_results[iteration].map(
        (result) => result.issueId
      );

      // 順序が完全に一致していることを確認
      expect(current_order).toEqual(baseline_order);
    }

    // 優先度ランクが全て同じであることを確認
    const baseline_ranks = execution_results[0].map((result) => result.priorityRank);
    for (let iteration = 1; iteration < 5; iteration++) {
      const current_ranks = execution_results[iteration].map(
        (result) => result.priorityRank
      );
      expect(current_ranks).toEqual(baseline_ranks);
    }

    // スコア計算の内訳が一貫していることを確認
    // 複数回実行での内訳の一致を確認
    for (let iteration = 1; iteration < 5; iteration++) {
      for (let issue_index = 0; issue_index < 3; issue_index++) {
        const baseline_breakdown =
          execution_results[0][issue_index].scoreBreakdown;
        const current_breakdown =
          execution_results[iteration][issue_index].scoreBreakdown;

        expect(current_breakdown.frequencyScore).toBe(
          baseline_breakdown.frequencyScore
        );
        expect(current_breakdown.impactScore).toBe(
          baseline_breakdown.impactScore
        );
        expect(current_breakdown.resolutionDifficultyScore).toBe(
          baseline_breakdown.resolutionDifficultyScore
        );
      }
    }

    // 色コードが一致していることを確認
    for (let iteration = 1; iteration < 5; iteration++) {
      for (let issue_index = 0; issue_index < 3; issue_index++) {
        const baseline_color = execution_results[0][issue_index].colorCode;
        const current_color =
          execution_results[iteration][issue_index].colorCode;
        expect(current_color).toBe(baseline_color);
      }
    }
  });
});