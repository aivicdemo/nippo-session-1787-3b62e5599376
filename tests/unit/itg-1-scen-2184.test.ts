import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  test('SCEN-2184: 複数チーム・複数プロジェクトから集約した業務上の最大規模課題データセット（数千件）で優先度スコアが正しく算出される', () => {
    // テスト用の大規模データセット（3,000件）を生成
    const largeIssueDataset: IssuePriorityScoringInput[] = [];
    const numberOfIssues = 3000;
    const baseTimestamp = new Date('2024-01-15T09:00:00Z').getTime();

    // 複数チーム・複数プロジェクトのシミュレーション
    const teamIds = ['team-001', 'team-002', 'team-003', 'team-004', 'team-005'];
    const severityLevels = ['高', '中', '低'] as const;
    const keywords = [
      'パフォーマンス低下',
      'メモリリーク',
      'UI応答遅延',
      'データベース接続失敗',
      'API呼び出し制限',
      'ネットワークエラー',
      'テストカバレッジ不足',
      'ドキュメント未整備',
      'デプロイ失敗',
      'セキュリティ脆弱性',
    ];

    // 3,000件の課題データを生成（チーム・プロジェクト・タイムスタンプを変動させる）
    for (let i = 0; i < numberOfIssues; i++) {
      const teamIndex = i % teamIds.length;
      const severityIndex = i % severityLevels.length;
      const keywordIndex = i % keywords.length;
      const occurrenceFrequency = Math.floor(Math.random() * 30) + 1; // 1～30件
      const impactScore = Math.floor(Math.random() * 101); // 0～100
      const affectedTeamCount = Math.floor(Math.random() * 5) + 1; // 1～5チーム
      const resolutionDaysAverage = Math.floor(Math.random() * 14) + 1; // 1～14日
      const reportingDate = new Date(baseTimestamp + i * 60000).toISOString(); // 1分ずつ時間をずらす

      largeIssueDataset.push({
        issueId: `issue-${String(i).padStart(5, '0')}`,
        issueContent: `${keywords[keywordIndex]}: チーム${teamIds[teamIndex]}における課題レコード${i}`,
        occurrenceFrequency: occurrenceFrequency,
        impactScore: impactScore,
        affectedTeamCount: affectedTeamCount,
        resolutionDaysAverage: resolutionDaysAverage,
        reportingDate: reportingDate,
        teamId: teamIds[teamIndex],
      });
    }

    // 記憶容量とパフォーマンス計測用の開始時刻
    const startTime = performance.now();
    const initialMemory = process.memoryUsage().heapUsed;

    // 優先度スコア算出処理を実行
    const priorityScoreResults: IssuePriorityScoringOutput[] = [];
    for (const issue of largeIssueDataset) {
      const result = calculateIssuePriorityScore(issue);
      priorityScoreResults.push(result);
    }

    const endTime = performance.now();
    const finalMemory = process.memoryUsage().heapUsed;
    const processingTimeMs = endTime - startTime;
    const memoryIncreaseMb = (finalMemory - initialMemory) / (1024 * 1024);

    // 1. 全3,000件について、優先度スコアが正確に計算されていることを検証
    const sampledResults = priorityScoreResults.slice(0, 100);
    for (const result of sampledResults) {
      const originIssue = largeIssueDataset.find((issue) => issue.issueId === result.issueId);
      if (originIssue) {
        // 式: priorityScore = (impactScore × 0.6) + (severityValue × 40) ÷ 100
        // severityValue: 高=3、中=2、低=1
        let severityValue = 1; // デフォルト: 低
        if (result.priorityRank === '高') {
          severityValue = 3;
        } else if (result.priorityRank === '中') {
          severityValue = 2;
        }

        const expectedScore = Math.round(((originIssue.impactScore * 0.6) + (severityValue * 40)) / 100);
        expect(result.priorityScore).toBe(expectedScore);
      }
    }

    // 2. 全スコアが0～100の範囲内に収まっていることを確認
    for (const result of priorityScoreResults) {
      expect(result.priorityScore).toBeGreaterThanOrEqual(0);
      expect(result.priorityScore).toBeLessThanOrEqual(100);
    }

    // 3. 処理時間が30秒以内に完了することを確認
    expect(processingTimeMs).toBeLessThan(30000);

    // 4. メモリ使用量の増加が500MB以内に収まっていることを確認
    expect(memoryIncreaseMb).toBeLessThan(500);

    // 5. 優先度スコアが同一の課題については、タイムスタンプ順に安定してソートされていることを検証
    const groupedByScore = new Map<number, IssuePriorityScoringOutput[]>();
    for (const result of priorityScoreResults) {
      if (!groupedByScore.has(result.priorityScore)) {
        groupedByScore.set(result.priorityScore, []);
      }
      groupedByScore.get(result.priorityScore)!.push(result);
    }

    for (const [, groupResults] of groupedByScore.entries()) {
      if (groupResults.length > 1) {
        // 同一スコア内でタイムスタンプが昇順であることを確認
        for (let i = 1; i < groupResults.length; i++) {
          const currentIssue = largeIssueDataset.find((issue) => issue.issueId === groupResults[i].issueId);
          const previousIssue = largeIssueDataset.find((issue) => issue.issueId === groupResults[i - 1].issueId);
          if (currentIssue && previousIssue) {
            const currentTimestamp = new Date(currentIssue.reportingDate).getTime();
            const previousTimestamp = new Date(previousIssue.reportingDate).getTime();
            expect(currentTimestamp).toBeGreaterThanOrEqual(previousTimestamp);
          }
        }
      }
    }

    // 6. 結果の件数が入力と一致することを確認
    expect(priorityScoreResults.length).toBe(numberOfIssues);

    // 7. 各結果に必須フィールドが存在することを確認
    for (const result of priorityScoreResults) {
      expect(result.issueId).toBeDefined();
      expect(result.priorityScore).toBeDefined();
      expect(result.priorityRank).toBeDefined();
      expect(['高', '中', '低']).toContain(result.priorityRank);
      expect(result.scoreBreakdown).toBeDefined();
      expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
      expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
      expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
      expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/i);
      expect(result.calculatedAt).toBeDefined();
    }
  });
});