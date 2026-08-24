import { describe, test, expect } from '@jest/globals';
import { fetchYesterdayReport } from '../../src/logic/report-submission';
import type { DailyReport } from '../../src/logic/report-submission';

describe('fetchYesterdayReport', () => {
  test('SCEN-2678: 前日報告内容の取得・表示機能 - 取得した報告内容に「抱えている課題」フィールドが含まれている', async () => {
    const engineerId = 'taro-tanaka';
    const targetDate = new Date('2026-08-18');
    const requestingUserId = 'taro-tanaka';

    const result = await fetchYesterdayReport({
      engineerId,
      targetDate,
      requestingUserId,
    });

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(result.engineerId).toBe('taro-tanaka');
    expect(result.reportDate).toEqual(new Date('2026-08-18'));
    expect(result.yesterdayAccomplishment).toBe('顧客A向けドキュメント作成');
    expect(result.todayPlan).toBe('コードレビュー実施');
    expect(result.challenges).toBe('本番環境でのメモリリーク問題が発生、影響範囲調査中');
    expect(result.submittedAt).toBeDefined();

    // 3つのフィールドすべてが報告内容として正確に取得されていることを検証
    const fieldNames = Object.keys(result);
    expect(fieldNames).toContain('yesterdayAccomplishment');
    expect(fieldNames).toContain('todayPlan');
    expect(fieldNames).toContain('challenges');
  });
});