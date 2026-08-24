import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報提出', () => {
  // SCEN-2509: [normal] 初回テスト報告の入力検証機能 - 複数の検証エラーが同時に発生した場合に全エラーを含む修正指示が返される
  test('複数の検証エラーが同時に発生した場合にすべてのエラーを含む応答を返す', async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ success: true }),
      scheduleNotification: jest.fn().mockResolvedValue({ success: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'sent' }),
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [],
        frequency: [],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({ score: 0 }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'low' }),
    };

    const invalidInput = {
      userId: 'engineer-001',
      teamId: 'team-alpha',
      yesterdayAccomplishment: '',
      todayPlan: 'a'.repeat(1001),
      challenges: '!!!%%%###',
      reportDate: '2024-01-15',
    };

    const result = await submitDailyReport(
      invalidInput,
      mockNotificationServiceAdapter,
      mockTextAnalysisServiceAdapter
    );

    expect(result).toBeDefined();
    expect(result.validationErrors).toBeDefined();
    expect(Array.isArray(result.validationErrors)).toBe(true);
    expect(result.validationErrors.length).toBe(3);

    const errorFieldNames = result.validationErrors.map(
      (err: { fieldName: string }) => err.fieldName
    );
    expect(errorFieldNames).toContain('yesterdayAccomplishment');
    expect(errorFieldNames).toContain('todayPlan');
    expect(errorFieldNames).toContain('challenges');

    const yesterdayError = result.validationErrors.find(
      (err: { fieldName: string }) => err.fieldName === 'yesterdayAccomplishment'
    );
    expect(yesterdayError).toBeDefined();
    expect(yesterdayError.errorCode).toBe('MissingRequiredField');
    expect(yesterdayError.message).toMatch(/必須項目|入力してください/);

    const todayError = result.validationErrors.find(
      (err: { fieldName: string }) => err.fieldName === 'todayPlan'
    );
    expect(todayError).toBeDefined();
    expect(todayError.errorCode).toBe('ExceedsCharacterLimit');
    expect(todayError.message).toMatch(/1000文字|文字以内/);

    const challengesError = result.validationErrors.find(
      (err: { fieldName: string }) => err.fieldName === 'challenges'
    );
    expect(challengesError).toBeDefined();
    expect(challengesError.errorCode).toBe('InvalidCharacters');
    expect(challengesError.message).toMatch(/有効な文字|含めてください/);

    expect(result.isSubmitted).toBe(false);
    expect(result.reportId).toBeUndefined();
    expect(result.submissionTimestamp).toBeUndefined();
  });
});