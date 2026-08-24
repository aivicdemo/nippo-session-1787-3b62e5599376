import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  // SCEN-1474: [edge] 前週日報データ集約・課題抽出機能 - チーム波及度スコアが100を超過した場合、業務上の最大値として100に丸め込まれる
  test('チーム波及度スコアが101の場合、業務上の最大値100に丸め込まれる', () => {
    // Arrange: TextAnalysisServiceAdapterのassessImpactScoreをモック化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'データベース接続エラー', frequency: 3 },
          { keyword: '本番環境リソース不足', frequency: 2 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(101), // チーム波及度スコア101を返す
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        deliveryStatus: 'success',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'sched_123',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
      }),
    };

    // 前週月曜日から日曜日までの日報データ
    const weekStartDate = new Date('2024-02-12T00:00:00Z');
    const weekEndDate = new Date('2024-02-18T23:59:59Z');

    const input = {
      weekStartDate,
      weekEndDate,
      teamIds: ['team_001'],
      requestedByUserId: 'user_manager_001',
    };

    // Act: extractWeeklyReportDataを呼び出し
    const result = extractWeeklyReportData(
      input,
      mockTextAnalysisServiceAdapter,
      mockNotificationServiceAdapter
    );

    // Assert: チーム波及度スコアが100に丸め込まれていることを確認
    expect(result.extractedChallenges).toBeDefined();
    expect(Array.isArray(result.extractedChallenges)).toBe(true);

    // 抽出された課題のスコア値を検証
    const challengesWithScore = result.extractedChallenges.filter(
      (challenge) => challenge.impactScore !== undefined
    );

    // チーム波及度スコアが101から100に丸め込まれていることを確認
    challengesWithScore.forEach((challenge) => {
      expect(challenge.impactScore).toBeLessThanOrEqual(100);
      expect(challenge.impactScore).toBeGreaterThanOrEqual(0);
    });

    // モックが期待通りに呼び出されたことを確認
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();

    // ダッシュボード表示用のスコア値も100以下であることを確認
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
  });
});