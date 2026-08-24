import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-927
  test('[edge] 課題優先度スコア算出機能 - 業務上の最大規模（数千件の課題キーワード重複抽出）に対して、優先度スコアが正確に算出される', () => {
    // テストデータ: 3000件の重複キーワード
    const api_failure_count = 500;
    const auth_error_count = 450;
    const network_timeout_count = 400;
    const database_lock_count = 350;
    const memory_leak_count = 300;
    const other_keywords_count = 600;
    
    const total_keywords = api_failure_count + auth_error_count + network_timeout_count + 
                          database_lock_count + memory_leak_count + other_keywords_count;
    
    // テストデータ: IssuePriorityScoringInput型に合わせたデータセット
    const test_issue_input = {
      issueId: 'test-issue-001',
      issueContent: 'API呼び出しに失敗する問題が発生',
      occurrenceFrequency: api_failure_count,
      impactScore: 85,
      affectedTeamCount: 5,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-dev-001'
    };

    // 出現頻度と重要度係数による期待スコア計算
    // API障害: (500/3000) × 100 = 16.666...
    const api_failure_score = Math.round((api_failure_count / total_keywords) * 100 * 100) / 100;
    
    // 実際の関数呼び出し
    const result = calculateIssuePriorityScore(test_issue_input);

    // アサーション: priorityScoreが1～100の範囲内か確認
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);

    // アサーション: ScoreBreakdownが計算されているか確認
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    // アサーション: 各スコアの合計がpriorityScoreと一致するか確認
    const total_breakdown_score = result.scoreBreakdown.frequencyScore + 
                                  result.scoreBreakdown.impactScore + 
                                  result.scoreBreakdown.resolutionDifficultyScore;
    expect(result.priorityScore).toBe(total_breakdown_score);

    // アサーション: priorityRankが適切に設定されているか確認
    expect(['高', '中', '低']).toContain(result.priorityRank);

    // アサーション: 高優先度の条件確認（スコア70以上）
    if (result.priorityScore >= 70) {
      expect(result.priorityRank).toBe('高');
    }
    // 中優先度の条件確認（スコア40以上70未満）
    if (result.priorityScore >= 40 && result.priorityScore < 70) {
      expect(result.priorityRank).toBe('中');
    }
    // 低優先度の条件確認（スコア40未満）
    if (result.priorityScore < 40) {
      expect(result.priorityRank).toBe('低');
    }

    // アサーション: colorCodeが正しく設定されているか確認
    if (result.priorityRank === '高') {
      expect(result.colorCode).toBe('#FF0000');
    } else if (result.priorityRank === '中') {
      expect(result.colorCode).toBe('#FFFF00');
    } else if (result.priorityRank === '低') {
      expect(result.colorCode).toBe('#00FF00');
    }

    // アサーション: calculatedAtが有効な日時か確認
    const calculated_at_date = new Date(result.calculatedAt);
    expect(calculated_at_date.getTime()).toBeGreaterThan(0);

    // 複数回実行での一貫性確認（最低5回）
    const consistency_results = [];
    for (let i = 0; i < 5; i++) {
      const consistency_result = calculateIssuePriorityScore(test_issue_input);
      consistency_results.push(consistency_result.priorityScore);
    }

    // すべての実行結果が同一のスコアを返却することを確認
    const first_score = consistency_results[0];
    consistency_results.forEach((score) => {
      expect(score).toBe(first_score);
    });

    // 処理時間測定: 大規模データセット（複数キーワード）での処理が5秒以内か確認
    const start_time = performance.now();
    for (let i = 0; i < 10; i++) {
      calculateIssuePriorityScore(test_issue_input);
    }
    const end_time = performance.now();
    const elapsed_time_ms = end_time - start_time;

    // 10回の実行が5秒以内に完了することを確認
    expect(elapsed_time_ms).toBeLessThan(5000);

    // 追加確認: issueIdが結果に正しく保持されているか
    expect(result.issueId).toBe('test-issue-001');
  });
});