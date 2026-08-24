import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';
import { type MonthlyExtractionRequest } from '../../src/logic/monthly-performance-analysis';

describe('月次レポート生成 - データ抽出処理', () => {
  // SCEN-1764
  test('抽出対象月が指定されていない場合、エラーが発生して処理が中断される', () => {
    const testCases = [
      {
        description: '抽出対象月が空文字列の場合',
        request: {
          targetYear: 2024,
          targetMonth: NaN,
          requestedByUserId: 'user-001',
          teamIdFilter: undefined,
        } as unknown as MonthlyExtractionRequest,
      },
      {
        description: '抽出対象月がnullの場合',
        request: {
          targetYear: 2024,
          targetMonth: null as unknown as number,
          requestedByUserId: 'user-001',
          teamIdFilter: undefined,
        } as unknown as MonthlyExtractionRequest,
      },
      {
        description: '抽出対象月がundefinedの場合',
        request: {
          targetYear: 2024,
          targetMonth: undefined as unknown as number,
          requestedByUserId: 'user-001',
          teamIdFilter: undefined,
        } as unknown as MonthlyExtractionRequest,
      },
    ];

    testCases.forEach(({ description, request }) => {
      expect(() => extractMonthlyReportData(request)).toThrow(/抽出対象月/);
    });
  });
});