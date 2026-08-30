import { submitReport } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム', () => {
  // SCEN-295: [normal] エンジニアが日報を送信し、入力検証、送信時刻記録、期限判定、提出状況更新を実行する
  test('validateDailyReportFormが設計された計算式の代表値を返す', () => {
    // 入力1: 下限値（1文字）
    const minInput = {
      yesterdayWork: 'A',
      todayWork: 'B',
      currentIssue: 'C',
    };
    const minResult = submitReport(minInput);
    expect(minResult.isValid).toBe(true);
    expect(minResult.errors).toEqual([]);

    // 入力2: 上限値（500文字）
    const maxText = 'X'.repeat(500);
    const maxInput = {
      yesterdayWork: maxText,
      todayWork: maxText,
      currentIssue: maxText,
    };
    const maxResult = submitReport(maxInput);
    expect(maxResult.isValid).toBe(true);
    expect(maxResult.errors).toEqual([]);

    // 入力3: 中間値（250文字）
    const midText = 'M'.repeat(250);
    const midInput = {
      yesterdayWork: midText,
      todayWork: midText,
      currentIssue: midText,
    };
    const midResult = submitReport(midInput);
    expect(midResult.isValid).toBe(true);
    expect(midResult.errors).toEqual([]);
  });
});