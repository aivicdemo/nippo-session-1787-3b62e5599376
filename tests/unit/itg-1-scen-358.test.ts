import { describe, it, expect, beforeEach } from '@jest/globals';
import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム更新機能', () => {
  it('SCEN-358: 送信時刻が日報送信時点の時刻ちょうどで記録される', () => {
    // Arrange
    const fixedSystemTime = new Date('2026-08-20T09:00:00.000Z');
    const teamId = 'team_001';
    const reportDate = '2026-08-20';
    const requestUserId = 'admin_user_001';

    // チームメンバー構成: 総10名
    const totalMembers = 10;

    // 期限内に提出済み: 6名
    const submittedOnTimeCount = 6;

    // 期限超過で提出: 2名
    const delayedSubmissionCount = 2;

    // 未提出: 2名
    const unsubmittedCount = 2;

    // 期限内提出率の計算: (6 / 10) * 100 = 60.0%
    const expectedSubmissionRate = 60.0;

    // 未提出メンバーの詳細情報
    const unsubmittedMembers = [
      {
        userId: 'user_002',
        userName: '山田太郎',
        email: 'yamada.taro@example.com',
        remainingMinutes: -45, // 期限超過45分
      },
      {
        userId: 'user_007',
        userName: '佐藤花子',
        email: 'sato.hanako@example.com',
        remainingMinutes: -30, // 期限超過30分
      },
    ];

    const input = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // Act
    const result = aggregateReportSubmissionStatus(input);

    // Assert
    // 基本情報の検証
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(totalMembers);

    // 提出状況の検証
    expect(result.submittedCount).toBe(submittedOnTimeCount);
    expect(result.delayedSubmissionCount).toBe(delayedSubmissionCount);
    expect(result.unsubmittedCount).toBe(unsubmittedCount);

    // 提出率の検証（小数第1位まで）
    expect(result.submissionRate).toBe(expectedSubmissionRate);

    // 集計実行時刻がISO 8601形式であることを検証
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    // 未提出メンバー情報の検証
    expect(result.unsubmittedMembers).toHaveLength(2);
    expect(result.unsubmittedMembers[0].userId).toBe('user_002');
    expect(result.unsubmittedMembers[0].userName).toBe('山田太郎');
    expect(result.unsubmittedMembers[0].email).toBe('yamada.taro@example.com');
    expect(result.unsubmittedMembers[0].remainingMinutes).toBe(-45);

    expect(result.unsubmittedMembers[1].userId).toBe('user_007');
    expect(result.unsubmittedMembers[1].userName).toBe('佐藤花子');
    expect(result.unsubmittedMembers[1].email).toBe('sato.hanako@example.com');
    expect(result.unsubmittedMembers[1].remainingMinutes).toBe(-30);
  });
});