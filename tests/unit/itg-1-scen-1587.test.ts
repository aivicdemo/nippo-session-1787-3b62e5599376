import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向レポート生成機能', () => {
  // SCEN-1587
  test('[edge] 週次課題傾向レポート生成機能 - 集計期間が丁度 7 日間（月曜～日曜）でレポート生成される', () => {
    const aggregationStartDate = '2024-01-01';
    const aggregationEndDate = '2024-01-07';
    const teamId = 'team-001';

    const extractedIssueData = [
      {
        keyword: 'デプロイ障害',
        occurrenceFrequency: 3,
        impactScore: 85,
      },
      {
        keyword: 'テストコード不足',
        occurrenceFrequency: 4,
        impactScore: 65,
      },
      {
        keyword: 'ドキュメント未更新',
        occurrenceFrequency: 2,
        impactScore: 45,
      },
      {
        keyword: 'コードレビュー遅延',
        occurrenceFrequency: 1,
        impactScore: 55,
      },
    ];

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: extractedIssueData.map((issue) => ({
          keyword: issue.keyword,
          frequency: issue.occurrenceFrequency,
        })),
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        const issue = extractedIssueData.find((i) => i.keyword === keyword);
        return issue ? issue.impactScore : 0;
      }),
      classifyIssueSeverity: jest.fn((keyword: string) => {
        const issue = extractedIssueData.find((i) => i.keyword === keyword);
        if (!issue) return 'low';
        if (issue.impactScore >= 80) return 'high';
        if (issue.impactScore >= 60) return 'medium';
        return 'low';
      }),
    };

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate,
      aggregationEndDate,
      extractedIssues: extractedIssueData,
      teamId,
    };

    const result: WeeklyAnalysisReport = generateWeeklyAnalysisReport(
      input,
      mockTextAnalysisAdapter,
    );

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(result.reportId).toMatch(/^report-/);

    expect(result.aggregationPeriod).toBeDefined();
    expect(result.aggregationPeriod.startDate).toBe('2024-01-01');
    expect(result.aggregationPeriod.endDate).toBe('2024-01-07');

    expect(result.issueRanking).toBeDefined();
    expect(result.issueRanking.length).toBe(4);

    const rankedByFrequency = result.issueRanking.sort(
      (a, b) => b.occurrenceCount - a.occurrenceCount,
    );
    expect(rankedByFrequency[0].issueKeyword).toBe('テストコード不足');
    expect(rankedByFrequency[0].occurrenceCount).toBe(4);
    expect(rankedByFrequency[0].rank).toBe(1);

    expect(rankedByFrequency[1].issueKeyword).toBe('デプロイ障害');
    expect(rankedByFrequency[1].occurrenceCount).toBe(3);
    expect(rankedByFrequency[1].rank).toBe(2);

    expect(rankedByFrequency[2].issueKeyword).toBe('ドキュメント未更新');
    expect(rankedByFrequency[2].occurrenceCount).toBe(2);
    expect(rankedByFrequency[2].rank).toBe(3);

    expect(rankedByFrequency[3].issueKeyword).toBe('コードレビュー遅延');
    expect(rankedByFrequency[3].occurrenceCount).toBe(1);
    expect(rankedByFrequency[3].rank).toBe(4);

    expect(result.priorityScores).toBeDefined();
    expect(result.priorityScores.length).toBe(4);

    const deplyIssue = result.priorityScores.find(
      (ps) => ps.issueId === 'issue-デプロイ障害',
    );
    expect(deplyIssue).toBeDefined();
    expect(deplyIssue?.priorityScore).toBe(85);
    expect(deplyIssue?.priorityRank).toBe('high');

    const testIssue = result.priorityScores.find(
      (ps) => ps.issueId === 'issue-テストコード不足',
    );
    expect(testIssue).toBeDefined();
    expect(testIssue?.priorityScore).toBe(65);
    expect(testIssue?.priorityRank).toBe('medium');

    const docIssue = result.priorityScores.find(
      (ps) => ps.issueId === 'issue-ドキュメント未更新',
    );
    expect(docIssue).toBeDefined();
    expect(docIssue?.priorityScore).toBe(45);
    expect(docIssue?.priorityRank).toBe('low');

    const reviewIssue = result.priorityScores.find(
      (ps) => ps.issueId === 'issue-コードレビュー遅延',
    );
    expect(reviewIssue).toBeDefined();
    expect(reviewIssue?.priorityScore).toBe(55);
    expect(reviewIssue?.priorityRank).toBe('medium');

    expect(result.recommendedCountermeasures).toBeDefined();
    expect(result.recommendedCountermeasures.length).toBeGreaterThan(0);

    expect(result.generatedAt).toBeDefined();
    expect(result.generatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
    );

    const generatedDate = new Date(result.generatedAt);
    expect(generatedDate.getTime()).toBeGreaterThan(0);
  });
});