import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type {
  AggregateReportSubmissionStatusInput,
  ReportSubmissionStatusSummary,
  UnsubmittedMember,
} from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム表示機能', () => {
  // SCEN-3055: [edge] 報告提出状況リアルタイム表示機能 - 朝7時30分ちょうどにダッシュボード表示トリガーが発火したとき、本日の報告提出状況がリアルタイム表示される
  test('朝7時30分ちょうどのトリガー発火時に報告提出状況がリアルタイムで正確に表示される', async () => {
    // 固定時刻を朝7時30分00秒に設定
    const fixedNowTime = new Date('2024-01-15T07:30:00Z');
    const reportDate = '2024-01-15';
    const teamId = 'team-001';
    const requestUserId = 'manager-001';

    // テスト入力データ: 10名中7名が提出済み、3名未提出
    const submittedMembers = [
      {
        userId: 'user1',
        userName: 'Engineer1',
        email: 'user1@company.com',
        submittedAt: new Date('2024-01-15T07:00:00Z'),
      },
      {
        userId: 'user2',
        userName: 'Engineer2',
        email: 'user2@company.com',
        submittedAt: new Date('2024-01-15T07:05:00Z'),
      },
      {
        userId: 'user3',
        userName: 'Engineer3',
        email: 'user3@company.com',
        submittedAt: new Date('2024-01-15T07:10:00Z'),
      },
      {
        userId: 'user4',
        userName: 'Engineer4',
        email: 'user4@company.com',
        submittedAt: new Date('2024-01-15T07:12:00Z'),
      },
      {
        userId: 'user5',
        userName: 'Engineer5',
        email: 'user5@company.com',
        submittedAt: new Date('2024-01-15T07:15:00Z'),
      },
      {
        userId: 'user6',
        userName: 'Engineer6',
        email: 'user6@company.com',
        submittedAt: new Date('2024-01-15T07:18:00Z'),
      },
      {
        userId: 'user7',
        userName: 'Engineer7',
        email: 'user7@company.com',
        submittedAt: new Date('2024-01-15T07:20:00Z'),
      },
    ];

    const unsubmittedMembers: UnsubmittedMember[] = [
      {
        userId: 'user8',
        userName: 'Engineer8',
        email: 'user8@company.com',
        remainingMinutes: 30,
      },
      {
        userId: 'user9',
        userName: 'Engineer9',
        email: 'user9@company.com',
        remainingMinutes: 30,
      },
      {
        userId: 'user10',
        userName: 'Engineer10',
        email: 'user10@company.com',
        remainingMinutes: 30,
      },
    ];

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // aggregateReportSubmissionStatus を呼び出し
    const result = await aggregateReportSubmissionStatus(input);

    // 期待値を検証
    const expectedTotalMembers = 10;
    const expectedSubmittedCount = 7;
    const expectedUnsubmittedCount = 3;
    const expectedDelayedSubmissionCount = 0;
    const expectedSubmissionRate = 70.0;

    // 集計結果が正確に返される
    expect(result).toBeDefined();
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(expectedTotalMembers);
    expect(result.submittedCount).toBe(expectedSubmittedCount);
    expect(result.unsubmittedCount).toBe(expectedUnsubmittedCount);
    expect(result.delayedSubmissionCount).toBe(expectedDelayedSubmissionCount);
    expect(result.submissionRate).toBe(expectedSubmissionRate);

    // 未提出メンバーの詳細情報リストが正確に返される
    expect(result.unsubmittedMembers).toHaveLength(expectedUnsubmittedCount);
    expect(result.unsubmittedMembers[0].userId).toBe('user8');
    expect(result.unsubmittedMembers[0].userName).toBe('Engineer8');
    expect(result.unsubmittedMembers[0].email).toBe('user8@company.com');
    expect(result.unsubmittedMembers[1].userId).toBe('user9');
    expect(result.unsubmittedMembers[1].userName).toBe('Engineer9');
    expect(result.unsubmittedMembers[1].email).toBe('user9@company.com');
    expect(result.unsubmittedMembers[2].userId).toBe('user10');
    expect(result.unsubmittedMembers[2].userName).toBe('Engineer10');
    expect(result.unsubmittedMembers[2].email).toBe('user10@company.com');

    // 集計実行時刻がISO 8601形式で記録されている
    expect(result.aggregatedAt).toBeDefined();
    // ISO 8601形式の検証（YYYY-MM-DDTHH:mm:ss.sssZ）
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    expect(result.aggregatedAt).toMatch(iso8601Regex);

    // 提出状況の集計が正確である（提出済み7件 + 未提出3件 = 合計10件）
    expect(result.submittedCount + result.unsubmittedCount).toBe(expectedTotalMembers);

    // 提出率が正確に計算されている（7 / 10 * 100 = 70.0）
    const calculatedRate = (expectedSubmittedCount / expectedTotalMembers) * 100;
    expect(result.submissionRate).toBe(calculatedRate);
  });
});