import { analyzeIssuePatternsByTimeRange } from '../../src/logic/issue-pattern-analysis';

describe('Issue Pattern Analysis - Bottleneck Visualization', () => {
  // SCEN-489: [normal] 指定された日付範囲内の過去課題データから再発パターンを時系列で分析し、ボトルネック変化を可視化レポートとして出力する
  test('should analyze issue patterns and generate bottleneck visualization report with correct priority scores', () => {
    const issueDataList = [
      {
        issueId: 'ISS001',
        issueTitle: '承認フロー遅延',
        reportDate: '2024-01-15',
        frequency: 12,
        impactScore: 85,
        resolutionDays: 3,
      },
      {
        issueId: 'ISS002',
        issueTitle: 'DB接続エラー',
        reportDate: '2024-01-18',
        frequency: 8,
        impactScore: 90,
        resolutionDays: 5,
      },
      {
        issueId: 'ISS003',
        issueTitle: 'UI表示崩れ',
        reportDate: '2024-01-20',
        frequency: 5,
        impactScore: 40,
        resolutionDays: 1,
      },
      {
        issueId: 'ISS004',
        issueTitle: 'レポート出力遅延',
        reportDate: '2024-01-22',
        frequency: 10,
        impactScore: 75,
        resolutionDays: 2,
      },
      {
        issueId: 'ISS005',
        issueTitle: 'メモリリーク',
        reportDate: '2024-01-25',
        frequency: 3,
        impactScore: 95,
        resolutionDays: 7,
      },
    ];

    const reportPeriod = '過去30日';
    const teamSize = 10;

    const result = analyzeIssuePatternsByTimeRange(issueDataList, reportPeriod, teamSize);

    // 期待されるスコア計算（priorityScore = frequency × 0.6 + impactScore × 0.4）
    const iss001Score = 12 * 0.6 + 85 * 0.4; // 7.2 + 34 = 41.2
    const iss002Score = 8 * 0.6 + 90 * 0.4; // 4.8 + 36 = 40.8
    const iss005Score = 3 * 0.6 + 95 * 0.4; // 1.8 + 38 = 39.8
    const iss004Score = 10 * 0.6 + 75 * 0.4; // 6 + 30 = 36
    const iss003Score = 5 * 0.6 + 40 * 0.4; // 3 + 16 = 19

    // 必須フィールドの存在確認
    expect(result).toHaveProperty('recommendedChartType');
    expect(result).toHaveProperty('topBottlenecks');
    expect(result).toHaveProperty('trendAnalysis');
    expect(result).toHaveProperty('reportUrl');

    // recommendedChartType の有効性確認
    expect(['折れ線グラフ', '棒グラフ', 'ヒートマップ']).toContain(result.recommendedChartType);

    // topBottlenecks が配列で、5要素を含むことを確認
    expect(Array.isArray(result.topBottlenecks)).toBe(true);
    expect(result.topBottlenecks.length).toBe(5);

    // topBottlenecks が優先度スコア降順で並んでいることを確認
    expect(result.topBottlenecks[0].rank).toBe(1);
    expect(result.topBottlenecks[0].issueTitle).toBe('承認フロー遅延');
    expect(result.topBottlenecks[0].frequency).toBe(12);
    expect(result.topBottlenecks[0].impactScore).toBe(85);
    expect(result.topBottlenecks[0]).toHaveProperty('trend');

    expect(result.topBottlenecks[1].rank).toBe(2);
    expect(result.topBottlenecks[1].issueTitle).toBe('DB接続エラー');
    expect(result.topBottlenecks[1].frequency).toBe(8);
    expect(result.topBottlenecks[1].impactScore).toBe(90);

    expect(result.topBottlenecks[2].rank).toBe(3);
    expect(result.topBottlenecks[2].issueTitle).toBe('メモリリーク');
    expect(result.topBottlenecks[2].frequency).toBe(3);
    expect(result.topBottlenecks[2].impactScore).toBe(95);

    expect(result.topBottlenecks[3].rank).toBe(4);
    expect(result.topBottlenecks[3].issueTitle).toBe('レポート出力遅延');
    expect(result.topBottlenecks[3].frequency).toBe(10);
    expect(result.topBottlenecks[3].impactScore).toBe(75);

    expect(result.topBottlenecks[4].rank).toBe(5);
    expect(result.topBottlenecks[4].issueTitle).toBe('UI表示崩れ');
    expect(result.topBottlenecks[4].frequency).toBe(5);
    expect(result.topBottlenecks[4].impactScore).toBe(40);

    // trendAnalysis の有効性確認
    // resolutionDays の推移（3→5→1→2→7）から悪化傾向と判定
    expect(['改善傾向', '悪化傾向', '横ばい']).toContain(result.trendAnalysis);

    // reportUrl が有効な文字列であることを確認
    expect(typeof result.reportUrl).toBe('string');
    expect(result.reportUrl.length).toBeGreaterThan(0);

    // 優先度スコアの計算値が正しいことを検証
    const priorityScores = result.topBottlenecks.map((item: any) => item.frequency * 0.6 + item.impactScore * 0.4);
    for (let i = 0; i < priorityScores.length - 1; i++) {
      expect(priorityScores[i]).toBeGreaterThanOrEqual(priorityScores[i + 1]);
    }
  });
});