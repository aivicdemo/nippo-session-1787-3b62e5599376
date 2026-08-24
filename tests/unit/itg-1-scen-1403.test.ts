import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';
import { type ToolIntegrationValidationResult } from '../../src/logic/tool-integration';

describe('朝会報告管理システム - 課題データアーカイブ機能', () => {
  // SCEN-1403
  test('連携完了から30日経過した課題複数件のとき、すべての該当課題がアーカイブ領域に移行される', () => {
    // 基準日時を固定（T0）
    const baselineDate = new Date('2026-01-20T09:00:00Z');
    const archivedAtDate = new Date(baselineDate.getTime() - 31 * 24 * 60 * 60 * 1000);

    // 連携完了から30日経過した課題3件
    const archivedIssues = [
      {
        issueId: 'ISSUE-001',
        integrationCompletedAt: archivedAtDate,
        status: 'integrated',
      },
      {
        issueId: 'ISSUE-002',
        integrationCompletedAt: archivedAtDate,
        status: 'integrated',
      },
      {
        issueId: 'ISSUE-003',
        integrationCompletedAt: archivedAtDate,
        status: 'integrated',
      },
    ];

    // 連携完了から30日未満の課題
    const recentIssue = {
      issueId: 'ISSUE-004',
      integrationCompletedAt: new Date(
        baselineDate.getTime() - 29 * 24 * 60 * 60 * 1000,
      ),
      status: 'integrated',
    };

    const allIssues = [...archivedIssues, recentIssue];

    // 検証ロジック実行
    const result: ToolIntegrationValidationResult =
      validateToolIntegrationSuccess({
        issuesToArchive: archivedIssues,
        currentTimestamp: baselineDate,
        recentIssues: [recentIssue],
      });

    // 期待結果: 30日以上経過した課題3件がアーカイブ状態に変更されている
    expect(result.isValid).toBe(true);
    expect(result.archivedIssuesCount).toBe(3);

    // アーカイブされた課題の状態確認
    expect(result.archivedIssues).toHaveLength(3);
    expect(result.archivedIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          issueId: 'ISSUE-001',
          archiveStatus: 'archived',
          archivedAt: baselineDate.toISOString(),
        }),
        expect.objectContaining({
          issueId: 'ISSUE-002',
          archiveStatus: 'archived',
          archivedAt: baselineDate.toISOString(),
        }),
        expect.objectContaining({
          issueId: 'ISSUE-003',
          archiveStatus: 'archived',
          archivedAt: baselineDate.toISOString(),
        }),
      ]),
    );

    // 30日未満の課題はアーカイブされていないことを確認
    expect(result.remainingActiveIssuesCount).toBe(1);
    expect(result.remainingActiveIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          issueId: 'ISSUE-004',
          archiveStatus: 'active',
        }),
      ]),
    );
  });
});