import { describe, test, expect } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('月次報告データ抽出機能', () => {
  test('SCEN-2361: 開始日が空文字列のときエラーをスローする', () => {
    const invalidInput = {
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: 'user-001',
      extractionStartDate: '',
      extractionEndDate: '2024-01-31T23:59:59Z',
    };

    expect(() => extractMonthlyReportData(invalidInput)).toThrow(/開始日/);
  });
});