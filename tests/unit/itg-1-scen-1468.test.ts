import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest, type WeeklyReportDataset, type DailyReportSummary, type NormalizedChallenge } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis - extractWeeklyReportData', () => {
  // SCEN-1468: [edge] 前週日報データ集約・課題抽出機能 - チームメンバーが11名（10名超過）の場合、超過分は処理対象外として除外される
  test('should exclude 11th member when processing weekly reports for 10+ member teams', () => {
    const weekStartDate = new Date('2024-01-08T00:00:00Z');
    const weekEndDate = new Date('2024-01-14T23:59:59Z');
    
    const teamIds = ['team-001'];
    const requestedByUserId = 'user-manager-001';

    const mockDailyReportSummaries: DailyReportSummary[] = [
      {
        reportDate: new Date('2024-01-08T00:00:00Z'),
        reportCount: 11,
        submittedByUserIds: ['user_1', 'user_2', 'user_3', 'user_4', 'user_5', 'user_6', 'user_7', 'user_8', 'user_9', 'user_10', 'user_11'],
        challengeItems: [
          'API integration issue',
          'Database performance degradation',
          'API integration issue',
          'Memory leak in service',
          'Database performance degradation',
          'Deployment pipeline failure',
          'API integration issue',
          'Unit test coverage gap',
          'Memory leak in service',
          'Security vulnerability assessment',
          'Documentation incomplete'
        ]
      },
      {
        reportDate: new Date('2024-01-09T00:00:00Z'),
        reportCount: 11,
        submittedByUserIds: ['user_1', 'user_2', 'user_3', 'user_4', 'user_5', 'user_6', 'user_7', 'user_8', 'user_9', 'user_10', 'user_11'],
        challengeItems: [
          'API integration issue',
          'Database performance degradation',
          'API integration issue',
          'Memory leak in service',
          'Database performance degradation',
          'Deployment pipeline failure',
          'API integration issue',
          'Unit test coverage gap',
          'Memory leak in service',
          'Security vulnerability assessment',
          'Vendor dependency update pending'
        ]
      }
    ];

    const mockNormalizedChallenges: NormalizedChallenge[] = [
      { keyword: 'API integration issue', occurrenceCount: 6, impactScore: 85, normalizedForm: 'API integration issue' },
      { keyword: 'Database performance degradation', occurrenceCount: 4, impactScore: 78, normalizedForm: 'Database performance degradation' },
      { keyword: 'Memory leak in service', occurrenceCount: 4, impactScore: 80, normalizedForm: 'Memory leak in service' },
      { keyword: 'Unit test coverage gap', occurrenceCount: 2, impactScore: 60, normalizedForm: 'Unit test coverage gap' },
      { keyword: 'Deployment pipeline failure', occurrenceCount: 2, impactScore: 72, normalizedForm: 'Deployment pipeline failure' },
      { keyword: 'Security vulnerability assessment', occurrenceCount: 2, impactScore: 88, normalizedForm: 'Security vulnerability assessment' }
    ];

    const request: WeeklyExtractionRequest = {
      weekStartDate,
      weekEndDate,
      teamIds,
      requestedByUserId
    };

    const result: WeeklyReportDataset = extractWeeklyReportData(
      request,
      mockDailyReportSummaries,
      mockNormalizedChallenges
    );

    const totalSubmittedUserIds = new Set<string>();
    result.reportsByDate.forEach(dailySummary => {
      dailySummary.submittedByUserIds.forEach(userId => {
        totalSubmittedUserIds.add(userId);
      });
    });

    expect(result.totalReportsExtracted).toBe(22);
    expect(result.reportsByDate).toHaveLength(2);
    expect(result.reportsByDate[0].reportCount).toBe(11);
    expect(result.reportsByDate[1].reportCount).toBe(11);
    
    expect(totalSubmittedUserIds.size).toBe(10);
    expect(totalSubmittedUserIds.has('user_1')).toBe(true);
    expect(totalSubmittedUserIds.has('user_10')).toBe(true);
    expect(totalSubmittedUserIds.has('user_11')).toBe(false);

    expect(result.extractedChallenges).toHaveLength(6);
    
    const apiIntegrationChallenge = result.extractedChallenges.find(c => c.keyword === 'API integration issue');
    expect(apiIntegrationChallenge).toBeDefined();
    expect(apiIntegrationChallenge?.occurrenceCount).toBe(6);
    expect(apiIntegrationChallenge?.impactScore).toBe(85);

    const databasePerformanceChallenge = result.extractedChallenges.find(c => c.keyword === 'Database performance degradation');
    expect(databasePerformanceChallenge).toBeDefined();
    expect(databasePerformanceChallenge?.occurrenceCount).toBe(4);

    const securityChallenge = result.extractedChallenges.find(c => c.keyword === 'Security vulnerability assessment');
    expect(securityChallenge).toBeDefined();
    expect(securityChallenge?.impactScore).toBe(88);

    const notIncludedKeywords = result.reportsByDate
      .flatMap(dailySummary => dailySummary.challengeItems)
      .filter(item => item === 'Documentation incomplete' || item === 'Vendor dependency update pending');
    
    expect(notIncludedKeywords.length).toBe(0);

    expect(result.weekRange.startDate).toEqual(weekStartDate);
    expect(result.weekRange.endDate).toEqual(weekEndDate);
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
  });
});