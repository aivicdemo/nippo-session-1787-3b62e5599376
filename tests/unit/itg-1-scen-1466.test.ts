import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest, type WeeklyReportDataset, type DailyReportSummary } from '../../src/logic/weekly-issue-analysis';

describe('前週日報データ集約・課題抽出機能', () => {
  // SCEN-1466
  test('チームメンバー10名がちょうど10名である場合、全員分の日報が集約される', async () => {
    // Arrange: テスト用のスタブ化されたTextAnalysisServiceAdapter
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'ネットワーク遅延', frequency: 3 },
          { keyword: 'データベース接続エラー', frequency: 2 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    // テスト用メンバー10名のユーザーID
    const memberUserIds = [
      'user-001',
      'user-002',
      'user-003',
      'user-004',
      'user-005',
      'user-006',
      'user-007',
      'user-008',
      'user-009',
      'user-010',
    ];

    // 前週月曜日から日曜日の期間を設定
    const weekStartDate = new Date('2024-01-08T00:00:00Z');
    const weekEndDate = new Date('2024-01-14T23:59:59Z');

    // 前週の日報データを事前に作成
    const mockDailyReports = memberUserIds.map((userId, index) => ({
      reportDate: new Date(`2024-01-${9 + (index % 6)}T09:00:00Z`),
      userId: userId,
      yesterdayAccomplishments: `昨日は機能${index + 1}の開発を実施しました`,
      todayPlans: `本日は機能${index + 1}のテストを実施予定です`,
      challengeItems: `ネットワーク遅延が発生しており、API呼び出しが遅くなっています。データベース接続エラーも散発しています。`,
    }));

    // リクエストオブジェクトを作成
    const request: WeeklyExtractionRequest = {
      weekStartDate: weekStartDate,
      weekEndDate: weekEndDate,
      teamIds: undefined,
      requestedByUserId: 'user-admin-001',
    };

    // Act: extractWeeklyReportDataを実行
    // 注：実装内でTextAnalysisServiceAdapterが使用される場合、ここでスタブを渡す必要がある
    // 関数シグネチャに適応させて呼び出し
    const result: WeeklyReportDataset = await extractWeeklyReportData(
      request,
      mockDailyReports,
      mockTextAnalysisServiceAdapter,
    );

    // Assert: 集約結果を検証
    // (1) 集約対象期間が正しく設定されている
    expect(result.weekRange.startDate).toEqual(weekStartDate);
    expect(result.weekRange.endDate).toEqual(weekEndDate);

    // (2) 抽出された日報の総件数が10件である
    expect(result.totalReportsExtracted).toBe(10);

    // (3) reportsByDateに10名分のレコードが含まれている
    expect(result.reportsByDate.length).toBeGreaterThanOrEqual(1);

    // (4) 全メンバーの提出が確認される
    const submittedUserIds = new Set<string>();
    result.reportsByDate.forEach((dailySummary: DailyReportSummary) => {
      dailySummary.submittedByUserIds.forEach((uid: string) => {
        submittedUserIds.add(uid);
      });
    });
    expect(submittedUserIds.size).toBe(10);
    memberUserIds.forEach((memberId) => {
      expect(submittedUserIds.has(memberId)).toBe(true);
    });

    // (5) 課題キーワードが抽出されている
    expect(result.extractedChallenges).toBeDefined();
    expect(result.extractedChallenges.length).toBeGreaterThan(0);

    // (6) 抽出された課題に優先度スコアと重要度分類が付与されている
    result.extractedChallenges.forEach((challenge) => {
      expect(challenge.priorityScore).toBeDefined();
      expect(challenge.priorityScore).toBeGreaterThanOrEqual(0);
      expect(challenge.priorityScore).toBeLessThanOrEqual(100);
      expect(['high', 'medium', 'low']).toContain(challenge.severity);
    });

    // (7) 集約データの品質スコアが算出されている
    expect(result.dataQualityScore).toBeDefined();
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // (8) TextAnalysisServiceAdapterが期待通りに呼び出されている
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalled();

    // (9) 各日報の課題項目が自由記述テキストとして集約されている
    result.reportsByDate.forEach((dailySummary: DailyReportSummary) => {
      expect(Array.isArray(dailySummary.challengeItems)).toBe(true);
      expect(dailySummary.challengeItems.length).toBeGreaterThanOrEqual(0);
    });

    // (10) 10名全員の提出状況が記録されている
    const totalReportCount = result.reportsByDate.reduce(
      (sum, daily) => sum + daily.reportCount,
      0,
    );
    expect(totalReportCount).toBe(10);
  });
});