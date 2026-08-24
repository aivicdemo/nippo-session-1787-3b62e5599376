import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2223
  test('3つの報告項目すべてが空文字列の場合、すべての項目にエラーメッセージが表示される', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-A',
      yesterdayAccomplishment: '',
      todayPlan: '',
      challenges: '',
      reportDate: '2024-01-15',
    };

    const validationResult = submitDailyReport(input);

    expect(validationResult.isValid).toBe(false);
    expect(validationResult.errors).toHaveLength(3);
    expect(validationResult.errors).toContainEqual(
      expect.objectContaining({
        fieldName: 'yesterdayAccomplishment',
        errorCode: 'MissingRequiredField',
      })
    );
    expect(validationResult.errors).toContainEqual(
      expect.objectContaining({
        fieldName: 'todayPlan',
        errorCode: 'MissingRequiredField',
      })
    );
    expect(validationResult.errors).toContainEqual(
      expect.objectContaining({
        fieldName: 'challenges',
        errorCode: 'MissingRequiredField',
      })
    );
    expect(
      validationResult.errors.some(
        (err) =>
          err.fieldName === 'yesterdayAccomplishment' &&
          /昨日やったこと/.test(err.message)
      )
    ).toBe(true);
    expect(
      validationResult.errors.some(
        (err) =>
          err.fieldName === 'todayPlan' && /今日やること/.test(err.message)
      )
    ).toBe(true);
    expect(
      validationResult.errors.some(
        (err) =>
          err.fieldName === 'challenges' && /課題/.test(err.message)
      )
    ).toBe(true);
  });
});