import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次レポート生成機能', () => {
  // SCEN-1813: [error] 月次レポート生成機能 - チーム別パフォーマンス指標の値が期待の型と異なる場合レポート生成するとエラーになる
  test('チーム別パフォーマンス指標の impact_score が文字列型の場合、レポート生成時に型検証エラーをスロー', () => {
    const targetYear = 2024;
    const targetMonth = 1;
    const requestedByUserId = 'user-001';

    const malformedTeamMetrics = [
      {
        teamId: 'team-001',
        teamName: 'Development Team',
        issueResolutionSpeed: 3.5,
        reportSubmissionRate: 85,
        issueRecurrenceRate: 15,
        priorityScore: 72,
        impactScore: '85',
      },
    ];

    const input = {
      targetYear,
      targetMonth,
      requestedByUserId,
      teamIdFilter: ['team-001'],
    };

    expect(() => {
      extractMonthlyReportData(input, malformedTeamMetrics);
    }).toThrow(/impact_score/);
  });
});