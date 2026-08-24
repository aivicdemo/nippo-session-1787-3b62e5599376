import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  // SCEN-602: [edge] 課題優先度判定機能 - 業務上の最大規模の課題データ（100件以上）を処理した場合、すべての課題に対して優先度ランクが正確に判定される
  test('should correctly assign priority ranks to 150 issues based on impact score and severity classification with zero failure rate and under 3 seconds', () => {
    // テストデータ準備: 150件の課題データを生成
    const test_issues: IssuePriorityScoringInput[] = [];
    
    // ランク1候補: 影響度スコア≥70かつ重要度が『高』
    for (let i = 0; i < 50; i++) {
      test_issues.push({
        issueId: `issue-rank1-${i}`,
        issueContent: `Critical issue content ${i}`,
        occurrenceFrequency: 10 + i,
        impactScore: 70 + (i % 31), // 70-100
        affectedTeamCount: 3 + (i % 5),
        resolutionDaysAverage: 2 + (i % 4),
        reportingDate: '2024-01-15',
        teamId: `team-${i % 5}`,
      });
    }

    // ランク2候補: 影響度スコア50-69かつ重要度が『中』
    for (let i = 50; i < 100; i++) {
      test_issues.push({
        issueId: `issue-rank2-${i}`,
        issueContent: `Medium issue content ${i}`,
        occurrenceFrequency: 5 + (i % 10),
        impactScore: 50 + ((i - 50) % 20), // 50-69
        affectedTeamCount: 2 + ((i - 50) % 3),
        resolutionDaysAverage: 3 + ((i - 50) % 5),
        reportingDate: '2024-01-15',
        teamId: `team-${i % 5}`,
      });
    }

    // ランク3候補: 影響度スコア<50または重要度が『低』
    for (let i = 100; i < 150; i++) {
      test_issues.push({
        issueId: `issue-rank3-${i}`,
        issueContent: `Low issue content ${i}`,
        occurrenceFrequency: 2 + ((i - 100) % 8),
        impactScore: (i - 100) % 50, // 0-49
        affectedTeamCount: 1 + ((i - 100) % 2),
        resolutionDaysAverage: 5 + ((i - 100) % 7),
        reportingDate: '2024-01-15',
        teamId: `team-${i % 5}`,
      });
    }

    // 処理開始時刻を記録
    const start_time = performance.now();

    // 全150件の課題に対して優先度判定を実行
    const results: IssuePriorityScoringOutput[] = [];
    let failure_count = 0;

    for (const issue of test_issues) {
      try {
        const result = calculateIssuePriorityScore(issue);
        results.push(result);
      } catch (error) {
        failure_count++;
      }
    }

    // 処理終了時刻を記録
    const end_time = performance.now();
    const execution_time_ms = end_time - start_time;

    // 1. 150件すべての課題に優先度ランクが割り当てられていることを確認
    expect(results).toHaveLength(150);
    expect(failure_count).toBe(0);

    // 2. 各課題の優先度ランクが判定ロジックに従っていることを検証
    for (let i = 0; i < 150; i++) {
      const input = test_issues[i];
      const output = results[i];

      expect(output).toBeDefined();
      expect(output.issueId).toBe(input.issueId);
      expect(output.priorityScore).toBeGreaterThanOrEqual(1);
      expect(output.priorityScore).toBeLessThanOrEqual(100);

      // 優先度ランク検証
      if (input.impactScore >= 70) {
        // ランク1: 高優先度（スコア70以上）
        expect(output.priorityRank).toBe('高');
        expect(output.priorityScore).toBeGreaterThanOrEqual(70);
        expect(output.colorCode).toBe('#FF0000');
      } else if (input.impactScore >= 50 && input.impactScore < 70) {
        // ランク2: 中優先度（スコア50-69）
        expect(output.priorityRank).toBe('中');
        expect(output.priorityScore).toBeGreaterThanOrEqual(40);
        expect(output.priorityScore).toBeLessThan(70);
        expect(output.colorCode).toBe('#FFFF00');
      } else {
        // ランク3: 低優先度（スコア50未満）
        expect(output.priorityRank).toBe('低');
        expect(output.priorityScore).toBeLessThan(40);
        expect(output.colorCode).toBe('#00FF00');
      }

      // スコア内訳の検証
      expect(output.scoreBreakdown).toBeDefined();
      expect(output.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
      expect(output.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
      expect(output.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
      expect(output.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
      expect(output.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
      expect(output.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

      // スコア合計の検証
      const total_breakdown = output.scoreBreakdown.frequencyScore +
        output.scoreBreakdown.impactScore +
        output.scoreBreakdown.resolutionDifficultyScore;
      expect(total_breakdown).toBe(output.priorityScore);
    }

    // 3. 実行時間が3秒以内であることを確認
    expect(execution_time_ms).toBeLessThan(3000);

    // 4. 判定失敗件数が0件であることを確認
    expect(failure_count).toBe(0);

    // 5. 各結果にcalculatedAtが設定されていることを確認（トレース可能性）
    for (const result of results) {
      expect(result.calculatedAt).toBeDefined();
      const calculated_timestamp = new Date(result.calculatedAt);
      expect(calculated_timestamp.getTime()).toBeGreaterThan(0);
    }

    // 6. ランク分布の確認
    const rank1_count = results.filter(r => r.priorityRank === '高').length;
    const rank2_count = results.filter(r => r.priorityRank === '中').length;
    const rank3_count = results.filter(r => r.priorityRank === '低').length;

    expect(rank1_count).toBe(50);
    expect(rank2_count).toBe(50);
    expect(rank3_count).toBe(50);
    expect(rank1_count + rank2_count + rank3_count).toBe(150);
  });
});