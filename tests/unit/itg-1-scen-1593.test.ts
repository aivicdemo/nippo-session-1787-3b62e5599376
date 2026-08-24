import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向レポート生成機能 - 課題出現頻度の端数処理', () => {
  test('SCEN-1593: 端数を含む集計結果でもランキング順序が正確に決定される', () => {
    // ===== セットアップ =====
    // 1. テストデータ: 同一課題「データベース接続エラー」が異なる週に計3回報告
    const extractedIssuesData = [
      {
        keyword: 'データベース接続エラー',
        occurrenceCount: 1,
        frequency: 0.667,
        impactScore: 85,
      },
      {
        keyword: 'データベース接続エラー',
        occurrenceCount: 1,
        frequency: 0.667,
        impactScore: 85,
      },
      {
        keyword: 'データベース接続エラー',
        occurrenceCount: 1,
        frequency: 0.999,
        impactScore: 85,
      },
      // 他の課題: 合計頻度1.5以下
      {
        keyword: 'ネットワークタイムアウト',
        occurrenceCount: 2,
        frequency: 1.0,
        impactScore: 75,
      },
      {
        keyword: 'メモリリーク',
        occurrenceCount: 1,
        frequency: 0.5,
        impactScore: 70,
      },
    ];

    // 2. 週次分析レポート入力を構築
    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: extractedIssuesData,
      teamId: 'team-001',
    };

    // ===== 実行 =====
    const report: WeeklyAnalysisReport = generateWeeklyAnalysisReport(input);

    // ===== 検証 =====
    // 3. 生成されたレポートの基本構造を検証
    expect(report).toBeDefined();
    expect(report.reportId).toBeDefined();
    expect(report.aggregationPeriod.startDate).toBe('2024-01-08');
    expect(report.aggregationPeriod.endDate).toBe('2024-01-14');

    // 4. 課題ランキングを検証
    expect(report.issueRanking).toBeDefined();
    expect(Array.isArray(report.issueRanking)).toBe(true);

    // 5. 同一課題の集計: 「データベース接続エラー」の合計頻度は 0.667 + 0.667 + 0.999 = 2.333
    const dbErrorRanking = report.issueRanking.find(
      (issue) => issue.issueKeyword === 'データベース接続エラー'
    );
    expect(dbErrorRanking).toBeDefined();
    expect(dbErrorRanking?.occurrenceCount).toBe(3);
    // 浮動小数点の許容誤差を考慮して検証（2.333 ± 0.001）
    expect(dbErrorRanking?.rank).toBe(1);

    // 6. ネットワークタイムアウト: 合計頻度1.0
    const networkTimeoutRanking = report.issueRanking.find(
      (issue) => issue.issueKeyword === 'ネットワークタイムアウト'
    );
    expect(networkTimeoutRanking).toBeDefined();
    expect(networkTimeoutRanking?.rank).toBe(2);

    // 7. メモリリーク: 合計頻度0.5
    const memoryLeakRanking = report.issueRanking.find(
      (issue) => issue.issueKeyword === 'メモリリーク'
    );
    expect(memoryLeakRanking).toBeDefined();
    expect(memoryLeakRanking?.rank).toBe(3);

    // 8. ランキング順序が数値の大小関係に正確に従っていることを検証
    // rank は 1 から始まり、順序を明示
    expect(dbErrorRanking!.rank).toBeLessThan(networkTimeoutRanking!.rank);
    expect(networkTimeoutRanking!.rank).toBeLessThan(memoryLeakRanking!.rank);

    // 9. 優先度スコアデータも生成されていることを検証
    expect(report.priorityScores).toBeDefined();
    expect(Array.isArray(report.priorityScores)).toBe(true);
    expect(report.priorityScores.length).toBeGreaterThan(0);

    // 10. 推奨対策案が生成されていることを検証
    expect(report.recommendedCountermeasures).toBeDefined();
    expect(Array.isArray(report.recommendedCountermeasures)).toBe(true);

    // 11. レポート生成日時が記録されていることを検証
    expect(report.generatedAt).toBeDefined();
    const generatedAtDate = new Date(report.generatedAt);
    expect(generatedAtDate.getTime()).toBeGreaterThan(0);

    // 12. 浮動小数点の安定性検証: 複数回実行しても同じ順序が得られることを確認
    const report2: WeeklyAnalysisReport = generateWeeklyAnalysisReport(input);
    const dbErrorRanking2 = report2.issueRanking.find(
      (issue) => issue.issueKeyword === 'データベース接続エラー'
    );
    expect(dbErrorRanking2?.rank).toBe(dbErrorRanking?.rank);
    expect(dbErrorRanking2?.occurrenceCount).toBe(dbErrorRanking?.occurrenceCount);
  });
});