import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Cross-Month Date Boundary', () => {
  // SCEN-2186: [edge] 課題優先度スコア算出機能 - 過去データが月末から月初をまたぐ期間で参照される場合、全期間の課題が正しく集約される

  test('should correctly aggregate and score issues spanning month-end to month-start boundary', () => {
    // 月末（1月31日）から月初（2月5日）にかけて報告された課題データを準備
    // 以下の課題は期間内に報告されたもの
    const issue_jan_31_morning: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout on January 31st morning',
      occurrenceFrequency: 3,
      impactScore: 85,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-31T08:30:00Z',
      teamId: 'team-A',
    };

    const issue_jan_31_evening: IssuePriorityScoringInput = {
      issueId: 'issue-002',
      issueContent: 'API response delay on January 31st evening',
      occurrenceFrequency: 5,
      impactScore: 72,
      affectedTeamCount: 3,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-31T18:45:00Z',
      teamId: 'team-B',
    };

    const issue_feb_01: IssuePriorityScoringInput = {
      issueId: 'issue-003',
      issueContent: 'Memory leak detected on February 1st',
      occurrenceFrequency: 4,
      impactScore: 90,
      affectedTeamCount: 4,
      resolutionDaysAverage: 3,
      reportingDate: '2024-02-01T09:00:00Z',
      teamId: 'team-C',
    };

    const issue_feb_03: IssuePriorityScoringInput = {
      issueId: 'issue-004',
      issueContent: 'File upload failure on February 3rd',
      occurrenceFrequency: 2,
      impactScore: 65,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1,
      reportingDate: '2024-02-03T14:20:00Z',
      teamId: 'team-A',
    };

    const issue_feb_05: IssuePriorityScoringInput = {
      issueId: 'issue-005',
      issueContent: 'Performance degradation on February 5th',
      occurrenceFrequency: 6,
      impactScore: 78,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-02-05T16:10:00Z',
      teamId: 'team-B',
    };

    // 期間外のデータ（除外されるべき）
    const issue_jan_30: IssuePriorityScoringInput = {
      issueId: 'issue-outside-001',
      issueContent: 'Old issue before period',
      occurrenceFrequency: 2,
      impactScore: 50,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-30T10:00:00Z',
      teamId: 'team-A',
    };

    const issue_feb_06: IssuePriorityScoringInput = {
      issueId: 'issue-outside-002',
      issueContent: 'Issue after period boundary',
      occurrenceFrequency: 1,
      impactScore: 40,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1,
      reportingDate: '2024-02-06T11:00:00Z',
      teamId: 'team-C',
    };

    // 期間内の課題を集約して評価
    const period_start = new Date('2024-01-31T00:00:00Z');
    const period_end = new Date('2024-02-05T23:59:59Z');

    // 期間内の課題リスト（全5件）
    const issues_in_period = [
      issue_jan_31_morning,
      issue_jan_31_evening,
      issue_feb_01,
      issue_feb_03,
      issue_feb_05,
    ];

    // 各課題に対して優先度スコアを計算
    const scored_results: IssuePriorityScoringOutput[] = [];
    for (const issue of issues_in_period) {
      const result = calculateIssuePriorityScore(issue);
      scored_results.push(result);
    }

    // (a) 月末のデータ（1月31日）が参照対象に含まれていることを確認
    const jan_31_results = scored_results.filter(
      (r) =>
        r.issueId === 'issue-001' ||
        r.issueId === 'issue-002'
    );
    expect(jan_31_results).toHaveLength(2);
    expect(jan_31_results.map((r) => r.issueId)).toContain('issue-001');
    expect(jan_31_results.map((r) => r.issueId)).toContain('issue-002');

    // (b) 月初のデータ（2月1日～5日）が参照対象に含まれていることを確認
    const feb_results = scored_results.filter(
      (r) =>
        r.issueId === 'issue-003' ||
        r.issueId === 'issue-004' ||
        r.issueId === 'issue-005'
    );
    expect(feb_results).toHaveLength(3);
    expect(feb_results.map((r) => r.issueId)).toContain('issue-003');
    expect(feb_results.map((r) => r.issueId)).toContain('issue-004');
    expect(feb_results.map((r) => r.issueId)).toContain('issue-005');

    // (c) 期間外のデータ（1月30日以前、2月6日以降）が除外されていることを確認
    const all_issue_ids = scored_results.map((r) => r.issueId);
    expect(all_issue_ids).not.toContain('issue-outside-001');
    expect(all_issue_ids).not.toContain('issue-outside-002');

    // スコア計算式の検証
    // 優先度スコア = (発生頻度スコア × 0.4) + (影響度スコア × 0.4) + (解決難度スコア × 0.2)
    // 発生頻度スコア = min(発生頻度 × 10, 40)
    // 解決難度スコア = (平均解決日数 / 影響チーム数) × 10（上限20）

    // issue_jan_31_morning (issue-001)
    const jan_31_morning_result = scored_results.find((r) => r.issueId === 'issue-001')!;
    const jan_31_morning_freq_score = Math.min(3 * 10, 40); // 30
    const jan_31_morning_resolution_difficulty =
      Math.min((2 / 2) * 10, 20); // 10
    const jan_31_morning_expected_score =
      jan_31_morning_freq_score * 0.4 +
      85 * 0.4 +
      jan_31_morning_resolution_difficulty * 0.2;
    // = 30 * 0.4 + 85 * 0.4 + 10 * 0.2
    // = 12 + 34 + 2 = 48
    expect(jan_31_morning_result.priorityScore).toBe(48);
    expect(jan_31_morning_result.scoreBreakdown.frequencyScore).toBe(
      jan_31_morning_freq_score
    );
    expect(jan_31_morning_result.scoreBreakdown.impactScore).toBe(85);
    expect(jan_31_morning_result.scoreBreakdown.resolutionDifficultyScore).toBe(
      jan_31_morning_resolution_difficulty
    );

    // issue_jan_31_evening (issue-002)
    const jan_31_evening_result = scored_results.find(
      (r) => r.issueId === 'issue-002'
    )!;
    const jan_31_evening_freq_score = Math.min(5 * 10, 40); // 40
    const jan_31_evening_resolution_difficulty =
      Math.min((1 / 3) * 10, 20); // 3.333...（上限20なのでそのまま）
    const jan_31_evening_expected_score =
      jan_31_evening_freq_score * 0.4 +
      72 * 0.4 +
      jan_31_evening_resolution_difficulty * 0.2;
    // = 40 * 0.4 + 72 * 0.4 + 3.333... * 0.2
    // = 16 + 28.8 + 0.666... = 45.466...
    expect(jan_31_evening_result.priorityScore).toBeCloseTo(45.47, 1);

    // issue_feb_01 (issue-003) - 最高影響度
    const feb_01_result = scored_results.find((r) => r.issueId === 'issue-003')!;
    const feb_01_freq_score = Math.min(4 * 10, 40); // 40
    const feb_01_resolution_difficulty =
      Math.min((3 / 4) * 10, 20); // 7.5
    const feb_01_expected_score =
      feb_01_freq_score * 0.4 + 90 * 0.4 + feb_01_resolution_difficulty * 0.2;
    // = 40 * 0.4 + 90 * 0.4 + 7.5 * 0.2
    // = 16 + 36 + 1.5 = 53.5
    expect(feb_01_result.priorityScore).toBe(53.5);

    // issue_feb_03 (issue-004) - 低スコア
    const feb_03_result = scored_results.find((r) => r.issueId === 'issue-004')!;
    const feb_03_freq_score = Math.min(2 * 10, 40); // 20
    const feb_03_resolution_difficulty =
      Math.min((1 / 1) * 10, 20); // 10
    const feb_03_expected_score =
      feb_03_freq_score * 0.4 +
      65 * 0.4 +
      feb_03_resolution_difficulty * 0.2;
    // = 20 * 0.4 + 65 * 0.4 + 10 * 0.2
    // = 8 + 26 + 2 = 36
    expect(feb_03_result.priorityScore).toBe(36);

    // issue_feb_05 (issue-005) - 高頻度
    const feb_05_result = scored_results.find((r) => r.issueId === 'issue-005')!;
    const feb_05_freq_score = Math.min(6 * 10, 40); // 40
    const feb_05_resolution_difficulty =
      Math.min((2 / 2) * 10, 20); // 10
    const feb_05_expected_score =
      feb_05_freq_score * 0.4 +
      78 * 0.4 +
      feb_05_resolution_difficulty * 0.2;
    // = 40 * 0.4 + 78 * 0.4 + 10 * 0.2
    // = 16 + 31.2 + 2 = 49.2
    expect(feb_05_result.priorityScore).toBe(49.2);

    // 優先度ランクの判定（高優先度閾値=70、中優先度閾値=40）
    expect(jan_31_morning_result.priorityRank).toBe('中');
    expect(jan_31_evening_result.priorityRank).toBe('中');
    expect(feb_01_result.priorityRank).toBe('中');
    expect(feb_03_result.priorityRank).toBe('低');
    expect(feb_05_result.priorityRank).toBe('中');

    // 色コードの検証
    expect(jan_31_morning_result.colorCode).toBe('#FFFF00'); // 中=黄色
    expect(feb_01_result.colorCode).toBe('#FFFF00'); // 中=黄色
    expect(feb_03_result.colorCode).toBe('#00FF00'); // 低=緑
    expect(feb_05_result.colorCode).toBe('#FFFF00'); // 中=黄色

    // 計算実行日時が記録されていることを確認
    scored_results.forEach((result) => {
      expect(result.calculatedAt).toBeDefined();
      const calc_date = new Date(result.calculatedAt);
      expect(calc_date.getTime()).toBeGreaterThan(
        new Date('2024-01-31T00:00:00Z').getTime()
      );
    });

    // 集約結果の課題件数が期間内に報告された全課題数と一致することを確認
    expect(scored_results).toHaveLength(5);
    expect(scored_results.map((r) => r.issueId)).toEqual([
      'issue-001',
      'issue-002',
      'issue-003',
      'issue-004',
      'issue-005',
    ]);
  });
});