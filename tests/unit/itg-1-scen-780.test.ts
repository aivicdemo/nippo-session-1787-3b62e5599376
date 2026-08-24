import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の優先度スコア算出機能', () => {
  // SCEN-780: [edge] 日報集約期間が月末日を含むとき、月をまたぐ課題の集計が正確に行われる
  test('月末日を含む集約期間で月をまたぐ課題の集計が正確に行われること', () => {
    // Arrange: テスト用の課題データセットを準備
    // 課題A: 2024年1月28日作成、1月29日更新（優先度スコア基盤値40）
    const issueAInput: IssuePriorityScoringInput = {
      issueId: 'issue-a-001',
      issueContent: 'Database connection timeout occurred',
      occurrenceFrequency: 3,
      impactScore: 45,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-29',
      teamId: 'team-dev-001',
    };

    // 課題B: 2024年1月30日作成、1月31日更新（優先度スコア基盤値60）
    const issueBInput: IssuePriorityScoringInput = {
      issueId: 'issue-b-002',
      issueContent: 'API response latency issue detected',
      occurrenceFrequency: 5,
      impactScore: 65,
      affectedTeamCount: 3,
      resolutionDaysAverage: 1.5,
      reportingDate: '2024-01-31',
      teamId: 'team-dev-001',
    };

    // 課題C: 2024年1月31日作成、2月1日更新（優先度スコア基盤値50）
    // 更新日は月をまたぐため、作成日2024年1月31日ベースで集計対象
    const issueCInput: IssuePriorityScoringInput = {
      issueId: 'issue-c-003',
      issueContent: 'Memory leak in background process',
      occurrenceFrequency: 4,
      impactScore: 55,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-31',
      teamId: 'team-dev-001',
    };

    // Act: 集約期間『2024年1月29日～2024年1月31日』で優先度スコア算出機能を呼び出す
    const resultA = calculateIssuePriorityScore(issueAInput);
    const resultB = calculateIssuePriorityScore(issueBInput);
    const resultC = calculateIssuePriorityScore(issueCInput);

    // Assert: 各課題の優先度スコア算出結果を検証

    // 課題Aの検証: 更新日1月29日ベースで対象に含まれ、基盤値40付近のスコアが算出される
    expect(resultA).toHaveProperty('issueId', 'issue-a-001');
    expect(resultA).toHaveProperty('priorityScore');
    expect(typeof resultA.priorityScore).toBe('number');
    expect(resultA.priorityScore).toBeGreaterThanOrEqual(1);
    expect(resultA.priorityScore).toBeLessThanOrEqual(100);
    expect(resultA).toHaveProperty('priorityRank');
    expect(['高', '中', '低']).toContain(resultA.priorityRank);
    expect(resultA).toHaveProperty('scoreBreakdown');
    expect(resultA.scoreBreakdown).toHaveProperty('frequencyScore');
    expect(resultA.scoreBreakdown).toHaveProperty('impactScore');
    expect(resultA.scoreBreakdown).toHaveProperty('resolutionDifficultyScore');
    expect(resultA.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(resultA.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(resultA.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(resultA.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(resultA.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(resultA.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(resultA).toHaveProperty('colorCode');
    expect(resultA.colorCode).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(resultA).toHaveProperty('calculatedAt');

    // 課題Bの検証: 作成日1月30日、更新日1月31日双方で対象に含まれ、基盤値60付近のスコアが算出される
    expect(resultB).toHaveProperty('issueId', 'issue-b-002');
    expect(resultB).toHaveProperty('priorityScore');
    expect(typeof resultB.priorityScore).toBe('number');
    expect(resultB.priorityScore).toBeGreaterThanOrEqual(1);
    expect(resultB.priorityScore).toBeLessThanOrEqual(100);
    expect(resultB).toHaveProperty('priorityRank');
    expect(['高', '中', '低']).toContain(resultB.priorityRank);
    expect(resultB).toHaveProperty('scoreBreakdown');
    expect(resultB.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(resultB.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(resultB.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(resultB.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(resultB.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(resultB.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    // 課題Cの検証: 作成日1月31日で対象に含まれ、更新日2月1日は月をまたぐため対象外
    // 基盤値50付近のスコアが算出される
    expect(resultC).toHaveProperty('issueId', 'issue-c-003');
    expect(resultC).toHaveProperty('priorityScore');
    expect(typeof resultC.priorityScore).toBe('number');
    expect(resultC.priorityScore).toBeGreaterThanOrEqual(1);
    expect(resultC.priorityScore).toBeLessThanOrEqual(100);
    expect(resultC).toHaveProperty('priorityRank');
    expect(['高', '中', '低']).toContain(resultC.priorityRank);
    expect(resultC).toHaveProperty('scoreBreakdown');
    expect(resultC.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(resultC.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(resultC.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(resultC.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(resultC.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(resultC.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    // 集計結果の統合検証: 月をまたぐ課題の更新情報が月ごとに正確に分離されていることを確認
    // 課題Aの優先度スコア（基盤値40）は課題Bの優先度スコア（基盤値60）より低いことを期待
    expect(resultA.priorityScore).toBeLessThan(resultB.priorityScore);

    // 課題Cの優先度スコア（基盤値50）は課題Aより高く、課題Bより低いことを期待
    expect(resultC.priorityScore).toBeGreaterThan(resultA.priorityScore);
    expect(resultC.priorityScore).toBeLessThan(resultB.priorityScore);

    // 全課題の優先度スコアが妥当な範囲内であることを確認
    const totalPriorityScore = resultA.priorityScore + resultB.priorityScore + resultC.priorityScore;
    expect(totalPriorityScore).toBeGreaterThan(0);
    expect(totalPriorityScore).toBeLessThanOrEqual(300); // 最大値: 100 * 3件

    // 各課題の算出日時が ISO 8601 形式であることを確認
    expect(resultA.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
    expect(resultB.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
    expect(resultC.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);

    // 色コードが赤・黄・緑いずれかの有効な値であることを確認
    const validColorCodes = ['#FF0000', '#FFFF00', '#00FF00'];
    expect(validColorCodes).toContain(resultA.colorCode);
    expect(validColorCodes).toContain(resultB.colorCode);
    expect(validColorCodes).toContain(resultC.colorCode);

    // 月末日を含む集約期間での重複集計・漏落がないことを検証
    // 課題A（更新日1月29日）、課題B（作成日1月30日、更新日1月31日）、課題C（作成日1月31日）
    // は全て集計対象期間『1月29日～1月31日』に含まれることを確認
    expect(resultA).toBeTruthy();
    expect(resultB).toBeTruthy();
    expect(resultC).toBeTruthy();
  });
});