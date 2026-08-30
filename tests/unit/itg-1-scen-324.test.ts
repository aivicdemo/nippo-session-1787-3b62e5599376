import { extractAndRankIssuesFromReports, type ExtractAndRankIssuesInput, type RankedIssueList } from '../../src/logic/issue-extraction-and-ranking';

describe('extractAndRankIssuesFromReports', () => {
  // SCEN-324
  test('should extract keywords from multiple reports, calculate priority scores based on frequency and impact, and return ranked issues in priority order', () => {
    const input: ExtractAndRankIssuesInput = {
      reports: [
        {
          reportId: 'R001',
          reportDate: new Date('2025-01-15'),
          issueText: 'データベース接続タイムアウトが発生',
          teamId: 'T001',
        },
        {
          reportId: 'R002',
          reportDate: new Date('2025-01-15'),
          issueText: 'データベース接続エラーで処理が中断',
          teamId: 'T001',
        },
        {
          reportId: 'R003',
          reportDate: new Date('2025-01-15'),
          issueText: 'APIレスポンス遅延が続いている',
          teamId: 'T001',
        },
        {
          reportId: 'R004',
          reportDate: new Date('2025-01-15'),
          issueText: 'サーバーメモリ不足の警告が出た',
          teamId: 'T001',
        },
        {
          reportId: 'R005',
          reportDate: new Date('2025-01-15'),
          issueText: '特に課題なし',
          teamId: 'T001',
        },
      ],
      analysisStartDate: new Date('2025-01-15'),
      analysisEndDate: new Date('2025-01-15'),
      teamIds: undefined,
      minimumConfidenceThreshold: 50,
    };

    const result: RankedIssueList = extractAndRankIssuesFromReports(input);

    expect(result.issues).toHaveLength(3);
    expect(result.totalIssueCount).toBe(3);
    expect(result.lowConfidenceIssueCount).toBe(0);
    expect(result.analysisTimestamp).toBeInstanceOf(Date);

    expect(result.issues[0]).toEqual({
      issueId: expect.any(String),
      keyword: 'データベース接続',
      frequency: 2,
      impactScore: 20,
      priorityScore: 72,
      priorityRank: 'high',
      colorCode: 'red',
      confidenceScore: expect.any(Number),
      affectedTeamCount: 1,
    });

    expect(result.issues[1]).toEqual({
      issueId: expect.any(String),
      keyword: 'API',
      frequency: 1,
      impactScore: 10,
      priorityScore: 46,
      priorityRank: 'medium',
      colorCode: 'yellow',
      confidenceScore: expect.any(Number),
      affectedTeamCount: 1,
    });

    expect(result.issues[2]).toEqual({
      issueId: expect.any(String),
      keyword: 'サーバー',
      frequency: 1,
      impactScore: 10,
      priorityScore: 46,
      priorityRank: 'medium',
      colorCode: 'yellow',
      confidenceScore: expect.any(Number),
      affectedTeamCount: 1,
    });

    expect(result.issues[0].priorityScore).toBeGreaterThan(result.issues[1].priorityScore);
  });
});