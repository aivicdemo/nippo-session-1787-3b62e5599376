import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import type { WeeklyAnalysisReportInput, WeeklyAnalysisReport, RankedIssue } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation', () => {
  // SCEN-1592: [edge] 週次課題傾向レポート生成機能 - 課題ランキングの優先度スコアが 99 点（最高値未満）で順序付けされる
  test('should generate ranked issues in descending order by priority score with stable sort for equal scores', async () => {
    const aggregationStartDate = '2024-01-01';
    const aggregationEndDate = '2024-01-07';
    const teamId = 'team-001';

    const extractedIssuesInput = [
      {
        keyword: 'issue-a',
        frequency: 5,
        impactScore: 99,
      },
      {
        keyword: 'issue-b',
        frequency: 4,
        impactScore: 95,
      },
      {
        keyword: 'issue-c',
        frequency: 3,
        impactScore: 88,
      },
      {
        keyword: 'issue-d',
        frequency: 5,
        impactScore: 99,
      },
    ];

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate,
      aggregationEndDate,
      extractedIssues: extractedIssuesInput,
      teamId,
    };

    const result: WeeklyAnalysisReport = await generateWeeklyAnalysisReport(input);

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');

    expect(result.aggregationPeriod).toEqual({
      startDate: aggregationStartDate,
      endDate: aggregationEndDate,
    });

    expect(result.issueRanking).toBeDefined();
    expect(Array.isArray(result.issueRanking)).toBe(true);
    expect(result.issueRanking.length).toBe(4);

    const ranking = result.issueRanking;

    expect(ranking[0].issueKeyword).toBe('issue-a');
    expect(ranking[0].occurrenceCount).toBe(5);
    expect(ranking[0].rank).toBe(1);

    expect(ranking[1].issueKeyword).toBe('issue-d');
    expect(ranking[1].occurrenceCount).toBe(5);
    expect(ranking[1].rank).toBe(2);

    expect(ranking[2].issueKeyword).toBe('issue-b');
    expect(ranking[2].occurrenceCount).toBe(4);
    expect(ranking[2].rank).toBe(3);

    expect(ranking[3].issueKeyword).toBe('issue-c');
    expect(ranking[3].occurrenceCount).toBe(3);
    expect(ranking[3].rank).toBe(4);

    expect(result.priorityScores).toBeDefined();
    expect(Array.isArray(result.priorityScores)).toBe(true);
    expect(result.priorityScores.length).toBe(4);

    const priorityScoreMap = new Map(
      result.priorityScores.map((ps) => [ps.issueId, ps])
    );

    const issueAPriority = priorityScoreMap.get('issue-a');
    expect(issueAPriority).toBeDefined();
    expect(issueAPriority?.priorityScore).toBe(99);
    expect(issueAPriority?.priorityRank).toBe('high');

    const issueDPriority = priorityScoreMap.get('issue-d');
    expect(issueDPriority).toBeDefined();
    expect(issueDPriority?.priorityScore).toBe(99);
    expect(issueDPriority?.priorityRank).toBe('high');

    const issueBPriority = priorityScoreMap.get('issue-b');
    expect(issueBPriority).toBeDefined();
    expect(issueBPriority?.priorityScore).toBe(95);
    expect(issueBPriority?.priorityRank).toBe('high');

    const issueCPriority = priorityScoreMap.get('issue-c');
    expect(issueCPriority).toBeDefined();
    expect(issueCPriority?.priorityScore).toBe(88);
    expect(issueCPriority?.priorityRank).toBe('medium');

    expect(result.recommendedCountermeasures).toBeDefined();
    expect(Array.isArray(result.recommendedCountermeasures)).toBe(true);

    expect(result.generatedAt).toBeDefined();
    const generatedDate = new Date(result.generatedAt);
    expect(generatedDate instanceof Date && !Number.isNaN(generatedDate.getTime())).toBe(true);

    const sortedByScore = ranking.sort(
      (a, b) => {
        const scoreA = result.priorityScores.find((ps) => ps.issueId === a.issueKeyword)?.priorityScore ?? 0;
        const scoreB = result.priorityScores.find((ps) => ps.issueId === b.issueKeyword)?.priorityScore ?? 0;
        return scoreB - scoreA;
      }
    );

    for (let i = 0; i < sortedByScore.length - 1; i++) {
      const currentScore = result.priorityScores.find(
        (ps) => ps.issueId === sortedByScore[i].issueKeyword
      )?.priorityScore ?? 0;
      const nextScore = result.priorityScores.find(
        (ps) => ps.issueId === sortedByScore[i + 1].issueKeyword
      )?.priorityScore ?? 0;
      expect(currentScore >= nextScore).toBe(true);
    }
  });
});