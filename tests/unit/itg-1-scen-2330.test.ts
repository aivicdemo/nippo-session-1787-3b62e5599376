import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('月次課題解決速度分析 - チームID無効時のエラーハンドリング', () => {
  test('SCEN-2330: 分析対象チームIDがnullのとき処理を中止しエラーを返す', () => {
    // Arrange: TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // 入力データ: チームIDにnullを指定
    const inputWithNullTeamId = {
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: 'user-001',
      teamIdFilter: [null as unknown as string],
    };

    // Act & Assert: extractMonthlyReportDataを呼び出し、エラーが返される
    const result = extractMonthlyReportData(inputWithNullTeamId, mockTextAnalysisAdapter);

    // (2) エラーコードが『INVALID_TEAM_ID』またはそれに相当するエラーステータスを含む
    expect(result).toHaveProperty('errorCode');
    expect(result.errorCode).toMatch(/INVALID_TEAM_ID|invalid_team_id|team_id/i);

    // (3) エラーメッセージに『分析対象チームIDが指定されていません』または同等の具体的メッセージが含まれる
    expect(result).toHaveProperty('errorMessage');
    expect(result.errorMessage).toMatch(/チームID|team.?id|分析対象/i);

    // (1) TextAnalysisServiceAdapterのメソッドが呼ばれていない
    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).not.toHaveBeenCalled();

    // (4) エラーオブジェクトが返され、successフラグがfalseである
    expect(result.success).toBe(false);

    // (4) 内部ログに『team_id=null』の状態で処理が中止されたことが記録される状態を確認
    expect(result).toHaveProperty('debugInfo');
    if (result.debugInfo) {
      expect(result.debugInfo).toMatch(/team_id|null|stopped|中止/i);
    }
  });
});