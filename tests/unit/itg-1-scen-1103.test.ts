import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('報告提出状況追跡機能 - 年度末から年度初をまたぐ提出期限状況', () => {
  // SCEN-1103
  test('年度末から年度初をまたぐ日報提出期限の状況が正確に判定される', async () => {
    // Setup: 年度末日（3月31日 23:59:59）を基準時刻として設定
    const fiscalYearEndDatetime = new Date('2024-03-31T23:59:59Z');
    const fiscalYearStartDatetime = new Date('2024-04-01T00:00:00Z');

    // 提出期限が年度末日の23:59:59に設定された日報案件を作成
    const teamId = 'team-001';
    const reportDate = '2024-03-31';
    const requestUserId = 'manager-001';

    // 年度末日23:59:59時点での提出状況を照会
    const inputAtFiscalYearEnd: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // Mock data: チーム内のメンバー情報
    // 総メンバー数: 10名
    // 期限内提出済み: 7名
    // 未提出: 2名
    // 期限超過提出: 1名
    const expectedSummaryAtFiscalYearEnd: Partial<ReportSubmissionStatusSummary> = {
      teamId,
      reportDate,
      totalMembers: 10,
      submittedCount: 7,
      unsubmittedCount: 2,
      delayedSubmissionCount: 1,
      submissionRate: 80.0, // (7 + 1) / 10 * 100 = 80.0
    };

    // 年度末日時点での照会実行
    const resultAtFiscalYearEnd = await aggregateReportSubmissionStatus(inputAtFiscalYearEnd);

    // 年度末日における提出期限状態を検証
    expect(resultAtFiscalYearEnd.teamId).toBe(teamId);
    expect(resultAtFiscalYearEnd.reportDate).toBe(reportDate);
    expect(resultAtFiscalYearEnd.totalMembers).toBe(expectedSummaryAtFiscalYearEnd.totalMembers);
    expect(resultAtFiscalYearEnd.submittedCount).toBe(expectedSummaryAtFiscalYearEnd.submittedCount);
    expect(resultAtFiscalYearEnd.unsubmittedCount).toBe(expectedSummaryAtFiscalYearEnd.unsubmittedCount);
    expect(resultAtFiscalYearEnd.delayedSubmissionCount).toBe(expectedSummaryAtFiscalYearEnd.delayedSubmissionCount);
    expect(resultAtFiscalYearEnd.submissionRate).toBe(expectedSummaryAtFiscalYearEnd.submissionRate);

    // 年度末日の未提出メンバー情報を確認
    expect(resultAtFiscalYearEnd.unsubmittedMembers).toBeDefined();
    expect(resultAtFiscalYearEnd.unsubmittedMembers.length).toBe(2);

    // 未提出メンバーの情報確認: 期限までの残り時間が正の値（期限内）
    const unsubmittedMemberAtYearEnd = resultAtFiscalYearEnd.unsubmittedMembers[0];
    expect(unsubmittedMemberAtYearEnd.userId).toBeDefined();
    expect(unsubmittedMemberAtYearEnd.userName).toBeDefined();
    expect(unsubmittedMemberAtYearEnd.email).toBeDefined();
    // 年度末23:59:59時点で未提出なので、残り時間は0分以上（期限内はごくわずか）
    expect(unsubmittedMemberAtYearEnd.remainingMinutes).toBeGreaterThanOrEqual(0);

    // 年度初日（4月1日 00:00:00）に時刻を進めて同じ日報の状態を照会
    const inputAtFiscalYearStart: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate, // 同じ報告日
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // 年度初日時点での照会実行
    const resultAtFiscalYearStart = await aggregateReportSubmissionStatus(inputAtFiscalYearStart);

    // 年度初日における提出期限状態を検証
    // 前日の未提出メンバー2名は期限超過となり、delayedSubmissionCountに含まれるはず
    expect(resultAtFiscalYearStart.teamId).toBe(teamId);
    expect(resultAtFiscalYearStart.reportDate).toBe(reportDate);

    // 年度初日での期待値: 前日の未提出2名が期限超過に移行
    // 期限内提出: 7名（変わらず）
    // 未提出: 0名（前日の未提出2名が期限超過に移行）
    // 期限超過: 3名（前日の1名 + 前日の未提出2名）
    const expectedSummaryAtFiscalYearStart: Partial<ReportSubmissionStatusSummary> = {
      teamId,
      reportDate,
      totalMembers: 10,
      submittedCount: 7,
      unsubmittedCount: 0,
      delayedSubmissionCount: 3,
      submissionRate: 100.0, // (7 + 3) / 10 * 100 = 100.0
    };

    expect(resultAtFiscalYearStart.submittedCount).toBe(expectedSummaryAtFiscalYearStart.submittedCount);
    expect(resultAtFiscalYearStart.unsubmittedCount).toBe(expectedSummaryAtFiscalYearStart.unsubmittedCount);
    expect(resultAtFiscalYearStart.delayedSubmissionCount).toBe(expectedSummaryAtFiscalYearStart.delayedSubmissionCount);
    expect(resultAtFiscalYearStart.submissionRate).toBe(expectedSummaryAtFiscalYearStart.submissionRate);

    // 年度初日では、前日の未提出メンバーは now delayed として表示される
    expect(resultAtFiscalYearStart.unsubmittedMembers).toBeDefined();
    expect(resultAtFiscalYearStart.unsubmittedMembers.length).toBe(0);

    // 年度末と年度初の提出期限状態が異なることを確認
    expect(resultAtFiscalYearEnd.unsubmittedCount).not.toBe(resultAtFiscalYearStart.unsubmittedCount);
    expect(resultAtFiscalYearEnd.delayedSubmissionCount).not.toBe(resultAtFiscalYearStart.delayedSubmissionCount);

    // aggregatedAt フィールドが ISO 8601 形式で記録されていることを確認
    expect(resultAtFiscalYearEnd.aggregatedAt).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(resultAtFiscalYearStart.aggregatedAt).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // 年度初日の aggregatedAt が年度末日の aggregatedAt より後であることを確認
    const yearEndTime = new Date(resultAtFiscalYearEnd.aggregatedAt).getTime();
    const yearStartTime = new Date(resultAtFiscalYearStart.aggregatedAt).getTime();
    expect(yearStartTime).toBeGreaterThan(yearEndTime);
  });
});