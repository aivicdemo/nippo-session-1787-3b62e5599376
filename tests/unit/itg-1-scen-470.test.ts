import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';

describe('月次分析レポート生成', () => {
  // SCEN-470
  test('再試行回数が負の数の場合、エラーをスロー', () => {
    const retryCount = -1;
    const targetMonth = '2024-01';
    const projectManagerId = 'pm-001';

    expect(() =>
      generateMonthlyAnalysisReport({
        targetMonth,
        projectManagerId,
        retryCount,
      })
    ).toThrow(/再試行回数/);
  });
});