import { submitReport } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-286
  test('送信時刻が現在時刻より未来の場合、エラーを発生させる', () => {
    const baseTime = new Date('2025-01-15T09:00:00Z');
    const futureSubmissionTime = new Date('2025-01-15T09:30:00Z');
    
    const input = {
      reporterId: 'ENG001',
      teamId: 'TEAM-A',
      reportDate: new Date('2025-01-15'),
      yesterdayAccomplishment: 'テスト実施',
      todayPlan: 'テスト設計',
      issuesAndConcerns: '環境構築',
      submissionTimestamp: futureSubmissionTime,
    };

    expect(() => submitReport(input, baseTime)).toThrow(/送信時刻が不正です。現在時刻以前である必要があります/);
  });
});