import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報入力検証機能', () => {
  // SCEN-2199
  test('今日やることのみが入力されていて他の2項目が空文字列の場合、昨日やったことと抱えている課題の2項目にエラーメッセージが表示される', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '',
      todayPlan: '明日の営業資料作成',
      challenges: '',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors).toHaveLength(2);

    const errorFields = result.errors?.map((err) => err.fieldName) || [];
    expect(errorFields).toContain('yesterdayAccomplishment');
    expect(errorFields).toContain('challenges');
    expect(errorFields).not.toContain('todayPlan');

    const yesterdayError = result.errors?.find(
      (err) => err.fieldName === 'yesterdayAccomplishment'
    );
    expect(yesterdayError?.errorCode).toBe('MissingRequiredField');
    expect(yesterdayError?.message).toMatch(/昨日やったこと/);

    const challengesError = result.errors?.find(
      (err) => err.fieldName === 'challenges'
    );
    expect(challengesError?.errorCode).toBe('MissingRequiredField');
    expect(challengesError?.message).toMatch(/抱えている課題/);
  });
});