import { fetchYesterdayReport } from '../../src/logic/report-submission';

describe('前日報告内容取得機能', () => {
  test('SCEN-2696: チームがシステムに登録されていないとき、エラーが発生する', () => {
    const unregisteredTeamId = 'TEAM_UNKNOWN_001';
    const engineerId = 'ENG_001';
    const targetDate = new Date('2024-01-15');
    const requestingUserId = 'USER_ADMIN_001';

    const error = new Error(
      `指定されたチームID: ${unregisteredTeamId} はシステムに登録されていません`
    );
    (error as any).name = 'TeamNotRegisteredError';
    (error as any).statusCode = 404;

    expect(() =>
      fetchYesterdayReport({
        engineerId,
        targetDate,
        requestingUserId,
      })
    ).toThrow(/チームID.*登録されていません/);
  });
});