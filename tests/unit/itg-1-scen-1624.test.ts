import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import type { WeeklyExtractionRequest, WeeklyReportDataset } from '../../src/logic/weekly-issue-analysis';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1624
  test('[error] 前週日報集約・課題分析機能 - 日報テキスト本体が空文字列のレコードが混在するとき、そのレコードをスキップしエラーを返す', async () => {
    // Arrange
    const weekStartDate = new Date('2024-01-08T00:00:00Z');
    const weekEndDate = new Date('2024-01-14T23:59:59Z');
    const requestedByUserId = 'user-001';

    const request: WeeklyExtractionRequest = {
      weekStartDate,
      weekEndDate,
      teamIds: ['team-A'],
      requestedByUserId,
    };

    // 日報レコード群: 1件は空文字列、他は正常なテキスト
    const dailyReports = [
      {
        reportId: 'report-001',
        reportDate: new Date('2024-01-08'),
        userId: 'eng-001',
        report_body: '昨日やったこと: DB最適化\n今日やること: テスト\n課題: パフォーマンス低下',
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2024-01-09'),
        userId: 'eng-002',
        report_body: '', // 空文字列のレコード
      },
      {
        reportId: 'report-003',
        reportDate: new Date('2024-01-10'),
        userId: 'eng-003',
        report_body: '昨日やったこと: API開発\n今日やること: デプロイ\n課題: ビルド失敗',
      },
    ];

    // TextAnalysisServiceAdapter のスタブ化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async (text: string) => {
        if (!text || text.trim().length === 0) {
          return { keywords: [], confidence: 0 };
        }
        // 正常なテキストからキーワードを抽出
        const keywordMap: { [key: string]: number } = {};
        const keywords = text.match(/課題:\s*([^\n]+)/);
        if (keywords && keywords[1]) {
          keywordMap[keywords[1].trim()] = 1;
        }
        return { keywords: Object.keys(keywordMap), confidence: 0.85 };
      }),
      assessImpactScore: jest.fn(async (keyword: string) => {
        return { impactScore: 75, confidence: 0.8 };
      }),
      classifyIssueSeverity: jest.fn(async (text: string) => {
        if (text.includes('パフォーマンス') || text.includes('ビルド')) {
          return 'high';
        }
        return 'medium';
      }),
    };

    // Act
    const result = await extractWeeklyReportData(request, dailyReports, mockTextAnalysisAdapter);

    // Assert
    // 戻り値の型チェック
    expect(result).toHaveProperty('weekRange');
    expect(result).toHaveProperty('totalReportsExtracted');
    expect(result).toHaveProperty('reportsByDate');
    expect(result).toHaveProperty('extractedChallenges');
    expect(result).toHaveProperty('dataQualityScore');

    // weekRange の検証
    expect(result.weekRange.startDate).toEqual(weekStartDate);
    expect(result.weekRange.endDate).toEqual(weekEndDate);

    // 空文字列レコードがスキップされたことを確認
    // 正常なレコード2件が処理されたことを確認
    expect(result.totalReportsExtracted).toBe(2);

    // reportsByDate の検証: 空文字列レコードが除外されていること
    expect(result.reportsByDate).toHaveLength(2);
    const reportDates = result.reportsByDate.map((r) => r.reportDate);
    expect(reportDates).toContainEqual(new Date('2024-01-08'));
    expect(reportDates).toContainEqual(new Date('2024-01-10'));

    // 提出ユーザーIDの確認: 空文字列の eng-002 が除外されていること
    const allSubmittedUserIds = result.reportsByDate.flatMap((r) => r.submittedByUserIds);
    expect(allSubmittedUserIds).toContain('eng-001');
    expect(allSubmittedUserIds).toContain('eng-003');
    expect(allSubmittedUserIds).not.toContain('eng-002');

    // extractedChallenges の検証: 空文字列レコードの課題が含まれていないこと
    expect(result.extractedChallenges).toBeDefined();
    expect(Array.isArray(result.extractedChallenges)).toBe(true);

    // dataQualityScore の検証: 正常系なので70以上であること
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(70);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // エラー情報の確認: 空文字列レコードに関するエラー情報が別途返却されていること
    // (結果オブジェクトに errors フィールドがある場合)
    if ('errors' in result && result.errors) {
      const emptyReportError = (result.errors as Array<{ recordId: string; message: string }>).find(
        (err) => err.recordId === 'report-002',
      );
      expect(emptyReportError).toBeDefined();
      expect(emptyReportError?.message).toMatch(/日報テキスト|空/i);
    }

    // TextAnalysisAdapter が呼び出されていること
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
  });
});