import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2503: [normal] 初回テスト報告の入力検証機能 - 全必須項目が入力され、形式が正しい場合に報告が受理される
  test('全必須項目が正しく入力された場合、日報は正常に受理される', async () => {
    const testUserId = 'test-user-001';
    const testTeamId = 'team-001';
    const reportDate = '2024-01-15';
    const yesterdayAccomplishment = 'ドキュメント作成、レビュー対応';
    const todayPlan = 'システムテスト実施、報告書作成';
    const challenges = 'API連携の遅延';

    const input = {
      userId: testUserId,
      teamId: testTeamId,
      yesterdayAccomplishment,
      todayPlan,
      challenges,
      reportDate,
    };

    const result = await submitDailyReport(input);

    expect(result).toEqual({
      reportId: expect.any(String),
      submissionTimestamp: expect.any(String),
      isWithinDeadline: true,
    });

    expect(result.reportId).toBeTruthy();
    expect(result.reportId.length).toBeGreaterThan(0);

    const submissionDate = new Date(result.submissionTimestamp);
    expect(submissionDate.getTime()).toBeGreaterThan(0);

    expect(result.isWithinDeadline).toBe(true);
  });
});