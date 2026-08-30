import { submitReport } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム - 日報送信管理', () => {
  // SCEN-189: 昨日の実績が500文字を超過した場合のエラーハンドリング
  test('昨日の実績が501文字（上限超過1文字）のとき、ValidationErrorをスロー', () => {
    const yesterdayAccomplishment501Chars = 'a'.repeat(501);
    const todayPlan100Chars = 'b'.repeat(100);
    const issuesAndConcerns100Chars = 'c'.repeat(100);

    const input = {
      reporterId: 'engineer-001',
      teamId: 'team-alpha',
      reportDate: new Date('2024-01-15T09:00:00Z'),
      yesterdayAccomplishment: yesterdayAccomplishment501Chars,
      todayPlan: todayPlan100Chars,
      issuesAndConcerns: issuesAndConcerns100Chars,
    };

    expect(() => submitReport(input)).toThrow(/昨日の実績は500文字以内/);
  });
});