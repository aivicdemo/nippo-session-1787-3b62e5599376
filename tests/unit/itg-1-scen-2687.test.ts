import { fetchYesterdayReport } from '../../src/logic/report-submission';

describe('前日報告内容取得機能', () => {
  // SCEN-2687
  test('指定されたユーザーが該当チームに属していない場合、エラーが発生する', async () => {
    const engineerId = 'user_A';
    const targetDate = new Date('2024-01-15');
    const requestingUserId = 'user_A';
    const teamId = 'team_B';

    const error = await (async () => {
      try {
        await fetchYesterdayReport({
          engineerId,
          targetDate,
          requestingUserId,
          teamId,
        });
        return null;
      } catch (err) {
        return err;
      }
    })();

    expect(error).not.toBeNull();
    expect(error).toMatchObject(
      expect.objectContaining({
        code: expect.stringMatching(/USER_NOT_IN_TEAM/),
        message: expect.stringMatching(/チームに属していません/),
      })
    );
  });
});