import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告集約分析機能 - 課題キーワード抽出の再試行失敗', () => {
  test('SCEN-2369: TextAnalysisServiceAdapterの課題キーワード抽出が3回再試行後も失敗したときエラーになる', async () => {
    // スタブの呼び出し回数をトラッキング
    let callCount = 0;
    
    // TextAnalysisServiceAdapterのスタブを定義
    // 3回すべての呼び出しでタイムアウトエラーを発生させる
    const stubTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(async () => {
        callCount++;
        // タイムアウトエラーを発生させる
        throw new Error('Request timeout');
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // テスト用の日報レコード
    const testReportRecords = [
      {
        reportId: 'report-001',
        teamId: 'team-001',
        submittedAt: new Date('2024-01-15T09:30:00Z'),
        yesterdayContent: '昨日は○○を対応。',
        todayContent: '今日は△△を予定。',
        challengesContent: '課題は××の進捗遅延',
      },
    ];

    // extractMonthlyReportDataの入力パラメータ
    const monthlyExtractionRequest = {
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: 'user-123',
      teamIdFilter: ['team-001'],
    };

    // 期待される動作: 3回の再試行がすべて失敗し、エラーがスローされる
    try {
      // extractMonthlyReportDataを呼び出す
      // TextAnalysisServiceAdapterのスタブを依存として渡す
      await extractMonthlyReportData(
        monthlyExtractionRequest,
        testReportRecords,
        stubTextAnalysisServiceAdapter
      );
      
      // エラーがスローされるべきなので、ここに到達してはいけない
      fail('Expected an error to be thrown');
    } catch (error) {
      // エラーが発生することを確認
      expect(error).toBeInstanceOf(Error);
      
      // エラーメッセージが課題キーワード抽出失敗であることを確認
      expect((error as Error).message).toMatch(/課題キーワード抽出/);
      expect((error as Error).message).toMatch(/失敗/);
      
      // extractKeywordsが最大3回呼び出されたことを確認
      expect(callCount).toBe(3);
      
      // スタブが3回呼び出されたことを確認
      expect(stubTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(3);
    }
  });
});