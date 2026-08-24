import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type TextAnalysisServiceAdapter } from '../../src/services/adapters/text-analysis-service-adapter';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2474: [normal] 操作習熟度スコア計算機能 - 計算された習熟度スコアが70点未満のとき、再実習対象判定が返される
  test('習熟度スコアが69点のとき、再実習対象判定が返される', async () => {
    // Arrange: スタブ化したTextAnalysisServiceAdapterを準備
    const stubTextAnalysisAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'bug', frequency: 2 },
          { keyword: 'delay', frequency: 1 }
        ]
      }),
      assessImpactScore: jest.fn().mockResolvedValue(69),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high')
    };

    const submitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed feature development and unit testing',
      todayPlan: 'Code review and integration testing preparation',
      challenges: 'Unexpected API latency issues affecting test results',
      reportDate: '2024-01-15'
    };

    // Act: 習熟度スコア計算メソッドを呼び出す
    const result = await submitDailyReport(
      submitDailyReportInput,
      stubTextAnalysisAdapter
    );

    // Assert: 計算結果の習熟度スコアが69点であることを確認
    expect(result.proficiencyScore).toBe(69);

    // Assert: 計算結果の判定フィールドを検証 - statusフィールドが『再実習対象』と完全に一致
    expect(result.judgmentStatus).toBe('再実習対象');

    // Assert: 戻り値の構造を検証
    expect(result).toHaveProperty('proficiencyScore');
    expect(result).toHaveProperty('judgmentStatus');
    expect(typeof result.proficiencyScore).toBe('number');
    expect(typeof result.judgmentStatus).toBe('string');
  });
});