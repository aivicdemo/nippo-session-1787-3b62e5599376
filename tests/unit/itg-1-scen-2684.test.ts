import { fetchYesterdayReport } from '../../src/logic/report-submission';

describe('前日報告内容取得機能', () => {
  // SCEN-2684
  test('報告日付が不正なフォーマット（YYYY-MM-DD 以外）のとき、エラーが発生する', () => {
    const engineerId = 'eng-001';
    const invalidTargetDate = new Date('2024/01/15'); // 不正なフォーマット相当
    const requestingUserId = 'mgr-001';

    const error = expect(() =>
      fetchYesterdayReport({
        engineerId,
        targetDate: invalidTargetDate,
        requestingUserId,
      })
    ).toThrow(/報告日付/);

    try {
      fetchYesterdayReport({
        engineerId,
        targetDate: invalidTargetDate,
        requestingUserId,
      });
    } catch (err: unknown) {
      if (err instanceof Error && 'code' in err && 'statusCode' in err && 'details' in err) {
        const thrownError = err as {
          code: string;
          statusCode: number;
          message: string;
          details: { input: string };
        };
        expect(thrownError.code).toBe('INVALID_DATE_FORMAT');
        expect(thrownError.statusCode).toBe(400);
        expect(thrownError.message).toMatch(/YYYY-MM-DD形式/);
        expect(thrownError.message).toMatch(/2024\/01\/15/);
        expect(thrownError.details.input).toBe('2024/01/15');
      }
    }
  });
});