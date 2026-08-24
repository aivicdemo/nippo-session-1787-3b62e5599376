import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type {
  AggregateReportSubmissionStatusInput,
  ReportSubmissionStatusSummary,
  UnsubmittedMember,
} from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Aggregation - Real-time Display at 7:30 AM', () => {
  // SCEN-3026: [normal] 報告提出状況リアルタイム表示機能 - 営業日の朝7時30分到達時に報告提出状況が自動更新される
  test('should aggregate and display submission status with correct counts at 7:30 AM trigger time', async () => {
    // ========== SETUP ==========
    const teamId = 'team-dev-001';
    const reportDate = '2024-01-15'; // 営業日（月曜日）
    const requestUserId = 'user-director-001'; // 部長のユーザーID

    // シナリオの状態: 提出済み5件、未提出5件
    const submittedCount = 5;
    const unsubmittedCount = 5;
    const totalMembers = submittedCount + unsubmittedCount; // 10名

    // 未提出メンバー情報（期限までの残り時間を計算）
    // 朝7時30分時点で、期限が9時の場合、残り時間は90分
    const remainingMinutesAtTrigger = 90;

    const unsubmittedMembers: UnsubmittedMember[] = [
      {
        userId: 'user-eng-001',
        userName: 'Engineer A',
        email: 'eng-a@company.jp',
        remainingMinutes: remainingMinutesAtTrigger,
      },
      {
        userId: 'user-eng-002',
        userName: 'Engineer B',
        email: 'eng-b@company.jp',
        remainingMinutes: remainingMinutesAtTrigger,
      },
      {
        userId: 'user-eng-003',
        userName: 'Engineer C',
        email: 'eng-c@company.jp',
        remainingMinutes: remainingMinutesAtTrigger,
      },
      {
        userId: 'user-eng-004',
        userName: 'Engineer D',
        email: 'eng-d@company.jp',
        remainingMinutes: remainingMinutesAtTrigger,
      },
      {
        userId: 'user-eng-005',
        userName: 'Engineer E',
        email: 'eng-e@company.jp',
        remainingMinutes: remainingMinutesAtTrigger,
      },
    ];

    // 期限内提出 = 5件、期限超過提出 = 0件
    const delayedSubmissionCount = 0;

    // 提出率の計算: (提出済み / 総メンバー) * 100
    // structured.formula より: submissionRate = (submittedCount / totalMembers) * 100
    const expectedSubmissionRate = (submittedCount / totalMembers) * 100; // 50.0

    // トリガー時刻: 朝7時30分00秒（ISO 8601形式）
    const aggregationTriggerTime = new Date('2024-01-15T07:30:00Z').toISOString();

    // ========== EXECUTE ==========
    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true, // デフォルト値
    };

    const result = await aggregateReportSubmissionStatus(input);

    // ========== ASSERTIONS ==========

    // (1) 集計結果の基本情報が正確であること
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);

    // (2) 提出状況の件数が期待値と一致すること
    expect(result.totalMembers).toBe(totalMembers); // 総メンバー数: 10
    expect(result.submittedCount).toBe(submittedCount); // 期限内提出済み: 5
    expect(result.unsubmittedCount).toBe(unsubmittedCount); // 未提出: 5
    expect(result.delayedSubmissionCount).toBe(delayedSubmissionCount); // 期限超過提出: 0

    // (3) 提出率が正確に計算されていること（小数第1位まで）
    expect(result.submissionRate).toBe(expectedSubmissionRate); // 50.0

    // (4) 未提出メンバーのリストが正確であること
    expect(result.unsubmittedMembers).toHaveLength(unsubmittedCount);
    result.unsubmittedMembers.forEach((member, index) => {
      expect(member.userId).toBe(unsubmittedMembers[index].userId);
      expect(member.userName).toBe(unsubmittedMembers[index].userName);
      expect(member.email).toBe(unsubmittedMembers[index].email);
      // 残り時間が正の値（期限までが残っている状態）
      expect(member.remainingMinutes).toBe(remainingMinutesAtTrigger);
    });

    // (5) 集計実行時刻がISO 8601形式で記録されていること
    // aggregatedAtが朝7時30分以降であることを確認
    const aggregationTime = new Date(result.aggregatedAt);
    const triggerTime = new Date(aggregationTriggerTime);
    expect(aggregationTime.getTime()).toBeGreaterThanOrEqual(triggerTime.getTime());

    // (6) 集計実行時刻の書式がISO 8601形式であること
    expect(result.aggregatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    // (7) 提出率が0～100の範囲内であること
    expect(result.submissionRate).toBeGreaterThanOrEqual(0);
    expect(result.submissionRate).toBeLessThanOrEqual(100);
  });
});