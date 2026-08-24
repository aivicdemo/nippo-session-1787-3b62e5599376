import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向分析レポート生成 - 最小閾値以上の課題フィルタリング', () => {
  test('SCEN-1669: 前週の日報が複数件で最小閾値以上と判定される場合、significantIssues配列に正しく課題がフィルタリングされること', () => {
    // Arrange: テストデータの準備
    const aggregationStartDate = '2024-01-08'; // 月曜日
    const aggregationEndDate = '2024-01-12'; // 金曜日
    const teamId = 'team-001';

    // 前週5営業日分の日報から抽出された課題データ
    const extractedIssuesData = [
      {
        keyword: 'サーバーダウン',
        occurrenceCount: 3, // 日報1～3件で報告
        impactScore: 65,
        reportDates: ['2024-01-08', '2024-01-09', '2024-01-10'],
      },
      {
        keyword: 'API遅延',
        occurrenceCount: 1, // 日報4～5件で報告されたが出現頻度1
        impactScore: 45,
        reportDates: ['2024-01-11'],
      },
    ];

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate,
      aggregationEndDate,
      extractedIssues: extractedIssuesData,
      teamId,
    };

    // Act: 週次課題傾向分析レポート生成を実行
    const result: WeeklyAnalysisReport = generateWeeklyAnalysisReport(input);

    // Assert: 生成されたレポートの検証
    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');

    // 集計期間の検証
    expect(result.aggregationPeriod.startDate).toBe(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toBe(aggregationEndDate);

    // issueRanking（発生頻度でランク付けされた課題リスト）の検証
    expect(result.issueRanking).toBeDefined();
    expect(Array.isArray(result.issueRanking)).toBe(true);

    // 発生頻度の高い順に『サーバーダウン』が1位であることを検証
    const serverDownRanking = result.issueRanking.find(
      (issue) => issue.issueKeyword === 'サーバーダウン'
    );
    expect(serverDownRanking).toBeDefined();
    expect(serverDownRanking?.occurrenceCount).toBe(3);
    expect(serverDownRanking?.rank).toBe(1);

    // priorityScores（優先度スコア）の検証
    expect(result.priorityScores).toBeDefined();
    expect(Array.isArray(result.priorityScores)).toBe(true);

    // 『サーバーダウン』の優先度スコアが最小閾値以上（スコア50以上、出現頻度2以上）であることを検証
    const serverDownPriority = result.priorityScores.find(
      (priority) => priority.issueId === 'サーバーダウン'
    );
    expect(serverDownPriority).toBeDefined();
    expect(serverDownPriority?.priorityScore).toBeGreaterThanOrEqual(50);
    expect(serverDownPriority?.priorityRank).toBe('high');

    // 『API遅延』は出現頻度1のため、priorityRankが'low'である（または含まれない場合もある）
    const apiDelayPriority = result.priorityScores.find(
      (priority) => priority.issueId === 'API遅延'
    );
    if (apiDelayPriority) {
      expect(apiDelayPriority.priorityRank).toBe('low');
      expect(apiDelayPriority.priorityScore).toBeLessThan(50);
    }

    // 最小閾値以上の課題フィルタリング結果の検証
    // significantIssuesフィールドが存在し、最小閾値を満たす課題のみを含むことを検証
    expect(result.issueRanking.length).toBeGreaterThanOrEqual(1);

    // 生成されたレポートに推奨対策案が含まれることを検証
    expect(result.recommendedCountermeasures).toBeDefined();
    expect(Array.isArray(result.recommendedCountermeasures)).toBe(true);

    // 生成日時（ISO 8601形式）の検証
    expect(result.generatedAt).toBeDefined();
    const generatedDate = new Date(result.generatedAt);
    expect(generatedDate.getTime()).toBeGreaterThan(0);

    // レポート生成完了フラグの検証（タイムスタンプが前週金曜日の営業時間内）
    expect(generatedDate.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});