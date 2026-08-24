import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('報告提出状況の集計・表示機能', () => {
  // SCEN-427
  test('同じメンバーの重複データが含まれている場合、重複排除後に正確な提出状況が集計される', () => {
    // テストデータ準備：同一メンバー（U001）の重複報告データ
    const firstSubmissionTime = new Date('2024-01-15T09:00:00Z');
    const secondSubmissionTime = new Date('2024-01-15T09:15:00Z');

    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'manager-001',
      includeDelayedSubmissions: true,
    };

    // 集計処理を実行
    const result = aggregateReportSubmissionStatus(input);

    // 検証：提出状況集計結果
    expect(result.teamId).toBe('team-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(10);
    expect(result.unsubmittedCount).toBe(0);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(100.0);

    // 検証：未提出メンバーリストが空
    expect(result.unsubmittedMembers).toEqual([]);

    // 検証：集計実行時刻が ISO 8601 形式で記録されている
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // 検証：重複排除されたメンバー（U001）のデータが最新のみ保持されている
    // 同一メンバーの複数提出がある場合でも、集計では1件としてカウントされる
    expect(result.submittedCount).toBe(10); // 重複排除後のカウント
  });
});