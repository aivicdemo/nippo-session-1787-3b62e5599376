import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向レポート生成機能', () => {
  // SCEN-1590: [edge] 優先度スコアが丁度 0 点（最低値）で順序付けされる
  test('優先度スコア 0 点の課題が最下位にランキングされ、スコア 45 点の課題が上位に表示される', () => {
    const analysisStartDate = '2024-01-08';
    const analysisEndDate = '2024-01-14';
    const teamId = 'team-alpha-001';

    const extractedIssuesData = [
      {
        issueKeyword: '課題A',
        occurrenceCount: 2,
        impactScore: 0,
      },
      {
        issueKeyword: '課題B',
        occurrenceCount: 1,
        impactScore: 0,
      },
      {
        issueKeyword: '課題C',
        occurrenceCount: 3,
        impactScore: 0,
      },
      {
        issueKeyword: '課題D',
        occurrenceCount: 5,
        impactScore: 45,
      },
    ];

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: extractedIssuesData.map((issue) => ({
          keyword: issue.issueKeyword,
          frequency: issue.occurrenceCount,
        })),
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        const issue = extractedIssuesData.find((i) => i.issueKeyword === keyword);
        return Promise.resolve(issue?.impactScore ?? 0);
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: analysisStartDate,
      aggregationEndDate: analysisEndDate,
      extractedIssues: extractedIssuesData,
      teamId: teamId,
    };

    const result = generateWeeklyAnalysisReport(input, mockTextAnalysisAdapter);

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(result.aggregationPeriod.startDate).toBe(analysisStartDate);
    expect(result.aggregationPeriod.endDate).toBe(analysisEndDate);

    expect(result.issueRanking).toBeDefined();
    expect(result.issueRanking.length).toBeGreaterThanOrEqual(4);

    const rankedByScore = result.issueRanking.sort((a, b) => b.rank - a.rank);
    const lowestScoreRanked = rankedByScore.filter(
      (ranked) => ranked.issueKeyword === '課題A' || 
                  ranked.issueKeyword === '課題B' || 
                  ranked.issueKeyword === '課題C'
    );
    const highestScoreRanked = rankedByScore.find((ranked) => ranked.issueKeyword === '課題D');

    expect(lowestScoreRanked.length).toBe(3);
    expect(highestScoreRanked).toBeDefined();

    const lowestRankPosition = Math.max(...lowestScoreRanked.map((i) => i.rank));
    const highestRankPosition = highestScoreRanked!.rank;

    expect(lowestRankPosition).toBeGreaterThan(highestRankPosition);

    expect(result.priorityScores).toBeDefined();
    expect(result.priorityScores.length).toBeGreaterThanOrEqual(4);

    const zeroScorePriorities = result.priorityScores.filter((p) => p.priorityScore === 0);
    const nonZeroScorePriorities = result.priorityScores.filter((p) => p.priorityScore > 0);

    expect(zeroScorePriorities.length).toBe(3);
    expect(nonZeroScorePriorities.length).toBeGreaterThanOrEqual(1);

    zeroScorePriorities.forEach((priority) => {
      expect(priority.priorityRank).toBe('low');
    });

    const priorityWith45Score = result.priorityScores.find((p) => p.priorityScore === 45);
    expect(priorityWith45Score).toBeDefined();
    expect(priorityWith45Score!.priorityRank).not.toBe('low');

    expect(result.recommendedCountermeasures).toBeDefined();
    expect(Array.isArray(result.recommendedCountermeasures)).toBe(true);

    expect(result.generatedAt).toBeDefined();
    const generatedAtDate = new Date(result.generatedAt);
    expect(generatedAtDate).toBeInstanceOf(Date);
    expect(isNaN(generatedAtDate.getTime())).toBe(false);
  });
});