import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向分析フロー - 日報件数が最小閾値に等しい場合', () => {
  // SCEN-1695: [edge] 週次課題傾向分析フロー - 分析対象日報件数がちょうど最小閾値に等しい場合、分析を実行する
  test('日報件数が最小閾値と同じ場合、分析が正常に実行され全メソッドが呼ばれて結果が保存される', () => {
    // Arrange
    const minimumReportThreshold = 5;
    const analysisStartDate = new Date('2024-01-08T00:00:00Z');
    const analysisEndDate = new Date('2024-01-14T23:59:59Z');
    const teamIds = ['team-001', 'team-002'];

    const mockExtractedKeywords = [
      { keyword: 'デプロイ失敗', frequency: 3 },
      { keyword: 'パフォーマンス低下', frequency: 2 },
    ];

    const mockImpactScores = [
      { keyword: 'デプロイ失敗', impactScore: 85 },
      { keyword: 'パフォーマンス低下', impactScore: 72 },
    ];

    const mockSeverityClassification = [
      { keyword: 'デプロイ失敗', severity: 'high' as const },
      { keyword: 'パフォーマンス低下', severity: 'medium' as const },
    ];

    let extractKeywordsCallCount = 0;
    let assessImpactScoreCallCount = 0;
    let classifyIssueSeverityCallCount = 0;

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn((_reportTexts: string[]) => {
        extractKeywordsCallCount++;
        return mockExtractedKeywords;
      }),
      assessImpactScore: jest.fn((_keywords: string[]) => {
        assessImpactScoreCallCount++;
        return mockImpactScores;
      }),
      classifyIssueSeverity: jest.fn((_keywords: string[]) => {
        classifyIssueSeverityCallCount++;
        return mockSeverityClassification;
      }),
    };

    const dailyReports = [
      {
        reportDate: new Date('2024-01-08T00:00:00Z'),
        reportCount: 1,
        submittedByUserIds: ['user-001'],
        challengeItems: ['デプロイ失敗に対応'],
      },
      {
        reportDate: new Date('2024-01-09T00:00:00Z'),
        reportCount: 1,
        submittedByUserIds: ['user-002'],
        challengeItems: ['パフォーマンス低下が発生'],
      },
      {
        reportDate: new Date('2024-01-10T00:00:00Z'),
        reportCount: 1,
        submittedByUserIds: ['user-003'],
        challengeItems: ['デプロイ失敗とパフォーマンス低下'],
      },
      {
        reportDate: new Date('2024-01-11T00:00:00Z'),
        reportCount: 1,
        submittedByUserIds: ['user-004'],
        challengeItems: ['デプロイ失敗の対応中'],
      },
      {
        reportDate: new Date('2024-01-12T00:00:00Z'),
        reportCount: 1,
        submittedByUserIds: ['user-005'],
        challengeItems: ['パフォーマンス最適化必要'],
      },
    ];

    const weeklyExtractionRequest = {
      weekStartDate: analysisStartDate,
      weekEndDate: analysisEndDate,
      teamIds: teamIds,
      requestedByUserId: 'manager-001',
    };

    // Act
    const result = extractWeeklyReportData(
      weeklyExtractionRequest,
      mockTextAnalysisServiceAdapter
    );

    // Assert
    expect(extractKeywordsCallCount).toBe(1);
    expect(assessImpactScoreCallCount).toBe(1);
    expect(classifyIssueSeverityCallCount).toBe(1);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalled();

    expect(result).toBeDefined();
    expect(result.weekRange.startDate).toEqual(analysisStartDate);
    expect(result.weekRange.endDate).toEqual(analysisEndDate);
    expect(result.totalReportsExtracted).toBe(5);
    expect(result.reportsByDate).toHaveLength(5);
    expect(result.extractedChallenges).toBeDefined();
    expect(Array.isArray(result.extractedChallenges)).toBe(true);
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
  });
});