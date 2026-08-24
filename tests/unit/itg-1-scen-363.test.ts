import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム更新機能', () => {
  // SCEN-363
  test('複数エンジニアが同一の送信時刻で報告を送信した場合に全件が提出済みに更新される', () => {
    // 初期データ設定
    const teamId = 'team-001';
    const reportDate = '2026-08-20';
    const requestUserId = 'manager-001';
    const simultaneousTimestamp = new Date('2026-08-20T09:00:00.000Z');

    // テスト用エンジニアデータ
    const engineerA = {
      userId: 'eng-a-001',
      userName: 'Engineer A',
      email: 'eng-a@example.com',
      submissionTimestamp: simultaneousTimestamp,
    };

    const engineerB = {
      userId: 'eng-b-001',
      userName: 'Engineer B',
      email: 'eng-b@example.com',
      submissionTimestamp: simultaneousTimestamp,
    };

    const engineerC = {
      userId: 'eng-c-001',
      userName: 'Engineer C',
      email: 'eng-c@example.com',
      submissionTimestamp: simultaneousTimestamp,
    };

    // 同一チームに属する3名のエンジニアが同時刻に報告を送信
    const submittedMembers = [engineerA, engineerB, engineerC];

    // 報告期限時刻（朝9時30分を想定）
    const deadlineTime = new Date('2026-08-20T09:30:00.000Z');

    // aggregateReportSubmissionStatus の入力パラメータ
    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // 提出済みメンバー情報を集約
    // ここで関数を呼び出し、実際の提出状況を検証する
    const result: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(
      input,
      submittedMembers,
      deadlineTime
    );

    // 期待値の検証
    // チーム総メンバー数は3名
    expect(result.totalMembers).toBe(3);

    // 提出期限内に提出済みのメンバー数は3名（同一時刻での同時送信のため全員期限内）
    expect(result.submittedCount).toBe(3);

    // 未提出メンバー数は0名
    expect(result.unsubmittedCount).toBe(0);

    // 期限超過での提出メンバー数は0名
    expect(result.delayedSubmissionCount).toBe(0);

    // 提出率は100%（小数第1位まで）
    expect(result.submissionRate).toBe(100.0);

    // 未提出メンバーのリストは空
    expect(result.unsubmittedMembers.length).toBe(0);

    // 集計対象チームIDが正しく記録されている
    expect(result.teamId).toBe(teamId);

    // 集計対象の報告日が正しく記録されている
    expect(result.reportDate).toBe(reportDate);

    // 集計実行時刻がISO 8601形式で記録されている
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    // 同一時刻での複数送信により、いずれの報告も欠落・重複することなく全件が記録される
    // submittedCount が投入メンバー数と一致していることで重複なし、欠落なしを確認
    expect(result.submittedCount).toBe(submittedMembers.length);
  });
});