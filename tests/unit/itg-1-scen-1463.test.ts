import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';

describe('前週日報データ集約・課題抽出機能', () => {
  test('SCEN-1463: 前週月曜日から日曜日までの7日間の期間境界でちょうど7日分の日報が集約される', () => {
    // 対象期間: 2026年1月5日（月）～ 2026年1月11日（日）
    const weekStartDate = new Date('2026-01-05T00:00:00Z');
    const weekEndDate = new Date('2026-01-11T23:59:59Z');
    const teamIds = ['team-001'];
    const requestedByUserId = 'user-manager-001';

    // テスト用の日報データを準備（月曜～日曜、各日1件ずつ7日間分）
    const mockReportDataset = {
      weekRange: {
        startDate: weekStartDate,
        endDate: weekEndDate,
      },
      totalReportsExtracted: 7,
      reportsByDate: [
        {
          reportDate: new Date('2026-01-05T00:00:00Z'),
          reportCount: 1,
          submittedByUserIds: ['user-engineer-001'],
          challengeItems: ['API設計の課題'],
        },
        {
          reportDate: new Date('2026-01-06T00:00:00Z'),
          reportCount: 1,
          submittedByUserIds: ['user-engineer-002'],
          challengeItems: ['データベース接続タイムアウト'],
        },
        {
          reportDate: new Date('2026-01-07T00:00:00Z'),
          reportCount: 1,
          submittedByUserIds: ['user-engineer-003'],
          challengeItems: ['テストケース不足'],
        },
        {
          reportDate: new Date('2026-01-08T00:00:00Z'),
          reportCount: 1,
          submittedByUserIds: ['user-engineer-004'],
          challengeItems: ['ドキュメント更新遅延'],
        },
        {
          reportDate: new Date('2026-01-09T00:00:00Z'),
          reportCount: 1,
          submittedByUserIds: ['user-engineer-005'],
          challengeItems: ['レビュー指摘対応'],
        },
        {
          reportDate: new Date('2026-01-10T00:00:00Z'),
          reportCount: 1,
          submittedByUserIds: ['user-engineer-006'],
          challengeItems: ['環境構築の問題'],
        },
        {
          reportDate: new Date('2026-01-11T00:00:00Z'),
          reportCount: 1,
          submittedByUserIds: ['user-engineer-007'],
          challengeItems: ['依存関係の競合'],
        },
      ],
      extractedChallenges: [
        {
          keyword: 'API設計',
          occurrenceCount: 1,
          impactScore: 75,
        },
        {
          keyword: 'データベース接続',
          occurrenceCount: 1,
          impactScore: 85,
        },
        {
          keyword: 'テストケース',
          occurrenceCount: 1,
          impactScore: 70,
        },
        {
          keyword: 'ドキュメント',
          occurrenceCount: 1,
          impactScore: 60,
        },
        {
          keyword: 'レビュー',
          occurrenceCount: 1,
          impactScore: 65,
        },
        {
          keyword: '環境構築',
          occurrenceCount: 1,
          impactScore: 80,
        },
        {
          keyword: '依存関係',
          occurrenceCount: 1,
          impactScore: 72,
        },
      ],
      dataQualityScore: 95,
    };

    const request = {
      weekStartDate: weekStartDate,
      weekEndDate: weekEndDate,
      teamIds: teamIds,
      requestedByUserId: requestedByUserId,
    };

    const result = extractWeeklyReportData(request);

    // 期待結果の検証
    // 1. 集約されたレコード件数が正確に7件であることを検証
    expect(result.totalReportsExtracted).toBe(7);

    // 2. reportsByDate 配列の長さが7であることを検証
    expect(result.reportsByDate).toHaveLength(7);

    // 3. 集約データの日付範囲が月曜日から日曜日（両端を含む）であることを検証
    expect(result.weekRange.startDate).toEqual(weekStartDate);
    expect(result.weekRange.endDate).toEqual(weekEndDate);

    // 4. 各日報の日付が集約期間内に収まっていることを検証
    result.reportsByDate.forEach((dailySummary) => {
      const reportDate = dailySummary.reportDate.getTime();
      const startTime = weekStartDate.getTime();
      const endTime = weekEndDate.getTime();

      expect(reportDate).toBeGreaterThanOrEqual(startTime);
      expect(reportDate).toBeLessThanOrEqual(endTime);
    });

    // 5. 各日に1件ずつの日報があることを検証（重複なし）
    result.reportsByDate.forEach((dailySummary) => {
      expect(dailySummary.reportCount).toBe(1);
    });

    // 6. 日付が昇順で並んでいることを検証（重複・漏れを防ぐため）
    for (let i = 1; i < result.reportsByDate.length; i++) {
      const prevDate = result.reportsByDate[i - 1].reportDate.getTime();
      const currDate = result.reportsByDate[i].reportDate.getTime();
      expect(currDate).toBeGreaterThan(prevDate);
    }

    // 7. すべての日報が課題項目を含んでいることを検証
    result.reportsByDate.forEach((dailySummary) => {
      expect(dailySummary.challengeItems).toBeDefined();
      expect(Array.isArray(dailySummary.challengeItems)).toBe(true);
      expect(dailySummary.challengeItems.length).toBeGreaterThan(0);
    });

    // 8. 抽出された課題キーワードが7件あることを検証
    expect(result.extractedChallenges).toHaveLength(7);

    // 9. 重複排除が正しく行われていることを検証（すべてのキーワードが異なることを確認）
    const keywordSet = new Set(
      result.extractedChallenges.map((challenge) => challenge.keyword)
    );
    expect(keywordSet.size).toBe(7);

    // 10. データ品質スコアが基準内であることを検証
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(90);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
  });
});