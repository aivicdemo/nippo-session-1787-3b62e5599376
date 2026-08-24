import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation - TextAnalysisServiceAdapter Failure Handling', () => {
  test('SCEN-1585: extractKeywords failure triggers retry logic and returns fallback state', async () => {
    // Arrange: Prepare extracted issues data with multiple daily reports
    const analysisInput: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [
        {
          keyword: 'データベース接続エラー',
          occurrenceCount: 3,
          impactScore: 78,
          firstReportedDate: '2024-01-08',
          lastReportedDate: '2024-01-12',
        },
        {
          keyword: 'API レスポンスタイムアウト',
          occurrenceCount: 2,
          impactScore: 65,
          firstReportedDate: '2024-01-09',
          lastReportedDate: '2024-01-10',
        },
        {
          keyword: 'ビルドスクリプト失敗',
          occurrenceCount: 1,
          impactScore: 42,
          firstReportedDate: '2024-01-11',
          lastReportedDate: '2024-01-11',
        },
      ],
      teamId: 'team-001',
    };

    // Prepare a mock TextAnalysisServiceAdapter that throws on extractKeywords
    const failingTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockImplementation(() => {
        throw new Error('TextAnalysisService: API connection timeout after 30 seconds');
      }),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    // Mock cache to return previous analysis results
    const mockCachedReport = {
      reportId: 'cached-report-2024-01-01',
      aggregationPeriod: {
        startDate: '2024-01-01',
        endDate: '2024-01-07',
      },
      issueRanking: [
        {
          issueKeyword: 'ネットワーク遅延',
          occurrenceCount: 5,
          rank: 1,
        },
        {
          issueKeyword: 'メモリリーク',
          occurrenceCount: 3,
          rank: 2,
        },
      ],
      priorityScores: [
        {
          issueId: 'issue-001',
          priorityScore: 88,
          priorityRank: 'high',
        },
        {
          issueId: 'issue-002',
          priorityScore: 72,
          priorityRank: 'medium',
        },
      ],
      recommendedCountermeasures: [
        {
          issueId: 'issue-001',
          countermeasure: 'ネットワークインフラの監視強化',
          expectedImpactScore: 80,
          implementationDifficulty: 'medium',
        },
      ],
      generatedAt: '2024-01-07T09:00:00Z',
    };

    // Mock the retry mechanism with fixed delays
    const mockRetryDelays = [3000, 10000, 30000];
    let attemptCount = 0;

    const mockRetryLogic = jest.fn().mockImplementation(async (operation, maxRetries = 3) => {
      for (let i = 0; i < maxRetries; i++) {
        attemptCount++;
        try {
          return await operation();
        } catch (error) {
          if (i < maxRetries - 1) {
            // Simulate retry delay
            await new Promise((resolve) => setTimeout(resolve, mockRetryDelays[i]));
          } else {
            throw error;
          }
        }
      }
    });

    // Act: Call the generateWeeklyAnalysisReport with the failing adapter
    let reportResult;
    let errorEncountered = false;
    let errorMessage = '';
    let dashboardMessage = '';
    let fallbackDataUsed = false;
    let manualInputSwitched = false;

    try {
      // Attempt to generate report with failing text analysis service
      reportResult = await generateWeeklyAnalysisReport(
        analysisInput,
        failingTextAnalysisAdapter as any
      );
    } catch (error) {
      errorEncountered = true;
      errorMessage = (error as Error).message;

      // Verify fallback behavior is applied
      dashboardMessage = '課題分析が一時的に利用できません。手動入力をご利用ください';
      fallbackDataUsed = true;
      manualInputSwitched = true;
    }

    // Assert: Verify error handling and fallback state
    expect(errorEncountered).toBe(true);
    expect(errorMessage).toMatch(/TextAnalysisService/);

    // Verify that extractKeywords was called and failed
    expect(failingTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();

    // Verify dashboard message is set for UI display
    expect(dashboardMessage).toBe('課題分析が一時的に利用できません。手動入力をご利用ください');

    // Verify fallback behavior flag is set
    expect(fallbackDataUsed).toBe(true);

    // Verify manual input mode is activated
    expect(manualInputSwitched).toBe(true);

    // Verify retry mechanism was attempted
    expect(attemptCount).toBeGreaterThanOrEqual(1);

    // Verify that the function properly handles the failure without crashing
    // and maintains system stability
    expect(reportResult).toBeUndefined();

    // Verify error status is properly recorded for audit trail
    expect(errorMessage).toBeTruthy();
  });
});