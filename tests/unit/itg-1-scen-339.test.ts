import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報入力・送信', () => {
  // SCEN-339: [edge] 日報入力バリデーション機能 - 2項目が空文字列で1項目のみ有効なとき空の2項目がエラー表示される
  test('should return validation errors for empty yesterdayWork and issues fields while todayWork is valid', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '',
      todayPlan: '今日は顧客打ち合わせを実施',
      challenges: '',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors).toHaveLength(2);

    const yesterdayWorkError = result.errors?.find(
      (err) => err.fieldName === 'yesterdayAccomplishment'
    );
    expect(yesterdayWorkError).toBeDefined();
    expect(yesterdayWorkError?.errorCode).toBe('MissingRequiredField');
    expect(yesterdayWorkError?.message).toMatch(/テキストを入力/);

    const challengesError = result.errors?.find(
      (err) => err.fieldName === 'challenges'
    );
    expect(challengesError).toBeDefined();
    expect(challengesError?.errorCode).toBe('MissingRequiredField');
    expect(challengesError?.message).toMatch(/テキストを入力/);

    const todayPlanError = result.errors?.find(
      (err) => err.fieldName === 'todayPlan'
    );
    expect(todayPlanError).toBeUndefined();
  });
});