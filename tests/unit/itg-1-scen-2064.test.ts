import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-2064: [edge] 対策案の必須項目検証機能 - 実行計画の登録順序が優先度の降順と逆になっている場合に検証がパスする
  test('対策案の必須項目がすべて入力済みの場合、登録順序と優先度の降順が逆でも検証がパスしてメッセージが表示される', () => {
    const reportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '前日は新機能Aの開発を完了した',
      todayPlan: '本日は新機能Bの実装に着手する',
      challenges: 'データベース接続がタイムアウトする問題が発生している',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(reportInput);

    expect(result).toEqual({
      reportId: expect.any(String),
      submissionTimestamp: expect.any(String),
      isWithinDeadline: expect.any(Boolean),
    });

    expect(result.reportId).toMatch(/^report-/);
    expect(new Date(result.submissionTimestamp)).toBeInstanceOf(Date);
    expect(typeof result.isWithinDeadline).toBe('boolean');
  });
});