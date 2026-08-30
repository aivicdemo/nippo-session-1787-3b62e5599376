import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';
import type {
  ExtractAndRankIssuesInput,
  RankedIssueList,
  Report,
} from '../../src/logic/issue-extraction-and-ranking';

jest.mock('../../src/logic/issue-extraction-and-ranking', () => ({
  extractAndRankIssuesFromReports: jest.fn(),
  extractKeywordsFromReportText: jest.fn(),
  normalizeAndDeduplicateIssues: jest.fn(),
  calculateIssueFrequencyRanking: jest.fn(),
  combineFrequencyAndImpactForPriority: jest.fn(),
  applyPriorityColorCoding: jest.fn(),
  calculatePriorityScoreForIssue: jest.fn(),
}));

describe('朝会報告管理システム - 課題抽出・優先度ランク付け', () => {
  // SCEN-205
  test('複数の日報から課題キーワードを自動抽出し、発生頻度と影響度に基づいて優先度スコアを計算して、優先度別に順序付けされた課題一覧を生成する', () => {
    const analysisStartDate = new Date('2024-01-01T00:00:00Z');
    const analysisEndDate = new Date('2024-02-01T00:00:00Z');
    const processingTimestamp = new Date('2024-02-01T12:00:00Z');

    const reports: Report[] = Array.from({ length: 10 }, (_, i) => ({
      reportId: `report-${i + 1}`,
      reportDate: analysisEndDate,
      issueText:
        i < 8
          ? 'バグが発生しています。遅延も懸念されます。'
          : i < 9
            ? 'リソース不足により対応が遅れています。'
            : 'リソース不足の影響でバグ修正が進みません。',
      teamId: `team-${Math.floor(i / 2) + 1}`,
    }));

    const input: ExtractAndRankIssuesInput = {
      reports,
      analysisStartDate,
      analysisEndDate,
      teamIds: undefined,
      minimumConfidenceThreshold: 50,
    };

    const expectedRankedIssueList: RankedIssueList = {
      issues: [
        {
          issueId: 'issue-001',
          keyword: 'バグ',
          frequency: 30,
          impactScore: 80,
          priorityScore: 85,
          priorityRank: '高',
          colorCode: 'red',
          confidenceScore: 95,
          affectedTeamCount: 8,
        },
        {
          issueId: 'issue-002',
          keyword: '遅延',
          frequency: 20,
          impactScore: 60,
          priorityScore: 70,
          priorityRank: '中',
          colorCode: 'yellow',
          confidenceScore: 92,
          affectedTeamCount: 6,
        },
        {
          issueId: 'issue-003',
          keyword: 'リソース不足',
          frequency: 10,
          impactScore: 40,
          priorityScore: 52,
          priorityRank: '低',
          colorCode: 'green',
          confidenceScore: 88,
          affectedTeamCount: 4,
        },
      ],
      totalIssueCount: 3,
      analysisTimestamp: processingTimestamp,
      lowConfidenceIssueCount: 0,
    };

    (extractAndRankIssuesFromReports as jest.Mock).mockReturnValue(
      expectedRankedIssueList
    );

    const result = extractAndRankIssuesFromReports(input);

    expect(result).toEqual(expectedRankedIssueList);
    expect(result.issues).toHaveLength(3);
    expect(result.issues[0].keyword).toBe('バグ');
    expect(result.issues[0].frequency).toBe(30);
    expect(result.issues[0].impactScore).toBe(80);
    expect(result.issues[0].priorityScore).toBe(85);
    expect(result.issues[0].priorityRank).toBe('高');
    expect(result.issues[0].colorCode).toBe('red');
    expect(result.issues[0].affectedTeamCount).toBe(8);
    expect(result.issues[1].keyword).toBe('遅延');
    expect(result.issues[1].frequency).toBe(20);
    expect(result.issues[1].impactScore).toBe(60);
    expect(result.issues[1].priorityScore).toBe(70);
    expect(result.issues[1].priorityRank).toBe('中');
    expect(result.issues[1].colorCode).toBe('yellow');
    expect(result.issues[1].affectedTeamCount).toBe(6);
    expect(result.issues[2].keyword).toBe('リソース不足');
    expect(result.issues[2].frequency).toBe(10);
    expect(result.issues[2].impactScore).toBe(40);
    expect(result.issues[2].priorityScore).toBe(52);
    expect(result.issues[2].priorityRank).toBe('低');
    expect(result.issues[2].colorCode).toBe('green');
    expect(result.issues[2].affectedTeamCount).toBe(4);
    expect(result.totalIssueCount).toBe(3);
    expect(result.lowConfidenceIssueCount).toBe(0);
    expect(result.analysisTimestamp).toEqual(processingTimestamp);
  });
});