import { describe, test, expect, beforeEach } from '@jest/globals';
import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('aggregateReportSubmissionStatus - リアルタイム提出状況表示', () => {
  // SCEN-3051: [edge] 報告提出状況リアルタイム表示機能 - チーム10名中6名が提出済みのとき
  test('should display real-time submission status with 6 submitted and 4 unsubmitted members', async () => {
    const reportDate = '2024-01-15';
    const teamId = 'team-001';
    const requestUserId = 'user-manager-001';

    // 入力パラメータ：6名が提出済み、4名が未提出のシナリオ
    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // テスト用メンバーデータ定義
    // 6名が提出済み、4名が未提出
    const submittedMemberIds = ['member-001', 'member-002', 'member-003', 'member-004', 'member-005', 'member-006'];
    const unsubmittedMemberIds = ['member-007', 'member-008', 'member-009', 'member-010'];

    // モック関数：提出状況データを返す
    // 実装側では、この関数が実際のデータベースクエリを実行する想定
    const mockGetReportSubmissionData = jest.fn(async () => {
      return {
        submittedMembers: submittedMemberIds.map((userId, index) => ({
          userId,
          userName: `Member ${index + 1}`,
          email: `member${index + 1}@company.com`,
          submissionTimestamp: new Date('2024-01-15T08:30:00Z'),
        })),
        unsubmittedMembers: unsubmittedMemberIds.map((userId, index) => ({
          userId,
          userName: `Member ${index + 7}`,
          email: `member${index + 7}@company.com`,
        })),
        totalMembers: 10,
      };
    });

    // 関数呼び出し前の期待値計算（structured.formulaに基づく）
    const expectedTotalMembers = 10;
    const expectedSubmittedCount = 6;
    const expectedUnsubmittedCount = 4;
    const expectedDelayedSubmissionCount = 0;
    const expectedSubmissionRate = (6 / 10) * 100; // 60.0%

    // 実際の関数を呼び出し
    const result: ReportSubmissionStatusSummary = await aggregateReportSubmissionStatus(input);

    // アサーション：提出状況が正確に集計されていることを検証
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(expectedTotalMembers);
    expect(result.submittedCount).toBe(expectedSubmittedCount);
    expect(result.unsubmittedCount).toBe(expectedUnsubmittedCount);
    expect(result.delayedSubmissionCount).toBe(expectedDelayedSubmissionCount);

    // 提出率の検証（小数第1位まで）
    expect(result.submissionRate).toBe(expectedSubmissionRate);

    // 未提出メンバー一覧の検証
    expect(result.unsubmittedMembers).toHaveLength(expectedUnsubmittedCount);
    expect(result.unsubmittedMembers[0]).toMatchObject({
      userId: 'member-007',
      userName: 'Member 7',
      email: 'member7@company.com',
    });
    expect(result.unsubmittedMembers[3]).toMatchObject({
      userId: 'member-010',
      userName: 'Member 10',
      email: 'member10@company.com',
    });

    // 集計時刻がISO 8601形式で記録されていることを検証
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);

    // 提出済みと未提出の合計が総メンバー数と一致していることを検証
    const totalCheckedMembers = result.submittedCount + result.unsubmittedCount + result.delayedSubmissionCount;
    expect(totalCheckedMembers).toBe(result.totalMembers);
  });
});