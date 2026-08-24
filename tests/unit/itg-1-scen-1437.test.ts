import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest, type WeeklyReportDataset } from '../../src/logic/weekly-issue-analysis';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1437
  test('前週日報データ集約機能 - 前週7日間の日報が1件のとき、その日報から課題項目のみが正しく抽出される', () => {
    // 前週月曜日の日付を計算
    const weekStartDate = new Date('2024-01-08T00:00:00Z');
    const weekEndDate = new Date('2024-01-14T23:59:59Z');
    const reportDate = new Date('2024-01-08T09:00:00Z');

    // TextAnalysisServiceAdapterのモック
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          { keyword: 'API仕様', frequency: 1 },
          { keyword: '不明点', frequency: 1 }
        ],
        confidenceScore: 0.85
      }),
      assessImpactScore: jest.fn().mockReturnValue({ impactScore: 75 }),
      classifyIssueSeverity: jest.fn().mockReturnValue({ severity: 'medium' })
    };

    // 前週の日報データを模擬
    const mockReportData = [
      {
        reportId: 'report-001',
        reportDate: reportDate,
        userId: 'user-001',
        yesterdayAccomplishment: '会議出席',
        todayPlan: '資料作成',
        challenges: 'API仕様の不明点が3件ある'
      }
    ];

    // 抽出要求の作成
    const extractionRequest: WeeklyExtractionRequest = {
      weekStartDate: weekStartDate,
      weekEndDate: weekEndDate,
      teamIds: ['team-001'],
      requestedByUserId: 'user-manager-001'
    };

    // テスト対象関数を実行
    // 注: 実装時には mockReportData と mockTextAnalysisServiceAdapter を
    // 関数内部で注入または DI で渡す方式に対応
    const result: WeeklyReportDataset = extractWeeklyReportData(
      extractionRequest,
      mockReportData,
      mockTextAnalysisServiceAdapter
    );

    // 期待結果の検証
    expect(result).toBeDefined();
    expect(result.weekRange.startDate).toEqual(weekStartDate);
    expect(result.weekRange.endDate).toEqual(weekEndDate);

    // 日報件数の確認
    expect(result.totalReportsExtracted).toBe(1);

    // 日付ごとの集約データを確認
    expect(result.reportsByDate).toHaveLength(1);
    expect(result.reportsByDate[0].reportDate).toEqual(reportDate);
    expect(result.reportsByDate[0].reportCount).toBe(1);
    expect(result.reportsByDate[0].submittedByUserIds).toContain('user-001');

    // 課題項目のみが抽出されていることを確認
    expect(result.reportsByDate[0].challengeItems).toContain('API仕様の不明点が3件ある');
    // 昨日やったこと・今日やることは含まれていないことを確認
    expect(result.reportsByDate[0].challengeItems).not.toContain('会議出席');
    expect(result.reportsByDate[0].challengeItems).not.toContain('資料作成');

    // 抽出された正規化済み課題リストを確認
    expect(result.extractedChallenges).toBeDefined();
    expect(result.extractedChallenges.length).toBeGreaterThan(0);

    // 抽出された課題キーワードの確認
    const extractedKeywords = result.extractedChallenges.map((c) => c.keyword);
    expect(extractedKeywords).toContain('API仕様');
    expect(extractedKeywords).toContain('不明点');

    // 出現頻度情報の確認
    const apiSpecChallenge = result.extractedChallenges.find((c) => c.keyword === 'API仕様');
    expect(apiSpecChallenge).toBeDefined();
    expect(apiSpecChallenge?.frequency).toBe(1);

    const unclearPointChallenge = result.extractedChallenges.find((c) => c.keyword === '不明点');
    expect(unclearPointChallenge).toBeDefined();
    expect(unclearPointChallenge?.frequency).toBe(1);

    // データ品質スコアの確認（0～100の範囲内）
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // TextAnalysisServiceAdapterが呼び出されたことを確認
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(
      'API仕様の不明点が3件ある'
    );
  });
});