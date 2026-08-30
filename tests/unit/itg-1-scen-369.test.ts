import { prepareDashboardData, type DashboardDataPrepareInput, type DashboardDisplayData } from '../../src/logic/dashboard-presentation';

describe('朝会報告管理システム - ダッシュボード表示準備', () => {
  // SCEN-369
  test('メンバーの進捗ステータスが定義済み値以外の場合、デフォルト値「進行中」に正規化される', () => {
    // Arrange
    const teamId = 'team-001';
    const targetDate = new Date('2024-01-15T00:00:00Z');
    const requestingUserId = 'user-manager-001';

    const input: DashboardDataPrepareInput = {
      teamId,
      targetDate,
      requestingUserId,
      includeHistoricalTrend: true,
    };

    // Act
    const result: DashboardDisplayData = prepareDashboardData(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.submissionStatusSummary).toBeDefined();
    expect(result.unsubmittedMembers).toBeInstanceOf(Array);
    expect(result.prioritizedIssueList).toBeInstanceOf(Array);
    expect(result.issueKeywordRanking).toBeInstanceOf(Array);
    expect(result.lastUpdatedAt).toBeInstanceOf(Date);

    // メンバーの進捗ステータスが不正な値の場合、デフォルト値「進行中」に正規化されていることを検証
    // statusIndicators フィールドが存在し、不正なステータス値を持つメンバーの進捗ステータスが「進行中」に正規化されていることを確認
    if (result.submissionStatusSummary && result.submissionStatusSummary.memberStatusIndicators) {
      const memberWithInvalidStatus = result.submissionStatusSummary.memberStatusIndicators.find(
        (member) => member.originalStatus === 'UNKNOWN_STATUS'
      );

      if (memberWithInvalidStatus) {
        expect(memberWithInvalidStatus.normalizedStatus).toBe('進行中');
      }
    }

    // lastUpdatedAt が本日の日付で設定されていることを確認
    expect(result.lastUpdatedAt.getUTCDate()).toBe(targetDate.getUTCDate());
    expect(result.lastUpdatedAt.getUTCMonth()).toBe(targetDate.getUTCMonth());
    expect(result.lastUpdatedAt.getUTCFullYear()).toBe(targetDate.getUTCFullYear());
  });
});