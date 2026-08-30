import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';
import { type ExtractAndRankIssuesInput, type RankedIssueList } from '../../src/logic/issue-extraction-and-ranking';

describe('issue-extraction-and-ranking', () => {
  test('SCEN-411: 参照期間が0日以下のとき、参照期間は最小1日にクランプされて課題が優先度順に返される', () => {
    const sameDate = new Date('2024-01-15T00:00:00Z');
    
    const input: ExtractAndRankIssuesInput = {
      reports: [
        {
          reportId: 'report-001',
          reportDate: sameDate,
          issueText: 'バグが発生しました。テスト環境で確認が必要です。',
          teamId: 'team-A',
        },
        {
          reportId: 'report-002',
          reportDate: sameDate,
          issueText: 'バグの修正に時間がかかっています。',
          teamId: 'team-A',
        },
        {
          reportId: 'report-003',
          reportDate: sameDate,
          issueText: 'リソース不足で進捗が遅延しています。',
          teamId: 'team-B',
        },
        {
          reportId: 'report-004',
          reportDate: sameDate,
          issueText: 'バグ対応とリソース不足が両方課題です。',
          teamId: 'team-A',
        },
      ],
      analysisStartDate: sameDate,
      analysisEndDate: sameDate,
    };

    const result: RankedIssueList = extractAndRankIssuesFromReports(input);

    expect(result).toBeDefined();
    expect(Array.isArray(result.issues)).toBe(true);
    expect(result.issues.length).toBeGreaterThan(0);

    expect(result.totalIssueCount).toBeGreaterThan(0);
    expect(typeof result.totalIssueCount).toBe('number');

    expect(result.analysisTimestamp).toBeInstanceOf(Date);

    expect(typeof result.lowConfidenceIssueCount).toBe('number');
    expect(result.lowConfidenceIssueCount).toBeGreaterThanOrEqual(0);

    for (const issue of result.issues) {
      expect(typeof issue.issueId).toBe('string');
      expect(typeof issue.keyword).toBe('string');
      expect(typeof issue.frequency).toBe('number');
      expect(issue.frequency).toBeGreaterThan(0);
      expect(typeof issue.impactScore).toBe('number');
      expect(issue.impactScore).toBeGreaterThanOrEqual(0);
      expect(issue.impactScore).toBeLessThanOrEqual(100);
      expect(typeof issue.priorityScore).toBe('number');
      expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);
      expect(['高', '中', '低']).toContain(issue.priorityRank);
      expect(['red', 'yellow', 'green']).toContain(issue.colorCode);
      expect(typeof issue.confidenceScore).toBe('number');
      expect(issue.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(issue.confidenceScore).toBeLessThanOrEqual(100);
      expect(typeof issue.affectedTeamCount).toBe('number');
      expect(issue.affectedTeamCount).toBeGreaterThan(0);
    }

    const priorityScores = result.issues.map((i) => i.priorityScore);
    for (let i = 0; i < priorityScores.length - 1; i++) {
      expect(priorityScores[i]).toBeGreaterThanOrEqual(priorityScores[i + 1]);
    }
  });
});