import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type TextAnalysisServiceAdapter } from '../../src/adapters/text-analysis-service-adapter';

describe('Weekly Issue Analysis - Extract Weekly Report Data', () => {
  // SCEN-1445
  test('should return identical structured challenge data on idempotent executions with same input dataset', async () => {
    const weekStartDate = new Date('2024-01-08T00:00:00Z');
    const weekEndDate = new Date('2024-01-14T23:59:59Z');
    const teamIds = ['team-001', 'team-002'];
    const requestedByUserId = 'user-manager-001';

    const mockTextAnalysisAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'API_TIMEOUT', frequency: 3 },
          { keyword: 'DATABASE_LOCK', frequency: 2 },
          { keyword: 'DEPLOYMENT_DELAY', frequency: 2 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 78,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    const inputDataset = {
      weekRange: {
        startDate: weekStartDate,
        endDate: weekEndDate,
      },
      reports: [
        {
          reportDate: new Date('2024-01-08T09:00:00Z'),
          submittedByUserId: 'eng-001',
          yesterday: 'Fixed authentication module',
          today: 'Implement API gateway',
          challenges: 'API timeout under high load, database lock issues',
        },
        {
          reportDate: new Date('2024-01-08T09:15:00Z'),
          submittedByUserId: 'eng-002',
          yesterday: 'Code review',
          today: 'Deploy to staging',
          challenges: 'API timeout, deployment delay expected',
        },
        {
          reportDate: new Date('2024-01-09T09:00:00Z'),
          submittedByUserId: 'eng-001',
          yesterday: 'Implement API gateway',
          today: 'Testing and optimization',
          challenges: 'Database lock persists',
        },
      ],
    };

    const firstExecutionResult = await extractWeeklyReportData(
      {
        weekStartDate,
        weekEndDate,
        teamIds,
        requestedByUserId,
      },
      mockTextAnalysisAdapter,
      inputDataset,
    );

    const secondExecutionResult = await extractWeeklyReportData(
      {
        weekStartDate,
        weekEndDate,
        teamIds,
        requestedByUserId,
      },
      mockTextAnalysisAdapter,
      inputDataset,
    );

    expect(firstExecutionResult.weekRange.startDate).toEqual(weekStartDate);
    expect(firstExecutionResult.weekRange.endDate).toEqual(weekEndDate);
    expect(firstExecutionResult.totalReportsExtracted).toBe(3);

    expect(firstExecutionResult.reportsByDate).toHaveLength(
      secondExecutionResult.reportsByDate.length,
    );

    firstExecutionResult.reportsByDate.forEach((dailySummary, index) => {
      expect(dailySummary.reportDate).toEqual(
        secondExecutionResult.reportsByDate[index].reportDate,
      );
      expect(dailySummary.reportCount).toBe(
        secondExecutionResult.reportsByDate[index].reportCount,
      );
      expect(dailySummary.submittedByUserIds).toEqual(
        secondExecutionResult.reportsByDate[index].submittedByUserIds,
      );
      expect(dailySummary.challengeItems).toEqual(
        secondExecutionResult.reportsByDate[index].challengeItems,
      );
    });

    expect(firstExecutionResult.extractedChallenges).toHaveLength(
      secondExecutionResult.extractedChallenges.length,
    );

    firstExecutionResult.extractedChallenges.forEach((challenge, index) => {
      const secondChallenge = secondExecutionResult.extractedChallenges[index];
      expect(challenge.keyword).toBe(secondChallenge.keyword);
      expect(challenge.frequency).toBe(secondChallenge.frequency);
      expect(challenge.impactScore).toBe(secondChallenge.impactScore);
      expect(challenge.severity).toBe(secondChallenge.severity);
    });

    expect(firstExecutionResult.dataQualityScore).toBe(
      secondExecutionResult.dataQualityScore,
    );

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).toHaveBeenCalled();
  });
});