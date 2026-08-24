import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation', () => {
  // SCEN-1668: [normal] 週次課題傾向分析レポート生成 - 前週の日報が1件で最小閾値以上と判定される
  test('should generate weekly analysis report with single report and impact score above minimum threshold', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          {
            keyword: 'データベース接続エラー',
            frequency: 1,
            confidence: 0.95
          }
        ],
        totalOccurrences: 1
      }),
      assessImpactScore: jest.fn().mockReturnValue({
        issueId: 'issue-001',
        impactScore: 75,
        affectedTeamMembers: 3,
        businessImpact: 'high'
      }),
      classifyIssueSeverity: jest.fn().mockReturnValue({
        severity: 'medium'
      })
    };

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [
        {
          issueKeyword: 'データベース接続エラー',
          occurrenceFrequency: 1,
          impactScore: 75,
          teamId: 'team-001'
        }
      ],
      teamId: 'team-001'
    };

    const result: WeeklyAnalysisReport = generateWeeklyAnalysisReport(
      input,
      mockTextAnalysisAdapter
    );

    expect(result.reportId).toBeDefined();
    expect(result.reportId).toMatch(/^report-/);

    expect(result.aggregationPeriod.startDate).toBe('2024-01-08');
    expect(result.aggregationPeriod.endDate).toBe('2024-01-14');

    expect(result.issueRanking).toHaveLength(1);
    expect(result.issueRanking[0].issueKeyword).toBe('データベース接続エラー');
    expect(result.issueRanking[0].occurrenceCount).toBe(1);
    expect(result.issueRanking[0].rank).toBe(1);

    expect(result.priorityScores).toHaveLength(1);
    expect(result.priorityScores[0].issueId).toBe('issue-001');
    expect(result.priorityScores[0].priorityScore).toBe(75);
    expect(result.priorityScores[0].priorityRank).toBe('high');

    expect(result.recommendedCountermeasures).toBeDefined();
    expect(Array.isArray(result.recommendedCountermeasures)).toBe(true);

    expect(result.generatedAt).toBeDefined();
    const generatedDate = new Date(result.generatedAt);
    expect(generatedDate.getTime()).toBeGreaterThan(0);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        aggregationStartDate: '2024-01-08',
        aggregationEndDate: '2024-01-14'
      })
    );

    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: 'データベース接続エラー',
        teamId: 'team-001'
      })
    );
  });
});