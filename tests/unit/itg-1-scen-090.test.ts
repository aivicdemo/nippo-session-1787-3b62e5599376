import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('報告提出状況のリアルタイム集計・表示機能', () => {
  // SCEN-090: 提出完了トリガーで同じ入力データを2回実行しても同じ提出状況集計結果が返される
  test('同一データを2回提出した場合、集計結果が変わらない（上書き更新・重複カウントなし）', () => {
    // 入力データ（1回目と2回目で同一）
    const reportDate = '2024-01-15';
    const teamId = 'team-001';
    const requestUserId = 'user-manager-001';

    // 提出状況のベースデータ（部員A が提出済み、部員B～J が未提出）
    // 部員10名のうち、1名が提出、9名が未提出
    const firstSubmissionInput: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // 1回目の集計実行
    const firstResult: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(firstSubmissionInput);

    // 1回目の結果を検証
    expect(firstResult.teamId).toBe(teamId);
    expect(firstResult.reportDate).toBe(reportDate);
    expect(firstResult.totalMembers).toBe(10);
    expect(firstResult.submittedCount).toBe(1);
    expect(firstResult.unsubmittedCount).toBe(9);
    expect(firstResult.delayedSubmissionCount).toBe(0);
    expect(firstResult.submissionRate).toBe(10.0);
    expect(firstResult.unsubmittedMembers.length).toBe(9);
    expect(typeof firstResult.aggregatedAt).toBe('string');

    // 1回目の結果を記録
    const firstSubmittedCount = firstResult.submittedCount;
    const firstUnsubmittedCount = firstResult.unsubmittedCount;
    const firstSubmissionRate = firstResult.submissionRate;

    // 2回目の集計実行（同一入力）
    const secondSubmissionInput: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const secondResult: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(secondSubmissionInput);

    // 2回目の結果を検証
    expect(secondResult.teamId).toBe(teamId);
    expect(secondResult.reportDate).toBe(reportDate);
    expect(secondResult.totalMembers).toBe(10);
    expect(secondResult.submittedCount).toBe(firstSubmittedCount);
    expect(secondResult.unsubmittedCount).toBe(firstUnsubmittedCount);
    expect(secondResult.delayedSubmissionCount).toBe(0);
    expect(secondResult.submissionRate).toBe(firstSubmissionRate);
    expect(secondResult.unsubmittedMembers.length).toBe(firstResult.unsubmittedMembers.length);

    // 1回目と2回目の結果が完全に一致することを検証
    expect(secondResult.submittedCount).toBe(firstResult.submittedCount);
    expect(secondResult.unsubmittedCount).toBe(firstResult.unsubmittedCount);
    expect(secondResult.delayedSubmissionCount).toBe(firstResult.delayedSubmissionCount);
    expect(secondResult.submissionRate).toBe(firstResult.submissionRate);
    expect(secondResult.totalMembers).toBe(firstResult.totalMembers);

    // 未提出メンバーリストが同一であることを検証
    expect(secondResult.unsubmittedMembers.length).toBe(firstResult.unsubmittedMembers.length);
    for (let i = 0; i < secondResult.unsubmittedMembers.length; i++) {
      expect(secondResult.unsubmittedMembers[i].userId).toBe(
        firstResult.unsubmittedMembers[i].userId
      );
      expect(secondResult.unsubmittedMembers[i].userName).toBe(
        firstResult.unsubmittedMembers[i].userName
      );
      expect(secondResult.unsubmittedMembers[i].email).toBe(
        firstResult.unsubmittedMembers[i].email
      );
    }
  });
});