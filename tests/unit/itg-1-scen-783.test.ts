import { calculateIssuePriorityScore, type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の優先度スコア算出機能 - 最大規模入力処理', () => {
  // SCEN-783: [edge] 課題の優先度スコア算出機能 - 業務上の最大規模（全チームメンバー最大人数 × 最大日報数）の入力を処理したとき、優先度スコアが完了する
  test('チームメンバー10名 × 最大日報数の入力データに対して優先度スコア算出が完了し、全スコアが0～100の正の整数で、妥当な値である', () => {
    const MAX_TEAM_MEMBERS = 10;
    const MAX_REPORTS_PER_MEMBER = 20; // 業務上の最大日報数
    const TOTAL_INPUTS = MAX_TEAM_MEMBERS * MAX_REPORTS_PER_MEMBER;

    // テストデータ生成: チームメンバー10名 × 最大日報数の日報データ
    const testInputs: IssuePriorityScoringInput[] = [];

    for (let memberIdx = 0; memberIdx < MAX_TEAM_MEMBERS; memberIdx++) {
      for (let reportIdx = 0; reportIdx < MAX_REPORTS_PER_MEMBER; reportIdx++) {
        const issueId = `issue_${memberIdx}_${reportIdx}`;
        const occurrenceFrequency = (reportIdx % 10) + 1; // 1～10の頻度
        const impactScore = ((memberIdx + reportIdx) % 100); // 0～99の影響度スコア
        const affectedTeamCount = (reportIdx % 5) + 1; // 1～5のチーム数
        const resolutionDaysAverage = (reportIdx % 15) + 1; // 1～15日の平均解決日数

        const input: IssuePriorityScoringInput = {
          issueId,
          issueContent: `課題内容_メンバー${memberIdx}_報告${reportIdx}: システムパフォーマンス低下の問題が発生`,
          occurrenceFrequency,
          impactScore,
          affectedTeamCount,
          resolutionDaysAverage,
          reportingDate: new Date(2024, 0, 1 + reportIdx).toISOString(),
          teamId: `team_${memberIdx % 3}`, // 3チームに分散
        };

        testInputs.push(input);
      }
    }

    // 処理実行時間とメモリ使用量をモニタリング
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    // 優先度スコア算出機能を実行
    const outputs: IssuePriorityScoringOutput[] = [];
    for (const input of testInputs) {
      const output = calculateIssuePriorityScore(input);
      outputs.push(output);
    }

    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed;
    const executionTime = endTime - startTime;
    const memoryUsedMB = (endMemory - startMemory) / 1024 / 1024;

    // 処理完了確認: タイムアウト（30秒以内）と正常完了
    expect(executionTime).toBeLessThan(30000);
    expect(outputs).toHaveLength(TOTAL_INPUTS);
    expect(memoryUsedMB).toBeLessThan(500); // メモリオーバーフロー防止

    // 各出力の妥当性検証
    outputs.forEach((output, idx) => {
      // スコアが0～100の正の整数
      expect(output.priorityScore).toBeGreaterThanOrEqual(1);
      expect(output.priorityScore).toBeLessThanOrEqual(100);
      expect(Number.isInteger(output.priorityScore)).toBe(true);

      // priorityRankが「高」「中」「低」のいずれか
      expect(['高', '中', '低']).toContain(output.priorityRank);

      // scoreBreakdownの各値が妥当な範囲内
      expect(output.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
      expect(output.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
      expect(output.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
      expect(output.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
      expect(output.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
      expect(output.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

      // scoreBreakdownの合計がpriorityScoreと一致
      const totalScore = 
        output.scoreBreakdown.frequencyScore +
        output.scoreBreakdown.impactScore +
        output.scoreBreakdown.resolutionDifficultyScore;
      expect(totalScore).toBe(output.priorityScore);

      // colorCodeが正しい値
      expect(['#FF0000', '#FFFF00', '#00FF00']).toContain(output.colorCode);

      // calculatedAtがISO 8601形式
      const calculatedDate = new Date(output.calculatedAt);
      expect(calculatedDate.toString()).not.toBe('Invalid Date');

      // issueIdが正しく保持されている
      expect(output.issueId).toBe(testInputs[idx].issueId);
    });

    // スコア分布の検証: 優先度判定ルールに基づいた色分けが正しい
    const highPriorityThreshold = 70;
    const mediumPriorityThreshold = 40;

    outputs.forEach((output) => {
      if (output.priorityScore >= highPriorityThreshold) {
        expect(output.priorityRank).toBe('高');
        expect(output.colorCode).toBe('#FF0000');
      } else if (output.priorityScore >= mediumPriorityThreshold) {
        expect(output.priorityRank).toBe('中');
        expect(output.colorCode).toBe('#FFFF00');
      } else {
        expect(output.priorityRank).toBe('低');
        expect(output.colorCode).toBe('#00FF00');
      }
    });

    // 出力データの一貫性検証
    const uniqueIssueIds = new Set(outputs.map(o => o.issueId));
    expect(uniqueIssueIds.size).toBe(TOTAL_INPUTS);

    console.log(`✓ 処理完了: ${TOTAL_INPUTS}件の優先度スコア算出`);
    console.log(`  実行時間: ${executionTime}ms`);
    console.log(`  メモリ使用量: ${memoryUsedMB.toFixed(2)}MB`);
  });
});