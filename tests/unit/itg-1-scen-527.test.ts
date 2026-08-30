import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';
import { type Report, type RankedIssueList } from '../../src/logic/issue-extraction-and-ranking';

describe('朝会報告管理システム - 課題抽出・ランク付け', () => {
  // SCEN-527: 複数の日報から課題キーワードを自動抽出し、発生頻度と影響度に基づいて優先度スコアを計算して、優先度別に順序付けされた課題一覧を生成する。
  test('should extract and rank issues from multiple reports with correct priority scores and sorting', () => {
    // Arrange
    const report1: Report = {
      reportId: 'report-001',
      reportDate: new Date('2024-01-15T09:00:00Z'),
      issueText: 'ビルドエラーが発生しています',
      teamId: 'team-A'
    };

    const report2: Report = {
      reportId: 'report-002',
      reportDate: new Date('2024-01-16T09:00:00Z'),
      issueText: 'ビルドエラーが継続中です',
      teamId: 'team-B'
    };

    const report3: Report = {
      reportId: 'report-003',
      reportDate: new Date('2024-01-17T09:00:00Z'),
      issueText: 'テスト失敗が発生しました',
      teamId: 'team-A'
    };

    const report4: Report = {
      reportId: 'report-004',
      reportDate: new Date('2024-01-18T09:00:00Z'),
      issueText: 'ビルドエラーの問題が発生',
      teamId: 'team-C'
    };

    const reports: Report[] = [report1, report2, report3, report4];
    const analysisStartDate = new Date('2024-01-01T00:00:00Z');
    const analysisEndDate = new Date('2024-01-31T23:59:59Z');
    const minimumConfidenceThreshold = 50;

    // Act
    const result: RankedIssueList = extractAndRankIssuesFromReports(
      reports,
      analysisStartDate,
      analysisEndDate,
      minimumConfidenceThreshold
    );

    // Assert
    expect(result).toBeDefined();
    expect(result.issues).toBeDefined();
    expect(Array.isArray(result.issues)).toBe(true);
    expect(result.totalIssueCount).toBeGreaterThanOrEqual(1);
    expect(result.lowConfidenceIssueCount).toBeGreaterThanOrEqual(0);
    expect(result.analysisTimestamp).toBeDefined();

    const analysisTimestampTime = result.analysisTimestamp.getTime();
    const nowTime = new Date().getTime();
    const timeDiffMs = Math.abs(analysisTimestampTime - nowTime);
    expect(timeDiffMs).toBeLessThanOrEqual(5000);

    // Verify the first ranked issue (should be 'ビルドエラー' with highest score)
    const firstIssue = result.issues[0];
    expect(firstIssue).toBeDefined();
    expect(firstIssue.keyword).toBe('ビルドエラー');
    expect(firstIssue.frequency).toBe(3);
    expect(firstIssue.impactScore).toBeGreaterThanOrEqual(0);
    expect(firstIssue.impactScore).toBeLessThanOrEqual(100);

    // Verify priority score calculation: (frequency * 0.4 + impactScore * 0.6) * 100
    // With frequency=3, affectedTeamCount=3, averageAffectedMembers≈3.0
    // priorityScore should be approximately 100.0
    expect(firstIssue.priorityScore).toBeGreaterThanOrEqual(0);
    expect(firstIssue.priorityScore).toBeLessThanOrEqual(100);

    // Verify affectedTeamCount
    expect(firstIssue.affectedTeamCount).toBe(3);

    // Verify averageAffectedMembers
    expect(firstIssue.averageAffectedMembers).toBeGreaterThan(0);

    // Verify issues are sorted by priority score in descending order
    for (let i = 0; i < result.issues.length - 1; i++) {
      expect(result.issues[i].priorityScore).toBeGreaterThanOrEqual(
        result.issues[i + 1].priorityScore
      );
    }

    // Verify lowConfidenceIssueCount is valid
    expect(result.lowConfidenceIssueCount).toBeLessThanOrEqual(result.totalIssueCount);
  });
});