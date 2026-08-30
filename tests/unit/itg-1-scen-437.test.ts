import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';
import { type Report, type RankedIssueList } from '../../src/logic/issue-extraction-and-ranking';

describe('朝会報告管理システム - 課題抽出と優先度ランク付け', () => {
  test('SCEN-437: 複数の日報から課題キーワードを自動抽出し、発生頻度と影響度に基づいて優先度スコアを計算して、優先度別に順序付けされた課題一覧を生成する', () => {
    // テストデータの準備: 3件の日報オブジェクト
    const testReports: Report[] = [
      {
        reportId: 'report-001',
        reportDate: new Date('2024-01-15T09:00:00Z'),
        issueText: 'サーバーダウンが発生し、顧客対応に追われた。ドキュメント遅延も懸念事項',
        teamId: 'team-A',
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2024-01-16T09:00:00Z'),
        issueText: 'サーバーダウンの復旧に時間を要した。リソース不足が背景にある',
        teamId: 'team-A',
      },
      {
        reportId: 'report-003',
        reportDate: new Date('2024-01-17T09:00:00Z'),
        issueText: 'ドキュメント遅延のため、テストが遅れている。サーバーダウンの影響継続',
        teamId: 'team-B',
      },
    ];

    // 分析期間を過去30日間で設定
    const now = new Date('2024-01-17T10:00:00Z');
    const analysisStartDate = new Date('2023-12-18T00:00:00Z');
    const analysisEndDate = new Date('2024-01-17T23:59:59Z');

    // minimumConfidenceThresholdはデフォルト値の50に設定
    const minimumConfidenceThreshold = 50;

    // 関数を実行
    const result: RankedIssueList = extractAndRankIssuesFromReports({
      reports: testReports,
      analysisStartDate,
      analysisEndDate,
      minimumConfidenceThreshold,
    });

    // 期待値の計算
    // 抽出キーワード: 『サーバーダウン』信頼度75、発生回数3、影響度スコア66.67（2チーム/3中）
    // 『ドキュメント遅延』信頼度82、発生回数2、影響度スコア66.67（2チーム/3中）
    // 『リソース不足』信頼度60、発生回数1、影響度スコア33.33（1チーム/3中）
    // 優先度スコア計算式: 発生頻度 × 50 + 影響度比率 × 50

    // サーバーダウン: (3/3) * 50 + (2/3) * 50 = 50 + 33.33 = 83.33 → 83 (high/red)
    // ドキュメント遅延: (2/3) * 50 + (2/3) * 50 = 33.33 + 33.33 = 66.67 → 67 (medium/yellow)
    // リソース不足: (1/3) * 50 + (1/3) * 50 = 16.67 + 16.67 = 33.33 → 33 (low/green)

    // issues配列が優先度スコア降順で並んでいることを確認
    expect(result.issues).toBeDefined();
    expect(result.issues.length).toBeGreaterThan(0);

    // 最優先の課題を確認
    const topIssue = result.issues[0];
    expect(topIssue.keyword).toBe('サーバーダウン');
    expect(topIssue.frequency).toBe(3);
    expect(topIssue.impactScore).toBeCloseTo(66.67, 1);
    expect(topIssue.priorityScore).toBeCloseTo(83, 0);
    expect(topIssue.priorityRank).toBe('high');
    expect(topIssue.colorCode).toBe('red');
    expect(topIssue.confidenceScore).toBe(75);
    expect(topIssue.affectedTeamCount).toBe(2);

    // 2番目の課題を確認
    const secondIssue = result.issues[1];
    expect(secondIssue.keyword).toBe('ドキュメント遅延');
    expect(secondIssue.frequency).toBe(2);
    expect(secondIssue.impactScore).toBeCloseTo(66.67, 1);
    expect(secondIssue.priorityScore).toBeCloseTo(67, 0);
    expect(secondIssue.priorityRank).toBe('medium');
    expect(secondIssue.colorCode).toBe('yellow');
    expect(secondIssue.confidenceScore).toBe(82);
    expect(secondIssue.affectedTeamCount).toBe(2);

    // 3番目の課題を確認
    const thirdIssue = result.issues[2];
    expect(thirdIssue.keyword).toBe('リソース不足');
    expect(thirdIssue.frequency).toBe(1);
    expect(thirdIssue.impactScore).toBeCloseTo(33.33, 1);
    expect(thirdIssue.priorityScore).toBeCloseTo(33, 0);
    expect(thirdIssue.priorityRank).toBe('low');
    expect(thirdIssue.colorCode).toBe('green');
    expect(thirdIssue.affectedTeamCount).toBe(1);

    // totalIssueCountは抽出された課題の総数を正確に返す
    expect(result.totalIssueCount).toBe(3);

    // analysisTimestampがテスト実行時刻（±5秒以内）であることを確認
    const timestampDiff = Math.abs(result.analysisTimestamp.getTime() - now.getTime());
    expect(timestampDiff).toBeLessThanOrEqual(5000);

    // lowConfidenceIssueCountは信頼度基準未満（50未満）の課題数を正確にカウント
    // この例では全キーワードが50以上の信頼度なので、lowConfidenceIssueCountは0
    expect(result.lowConfidenceIssueCount).toBe(0);

    // 優先度スコアで降順に並んでいることを確認
    expect(result.issues[0].priorityScore).toBeGreaterThanOrEqual(result.issues[1].priorityScore);
    expect(result.issues[1].priorityScore).toBeGreaterThanOrEqual(result.issues[2].priorityScore);
  });
});