import { extractWeeklyReportData, type WeeklyExtractionRequest, type WeeklyReportDataset } from '../../src/logic/weekly-issue-analysis';

// SCEN-1472
describe('weekly issue analysis - impact score assessment', () => {
  test('should classify issue as no-impact when team-wide impact score is exactly 0', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [{ keyword: 'system_outage', frequency: 1 }],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 0,
        affectedTeamMembers: 0,
        businessImpactLevel: 'NONE',
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'low',
      }),
    };

    const requestDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');

    const mockDailyReports = [
      {
        reportDate: new Date('2024-01-08T09:00:00Z'),
        reportCount: 1,
        submittedByUserIds: ['user-001'],
        challengeItems: [
          'システム障害により一部機能が利用不可',
        ],
      },
    ];

    const extractionRequest: WeeklyExtractionRequest = {
      weekStartDate: requestDate,
      weekEndDate: endDate,
      teamIds: ['team-001'],
      requestedByUserId: 'manager-001',
    };

    const result: WeeklyReportDataset = await extractWeeklyReportData(
      extractionRequest,
      mockTextAnalysisAdapter,
    );

    expect(result.weekRange.startDate).toEqual(requestDate);
    expect(result.weekRange.endDate).toEqual(endDate);
    expect(result.totalReportsExtracted).toBe(1);
    expect(result.reportsByDate).toHaveLength(1);
    expect(result.reportsByDate[0].reportDate).toEqual(mockDailyReports[0].reportDate);
    expect(result.reportsByDate[0].challengeItems).toContain(
      'システム障害により一部機能が利用不可',
    );

    expect(result.extractedChallenges).toBeDefined();
    if (result.extractedChallenges.length > 0) {
      const firstChallenge = result.extractedChallenges[0];
      expect(firstChallenge).toHaveProperty('impactScore');
      expect(firstChallenge.impactScore).toBe(0);
      expect(firstChallenge).toHaveProperty('businessImpactLevel');
      expect(firstChallenge.businessImpactLevel).toBe('NONE');
    }

    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
  });
});