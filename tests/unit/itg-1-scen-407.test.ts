import { describe, test, expect, beforeEach } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('部長向けダッシュボード - リアルタイム報告提出状況表示', () => {
  test('SCEN-407: 部長がダッシュボードを開いた場合、報告提出状況がリアルタイム表示される', () => {
    // Arrange: テスト用入力データ
    const input: DashboardDataFreshnessInput = {
      userId: 'manager-001',
      teamId: 'team-dev-001',
      reportDate: '2024-01-15',
      maxStalenessSeconds: 300,
    };

    // 提出済みメンバーのデータ（A～G: 7名）
    const submittedMembers = [
      { memberId: 'member-a', memberName: 'メンバーA', submissionTimestamp: '2024-01-14T23:30:00Z' },
      { memberId: 'member-b', memberName: 'メンバーB', submissionTimestamp: '2024-01-14T23:45:00Z' },
      { memberId: 'member-c', memberName: 'メンバーC', submissionTimestamp: '2024-01-14T23:20:00Z' },
      { memberId: 'member-d', memberName: 'メンバーD', submissionTimestamp: '2024-01-14T23:55:00Z' },
      { memberId: 'member-e', memberName: 'メンバーE', submissionTimestamp: '2024-01-14T23:10:00Z' },
      { memberId: 'member-f', memberName: 'メンバーF', submissionTimestamp: '2024-01-14T23:50:00Z' },
      { memberId: 'member-g', memberName: 'メンバーG', submissionTimestamp: '2024-01-14T23:35:00Z' },
    ];

    // 未提出メンバー（H～J: 3名）
    const unsubmittedMembers = [
      { memberId: 'member-h', memberName: 'メンバーH' },
      { memberId: 'member-i', memberName: 'メンバーI' },
      { memberId: 'member-j', memberName: 'メンバーJ' },
    ];

    // モック用のデータベース状態
    const mockDatabaseState = {
      submittedReports: submittedMembers,
      unsubmittedMembers: unsubmittedMembers,
      lastUpdatedAt: '2024-01-15T08:00:00Z',
    };

    // ダッシュボード表示時刻（固定値）
    const displayTimestamp = '2024-01-15T08:05:30Z';
    const lastUpdateTimestamp = '2024-01-15T08:00:00Z';

    // データ遅延時間の計算（秒単位）
    // displayTimestamp から lastUpdateTimestamp を差し引く = 330秒
    const expectedStalenessSeconds = 330;

    // Act: ensureDashboardDataFreshness を呼び出す
    const result = ensureDashboardDataFreshness(
      input,
      mockDatabaseState,
      displayTimestamp,
      lastUpdateTimestamp,
    );

    // Assert: 戻り値を検証
    expect(result).toBeDefined();
    expect(result.isDataFresh).toBe(true);
    expect(result.lastUpdateTimestamp).toBe(lastUpdateTimestamp);
    expect(result.displayTimestamp).toBe(displayTimestamp);
    expect(result.stalenessSeconds).toBe(expectedStalenessSeconds);

    // 提出状況のサマリー検証
    const summaryResult = result.submissionSummary;
    expect(summaryResult).toBeDefined();
    expect(summaryResult.totalMembers).toBe(10);
    expect(summaryResult.submittedCount).toBe(7);
    expect(summaryResult.unsubmittedCount).toBe(3);
    expect(summaryResult.submissionRate).toBe(70);

    // 提出済みメンバー一覧の検証
    const submittedList = result.submittedMembers;
    expect(submittedList).toHaveLength(7);
    expect(submittedList.map((m) => m.memberId)).toEqual([
      'member-a',
      'member-b',
      'member-c',
      'member-d',
      'member-e',
      'member-f',
      'member-g',
    ]);

    // 未提出メンバー一覧の検証
    const unsubmittedList = result.unsubmittedMembers;
    expect(unsubmittedList).toHaveLength(3);
    expect(unsubmittedList.map((m) => m.memberId)).toEqual([
      'member-h',
      'member-i',
      'member-j',
    ]);
  });
});

// 型定義（テスト用）
interface DashboardDataFreshnessInput {
  userId: string;
  teamId: string;
  reportDate: string;
  maxStalenessSeconds?: number;
}

interface SubmissionSummary {
  totalMembers: number;
  submittedCount: number;
  unsubmittedCount: number;
  submissionRate: number;
}

interface MemberInfo {
  memberId: string;
  memberName: string;
  submissionTimestamp?: string;
}

interface DashboardDataFreshnessOutput {
  isDataFresh: boolean;
  lastUpdateTimestamp: string;
  displayTimestamp: string;
  stalenessSeconds: number;
  submissionSummary: SubmissionSummary;
  submittedMembers: MemberInfo[];
  unsubmittedMembers: MemberInfo[];
}