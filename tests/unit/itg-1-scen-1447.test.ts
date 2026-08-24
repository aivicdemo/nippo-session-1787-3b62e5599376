import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest, type WeeklyReportDataset } from '../../src/logic/weekly-issue-analysis';

describe('課題の影響度判定と優先度スコア記録', () => {
  // SCEN-1447: [normal] 前週日報データ集約機能 - TextAnalysisServiceAdapter が正常応答したとき、算出された影響度スコアが内部保持テーブル（課題優先度スコア）に記録される
  test('should record impact scores from TextAnalysisServiceAdapter to issue priority score table when extracting weekly report data', async () => {
    // Arrange: TextAnalysisServiceAdapter のスタブを準備
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'サーバーダウン', frequency: 3 },
          { keyword: '対応遅延', frequency: 2 },
        ],
      }),
      assessImpactScore: jest
        .fn()
        .mockImplementation((keyword: string) => {
          const scoreMap: Record<string, number> = {
            サーバーダウン: 85,
            対応遅延: 62,
          };
          return Promise.resolve({
            keyword,
            impactScore: scoreMap[keyword] || 50,
            status: 200,
          });
        }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    // 前週の日報データを準備
    const weekStartDate = new Date('2024-01-08T00:00:00Z');
    const weekEndDate = new Date('2024-01-14T23:59:59Z');

    const extractionRequest: WeeklyExtractionRequest = {
      weekStartDate,
      weekEndDate,
      teamIds: ['team-001'],
      requestedByUserId: 'user-manager-001',
    };

    // 集約済み日報データサンプル
    const sampleDailyReports = [
      {
        reportDate: new Date('2024-01-08T09:00:00Z'),
        reportCount: 3,
        submittedByUserIds: ['user-eng-001', 'user-eng-002', 'user-eng-003'],
        challengeItems: [
          'サーバーダウンが発生して対応に3時間要した',
          'サーバーダウンの根本原因が未判明',
        ],
      },
      {
        reportDate: new Date('2024-01-09T09:00:00Z'),
        reportCount: 2,
        submittedByUserIds: ['user-eng-001', 'user-eng-002'],
        challengeItems: [
          'サーバー復旧作業中。対応遅延が生じている',
          'ネットワーク設定の確認に時間がかかっている',
        ],
      },
      {
        reportDate: new Date('2024-01-10T09:00:00Z'),
        reportCount: 1,
        submittedByUserIds: ['user-eng-003'],
        challengeItems: ['サーバーダウンはまだ完全復旧していない'],
      },
    ];

    // Act: extractWeeklyReportData を実行
    const result: WeeklyReportDataset = await extractWeeklyReportData(
      extractionRequest,
      mockTextAnalysisService
    );

    // Assert: TextAnalysisServiceAdapter.assessImpactScore が呼ばれたことを確認
    expect(mockTextAnalysisService.assessImpactScore).toHaveBeenCalled();

    // 課題優先度スコアテーブルにスコアが記録されていることを確認
    const priorityScores = result.extractedChallenges.map((challenge) => ({
      keyword: challenge.keyword,
      priorityScore: challenge.priorityScore,
    }));

    // サーバーダウンのスコアが85で記録されていることを確認
    const serverDownownScore = priorityScores.find(
      (item) => item.keyword === 'サーバーダウン'
    );
    expect(serverDownownScore).toBeDefined();
    expect(serverDownownScore?.priorityScore).toBe(85);
    expect(typeof serverDownownScore?.priorityScore).toBe('number');
    expect(serverDownownScore?.priorityScore).toBeGreaterThanOrEqual(0);
    expect(serverDownownScore?.priorityScore).toBeLessThanOrEqual(100);

    // 対応遅延のスコアが62で記録されていることを確認
    const delayScore = priorityScores.find(
      (item) => item.keyword === '対応遅延'
    );
    expect(delayScore).toBeDefined();
    expect(delayScore?.priorityScore).toBe(62);
    expect(typeof delayScore?.priorityScore).toBe('number');
    expect(delayScore?.priorityScore).toBeGreaterThanOrEqual(0);
    expect(delayScore?.priorityScore).toBeLessThanOrEqual(100);

    // 集約対象週の開始日と終了日が正しく記録されていることを確認
    expect(result.weekRange.startDate).toEqual(weekStartDate);
    expect(result.weekRange.endDate).toEqual(weekEndDate);

    // 抽出された日報の総件数が正しいことを確認
    expect(result.totalReportsExtracted).toBe(6);

    // 日付ごとの日報サマリーが記録されていることを確認
    expect(result.reportsByDate).toBeDefined();
    expect(result.reportsByDate.length).toBeGreaterThan(0);

    // データ品質スコアが0～100の範囲にあることを確認
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
  });
});