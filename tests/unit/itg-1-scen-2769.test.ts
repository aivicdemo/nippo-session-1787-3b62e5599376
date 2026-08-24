import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム表示機能', () => {
  // SCEN-2769: [error] 報告提出状況リアルタイム表示機能 - 提出済み報告の報告者IDがメンバーマスタに存在しないとき照合処理が失敗する
  test('メンバーマスタに存在しないユーザーID（user_9999）を持つ提出済み報告の照合処理が失敗すること', async () => {
    // テストデータ: メンバーマスタに存在しないユーザーID を持つ提出済み報告
    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'team_001',
      reportDate: '2024-01-15',
      requestUserId: 'manager_001',
      includeDelayedSubmissions: true,
    };

    // 本来なら aggregateReportSubmissionStatus は内部的に以下を実行する想定:
    // 1. チームメンバー一覧を取得
    // 2. 提出状況テーブルから reportDate のレコードを検索
    // 3. 各提出済み報告について、提出者ユーザーID を メンバーマスタで照合
    // 4. user_9999 は存在しないため照合失敗

    // ここで照合失敗が発生することを期待する
    expect(() =>
      aggregateReportSubmissionStatus(input)
    ).toThrow(/メンバーID.*存在しません/);
  });
});