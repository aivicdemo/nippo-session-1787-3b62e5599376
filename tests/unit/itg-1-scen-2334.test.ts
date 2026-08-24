import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';
import type { MonthlyReportDataset, ExtractionValidationResult } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次分析機能', () => {
  // SCEN-2334
  test('対応完了率が0～100の範囲外の値のとき処理を中止しエラーを返す', () => {
    // テスト用パラメータ
    const targetYear = 2024;
    const targetMonth = 1;
    const requestedByUserId = 'user-001';
    const invalidCompletionRate = -5;

    // extractMonthlyReportData を呼び出し、無効な対応完了率が入力される状況を再現
    const result = extractMonthlyReportData({
      targetYear,
      targetMonth,
      requestedByUserId,
      completionRate: invalidCompletionRate,
    });

    // 処理が中止され、エラーが返されることを確認
    expect(result).toEqual({
      isValid: false,
      errorCode: 'COMPLETION_RATE_OUT_OF_RANGE',
      errorMessage: '対応完了率は0から100の範囲で指定してください',
      datasetSaved: false,
    });

    // 対応完了率が0未満であることを検証
    expect(invalidCompletionRate).toBeLessThan(0);
    expect(invalidCompletionRate).not.toBeGreaterThanOrEqual(0);
    expect(invalidCompletionRate).not.toBeLessThanOrEqual(100);
  });
});