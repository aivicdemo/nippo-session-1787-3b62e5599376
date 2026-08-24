import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('報告提出状況のリアルタイム集計機能', () => {
  // SCEN-3059
  test('月初日の朝7時30分にダッシュボードを開いたとき、本日の報告提出状況が正確に表示される', () => {
    const targetDate = '2026-09-01';
    const requestUserId = 'user-dept-manager-001';
    const teamId = 'team-dev-001';

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate: targetDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const expectedOutput: ReportSubmissionStatusSummary = {
      teamId,
      reportDate: targetDate,
      totalMembers: 10,
      submittedCount: 6,
      unsubmittedCount: 4,
      delayedSubmissionCount: 0,
      submissionRate: 60.0,
      unsubmittedMembers: [
        {
          userId: 'user-eng-004',
          userName: '佐藤花子',
          email: 'sato.hanako@company.com',
          remainingMinutes: 91,
        },
        {
          userId: 'user-eng-005',
          userName: '田中次郎',
          email: 'tanaka.jiro@company.com',
          remainingMinutes: 91,
        },
        {
          userId: 'user-eng-008',
          userName: '鈴木美咲',
          email: 'suzuki.misaki@company.com',
          remainingMinutes: 91,
        },
        {
          userId: 'user-eng-010',
          userName: '山田太郎',
          email: 'yamada.taro@company.com',
          remainingMinutes: 91,
        },
      ],
      aggregatedAt: '2026-09-01T07:30:00Z',
    };

    const result = aggregateReportSubmissionStatus(input);

    expect(result.teamId).toBe(expectedOutput.teamId);
    expect(result.reportDate).toBe(expectedOutput.reportDate);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(6);
    expect(result.unsubmittedCount).toBe(4);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(60.0);
    expect(result.unsubmittedMembers).toHaveLength(4);
    expect(result.unsubmittedMembers[0]).toEqual({
      userId: 'user-eng-004',
      userName: '佐藤花子',
      email: 'sato.hanako@company.com',
      remainingMinutes: 91,
    });
    expect(result.unsubmittedMembers[1]).toEqual({
      userId: 'user-eng-005',
      userName: '田中次郎',
      email: 'tanaka.jiro@company.com',
      remainingMinutes: 91,
    });
    expect(result.unsubmittedMembers[2]).toEqual({
      userId: 'user-eng-008',
      userName: '鈴木美咲',
      email: 'suzuki.misaki@company.com',
      remainingMinutes: 91,
    });
    expect(result.unsubmittedMembers[3]).toEqual({
      userId: 'user-eng-010',
      userName: '山田太郎',
      email: 'yamada.taro@company.com',
      remainingMinutes: 91,
    });
    expect(result.aggregatedAt).toBe('2026-09-01T07:30:00Z');
  });
});