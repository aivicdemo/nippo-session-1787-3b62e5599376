import { getSubmissionStatus, type SubmissionStatusQueryInput } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム - getSubmissionStatus', () => {
  // SCEN-634: [error] 指定日付のチーム全体の報告提出状況を集計し、提出済み・未提出メンバーと提出時刻を返す - 報告日付がYYYY-MM-DD形式でないときという明示された境界条件で報告日付の形式が不正です。YYYY-MM-DD形式で指定してください
  test('報告日付がスラッシュ区切り形式で指定された場合、日付形式エラーをスロー', () => {
    const input: SubmissionStatusQueryInput = {
      teamId: 'team-001',
      reportDate: '2024/01/15',
      requesterId: 'user-001',
    };

    expect(() => getSubmissionStatus(input)).toThrow(/形式/);
  });
});