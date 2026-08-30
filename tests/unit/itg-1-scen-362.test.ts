import { prepareDashboardData } from '../../src/logic/dashboard-presentation';
import { type DashboardDataPrepareInput, type DashboardDisplayData } from '../../src/logic/dashboard-presentation';

describe('朝会報告管理システム - ダッシュボード表示データ準備', () => {
  // SCEN-362: [normal] 部長向けダッシュボード表示用に、提出状況サマリー、未提出メンバー一覧、優先度別課題一覧、課題キーワード発生頻度ランキングを集計・整形して返す
  test('prepareDashboardData: 本日の日報を正常に集計し、ダッシュボード表示データを返す', () => {
    // Arrange
    const baseDate = new Date('2024-01-15T09:00:00Z');
    const targetDate = new Date('2024-01-15T00:00:00Z');
    
    const input: DashboardDataPrepareInput = {
      teamId: 'team-001',
      targetDate: targetDate,
      requestingUserId: 'user-manager-001',
      includeHistoricalTrend: false,
    };

    // Act
    const result = prepareDashboardData(input);

    // Assert
    expect(result).toBeDefined();
    expect(result).toHaveProperty('submissionStatusSummary');
    expect(result).toHaveProperty('unsubmittedMembers');
    expect(result).toHaveProperty('prioritizedIssueList');
    expect(result).toHaveProperty('issueKeywordRanking');
    expect(result).toHaveProperty('lastUpdatedAt');

    // Verify submissionStatusSummary structure
    expect(result.submissionStatusSummary).toHaveProperty('submittedCount');
    expect(result.submissionStatusSummary).toHaveProperty('totalTeamMembers');
    expect(result.submissionStatusSummary).toHaveProperty('submissionDeadline');
    expect(typeof result.submissionStatusSummary.submittedCount).toBe('number');
    expect(typeof result.submissionStatusSummary.totalTeamMembers).toBe('number');

    // Verify unsubmittedMembers is array with expected structure
    expect(Array.isArray(result.unsubmittedMembers)).toBe(true);
    if (result.unsubmittedMembers.length > 0) {
      expect(result.unsubmittedMembers[0]).toHaveProperty('memberId');
      expect(result.unsubmittedMembers[0]).toHaveProperty('memberName');
    }

    // Verify prioritizedIssueList is array with expected structure
    expect(Array.isArray(result.prioritizedIssueList)).toBe(true);
    if (result.prioritizedIssueList.length > 0) {
      expect(result.prioritizedIssueList[0]).toHaveProperty('issueId');
      expect(result.prioritizedIssueList[0]).toHaveProperty('issueContent');
      expect(result.prioritizedIssueList[0]).toHaveProperty('priorityScore');
      expect(result.prioritizedIssueList[0]).toHaveProperty('colorCode');
      expect(result.prioritizedIssueList[0]).toHaveProperty('impactLevel');
      expect(result.prioritizedIssueList[0]).toHaveProperty('reporterName');
      expect(typeof result.prioritizedIssueList[0].priorityScore).toBe('number');
      expect(result.prioritizedIssueList[0].priorityScore).toBeGreaterThanOrEqual(0);
      expect(result.prioritizedIssueList[0].priorityScore).toBeLessThanOrEqual(100);
    }

    // Verify issueKeywordRanking is array with expected structure
    expect(Array.isArray(result.issueKeywordRanking)).toBe(true);
    if (result.issueKeywordRanking.length > 0) {
      expect(result.issueKeywordRanking[0]).toHaveProperty('keyword');
      expect(result.issueKeywordRanking[0]).toHaveProperty('frequency');
      expect(result.issueKeywordRanking[0]).toHaveProperty('percentageOfTotal');
      expect(typeof result.issueKeywordRanking[0].frequency).toBe('number');
      expect(typeof result.issueKeywordRanking[0].percentageOfTotal).toBe('number');
    }

    // Verify lastUpdatedAt is a valid Date close to current time
    expect(result.lastUpdatedAt instanceof Date).toBe(true);
    const timeDifference = Date.now() - result.lastUpdatedAt.getTime();
    expect(timeDifference).toBeGreaterThanOrEqual(0);
    expect(timeDifference).toBeLessThan(5000); // Within 5 seconds of call time
  });
});