import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest, type WeeklyReportDataset } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Report Data Extraction with Impact Score Correction', () => {
  // SCEN-1473
  test('should correct negative impact score to minimum business value of 0', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'デバッグ', frequency: 2 },
        { keyword: 'ビルドエラー', frequency: 1 }
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(-1),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high')
    };

    const weekStartDate = new Date('2024-01-08T00:00:00Z');
    const weekEndDate = new Date('2024-01-14T23:59:59Z');

    const extractionRequest: WeeklyExtractionRequest = {
      weekStartDate,
      weekEndDate,
      teamIds: ['team-001'],
      requestedByUserId: 'user-manager-001'
    };

    const mockDailyReports = [
      {
        reportDate: new Date('2024-01-08T09:00:00Z'),
        reportCount: 3,
        submittedByUserIds: ['user-eng-001', 'user-eng-002', 'user-eng-003'],
        challengeItems: [
          'デバッグ時間が予想より長くなっている',
          'ビルドエラーが頻発している'
        ]
      },
      {
        reportDate: new Date('2024-01-09T09:00:00Z'),
        reportCount: 2,
        submittedByUserIds: ['user-eng-001', 'user-eng-002'],
        challengeItems: [
          'デバッグ環境のセットアップに課題がある'
        ]
      }
    ];

    const result: WeeklyReportDataset = await extractWeeklyReportData(
      extractionRequest,
      mockTextAnalysisServiceAdapter,
      mockDailyReports
    );

    expect(result.weekRange.startDate).toEqual(weekStartDate);
    expect(result.weekRange.endDate).toEqual(weekEndDate);
    expect(result.totalReportsExtracted).toBe(5);
    expect(result.reportsByDate).toHaveLength(2);

    expect(result.extractedChallenges).toBeDefined();
    expect(Array.isArray(result.extractedChallenges)).toBe(true);

    const extractedChallengesWithScores = result.extractedChallenges.filter(
      challenge => challenge.impactScore !== undefined
    );

    for (const challenge of extractedChallengesWithScores) {
      expect(challenge.impactScore).toBeGreaterThanOrEqual(0);
      expect(challenge.impactScore).toBe(0);
    }

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
  });
});