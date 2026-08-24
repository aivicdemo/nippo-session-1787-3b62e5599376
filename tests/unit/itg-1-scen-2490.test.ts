import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('Daily Report Management - submitDailyReport', () => {
  // SCEN-2490
  test('should return error when required field stepName is missing from operation step', () => {
    const inputWithMissingStepName = {
      operationSteps: [
        {
          stepOrder: 1,
          stepName: 'ログイン',
          completionTime: 30,
          isCorrect: true,
        },
        {
          stepOrder: 2,
          // stepName は意図的に欠落
          completionTime: 45,
          isCorrect: true,
        },
        {
          stepOrder: 3,
          stepName: '日報送信',
          completionTime: 60,
          isCorrect: true,
        },
      ],
    };

    const result = submitDailyReport(inputWithMissingStepName);

    expect(result).toHaveProperty('error');
    expect(result.error).toBeDefined();
    expect(result.error.errorCode).toBe('INVALID_STEP_DEFINITION');
    expect(result.error.message).toMatch(/必須項目.*ステップ名.*欠落/);
    expect(result.score).toBeNull();
  });
});