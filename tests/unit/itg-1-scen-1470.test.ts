import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';

describe('weekly-issue-analysis: extractWeeklyReportData', () => {
  // SCEN-1470: [edge] 前週日報データ集約・課題抽出機能 - 3つの項目（昨日やったこと・今日やること・抱えている課題）の順序が逆順で入力された場合でも、課題項目のみが正しく抽出される
  test('should extract only challengeItems field regardless of input order', () => {
    const mockTextAnalysisClient = {
      extractKeywords: jest.fn((text: string) => {
        if (text === 'データベース接続タイムアウト') {
          return Promise.resolve([
            { keyword: 'データベース接続タイムアウト', frequency: 1 }
          ]);
        }
        return Promise.resolve([]);
      }),
      assessImpactScore: jest.fn((keyword: string) => Promise.resolve(75)),
      classifyIssueSeverity: jest.fn((text: string) => Promise.resolve('high'))
    };

    const weeklyReportInput = {
      weekStartDate: new Date('2024-01-08'),
      weekEndDate: new Date('2024-01-14'),
      teamIds: ['team-001'],
      requestedByUserId: 'user-001'
    };

    const dailyReports = [
      {
        reportDate: new Date('2024-01-08'),
        reportCount: 1,
        submittedByUserIds: ['eng-001'],
        challengeItems: ['データベース接続タイムアウト'],
        yesterdayAccomplishments: ['デバッグ作業完了'],
        todayPlans: ['レポート作成・品質確認']
      }
    ];

    const result = extractWeeklyReportData(
      weeklyReportInput,
      dailyReports,
      mockTextAnalysisClient
    );

    expect(result.totalReportsExtracted).toBe(1);
    expect(result.reportsByDate).toHaveLength(1);
    expect(result.reportsByDate[0].reportDate).toEqual(new Date('2024-01-08'));
    expect(result.reportsByDate[0].reportCount).toBe(1);
    expect(result.reportsByDate[0].submittedByUserIds).toEqual(['eng-001']);
    expect(result.reportsByDate[0].challengeItems).toEqual(['データベース接続タイムアウト']);
    expect(result.reportsByDate[0].challengeItems).not.toContain('デバッグ作業完了');
    expect(result.reportsByDate[0].challengeItems).not.toContain('レポート作成・品質確認');

    expect(mockTextAnalysisClient.extractKeywords).toHaveBeenCalledWith('データベース接続タイムアウト');
    expect(mockTextAnalysisClient.extractKeywords).toHaveBeenCalledTimes(1);

    expect(result.extractedChallenges).toHaveLength(1);
    expect(result.extractedChallenges[0]).toEqual(expect.objectContaining({
      keyword: 'データベース接続タイムアウト'
    }));

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
  });
});