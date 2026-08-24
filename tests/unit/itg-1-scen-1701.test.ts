import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向分析 - 月末月初境界データ集約', () => {
  // SCEN-1701
  test('月末から月初にまたがる期間で両月のデータを正しく集約する', () => {
    const weekStartDate = new Date('2024-11-28T00:00:00Z');
    const weekEndDate = new Date('2024-12-02T23:59:59Z');
    const teamIds = ['team-001'];
    const requestedByUserId = 'user-001';

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        if (text.includes('ネットワーク遅延')) {
          return {
            keywords: ['ネットワーク遅延'],
            frequencies: { 'ネットワーク遅延': 3 }
          };
        }
        if (text.includes('メモリリーク')) {
          return {
            keywords: ['メモリリーク'],
            frequencies: { 'メモリリーク': 2 }
          };
        }
        return { keywords: [], frequencies: {} };
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        if (keyword === 'ネットワーク遅延') return 45;
        if (keyword === 'メモリリーク') return 62;
        return 0;
      }),
      classifyIssueSeverity: jest.fn((text: string) => {
        if (text.includes('ネットワーク遅延')) return 'medium';
        if (text.includes('メモリリーク')) return 'high';
        return 'low';
      })
    };

    const mockDailyReports = [
      {
        reportDate: new Date('2024-11-28T00:00:00Z'),
        reportCount: 1,
        submittedByUserIds: ['user-002'],
        challengeItems: ['ネットワーク遅延の問題が発生した']
      },
      {
        reportDate: new Date('2024-11-29T00:00:00Z'),
        reportCount: 1,
        submittedByUserIds: ['user-003'],
        challengeItems: ['ネットワーク遅延により配信が遅延']
      },
      {
        reportDate: new Date('2024-11-30T00:00:00Z'),
        reportCount: 1,
        submittedByUserIds: ['user-004'],
        challengeItems: ['ネットワーク遅延の影響で接続不可']
      },
      {
        reportDate: new Date('2024-12-01T00:00:00Z'),
        reportCount: 1,
        submittedByUserIds: ['user-005'],
        challengeItems: ['メモリリークが発生している']
      },
      {
        reportDate: new Date('2024-12-02T00:00:00Z'),
        reportCount: 1,
        submittedByUserIds: ['user-006'],
        challengeItems: ['メモリリークの問題を検出']
      }
    ];

    const result = extractWeeklyReportData(
      {
        weekStartDate,
        weekEndDate,
        teamIds,
        requestedByUserId
      },
      mockTextAnalysisAdapter,
      mockDailyReports
    );

    expect(result.weekRange.startDate).toEqual(weekStartDate);
    expect(result.weekRange.endDate).toEqual(weekEndDate);
    expect(result.totalReportsExtracted).toBe(5);
    expect(result.reportsByDate).toHaveLength(5);

    const novemberReports = result.reportsByDate.filter(
      r => r.reportDate.getMonth() === 10
    );
    const decemberReports = result.reportsByDate.filter(
      r => r.reportDate.getMonth() === 11
    );

    expect(novemberReports).toHaveLength(3);
    expect(decemberReports).toHaveLength(2);

    const extractedChallenges = result.extractedChallenges;
    expect(extractedChallenges).toHaveLength(2);

    const networkDelayChallenge = extractedChallenges.find(
      c => c.keyword === 'ネットワーク遅延'
    );
    const memoryLeakChallenge = extractedChallenges.find(
      c => c.keyword === 'メモリリーク'
    );

    expect(networkDelayChallenge).toBeDefined();
    expect(networkDelayChallenge?.occurrenceCount).toBe(3);
    expect(networkDelayChallenge?.impactScore).toBe(45);
    expect(networkDelayChallenge?.severity).toBe('medium');

    expect(memoryLeakChallenge).toBeDefined();
    expect(memoryLeakChallenge?.occurrenceCount).toBe(2);
    expect(memoryLeakChallenge?.impactScore).toBe(62);
    expect(memoryLeakChallenge?.severity).toBe('high');

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledWith('ネットワーク遅延');
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledWith('メモリリーク');
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).toHaveBeenCalled();
  });
});