import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('ensureDashboardDataFreshness', () => {
  // SCEN-2108
  test('should retain analysis results within retention period without deletion', async () => {
    // Setup: Configuration for 90-day retention period
    const retentionDaysConfig = 90;
    const currentDate = new Date('2024-03-15T10:00:00Z');
    const ninetyDaysAgo = new Date(currentDate.getTime() - (retentionDaysConfig * 24 * 60 * 60 * 1000));

    // Pre-registered test data: 3 reports within retention period
    const testReportData = [
      {
        reportId: 'report-001',
        reportDate: new Date(currentDate.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString(),
        analysisResults: {
          extractedKeywords: [
            { keyword: 'API接続エラー', frequency: 3 },
            { keyword: 'メモリリーク', frequency: 2 }
          ],
          impactScore: 75,
          severity: 'high'
        }
      },
      {
        reportId: 'report-002',
        reportDate: new Date(currentDate.getTime() - (60 * 24 * 60 * 60 * 1000)).toISOString(),
        analysisResults: {
          extractedKeywords: [
            { keyword: 'デプロイ遅延', frequency: 4 }
          ],
          impactScore: 62,
          severity: 'medium'
        }
      },
      {
        reportId: 'report-003',
        reportDate: new Date(currentDate.getTime() - (85 * 24 * 60 * 60 * 1000)).toISOString(),
        analysisResults: {
          extractedKeywords: [
            { keyword: '要件不明確', frequency: 5 },
            { keyword: 'コミュニケーション不足', frequency: 2 }
          ],
          impactScore: 88,
          severity: 'high'
        }
      }
    ];

    // Mock input: current context for freshness check
    const inputContext = {
      userId: 'user-manager-001',
      teamId: 'team-dev-001',
      reportDate: '2024-03-15',
      maxStalenessSeconds: 300,
      currentTimestamp: currentDate.toISOString(),
      retentionDays: retentionDaysConfig,
      existingReports: testReportData
    };

    // Stub TextAnalysisServiceAdapter to return cached results
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => Promise.resolve([
        { keyword: 'キャッシュキーワード', frequency: 1 }
      ])),
      assessImpactScore: jest.fn((text: string) => Promise.resolve(50)),
      classifyIssueSeverity: jest.fn((text: string) => Promise.resolve('medium'))
    };

    // Execute: Run data retention management batch
    const result = await ensureDashboardDataFreshness(inputContext);

    // Assert: Verify retention period logic and result structure
    expect(result).toHaveProperty('isDataFresh');
    expect(result).toHaveProperty('lastUpdateTimestamp');
    expect(result).toHaveProperty('displayTimestamp');
    expect(result).toHaveProperty('stalenessSeconds');

    // Assert: All 3 reports within retention period should be retained
    expect(result.retainedReportIds).toEqual(['report-001', 'report-002', 'report-003']);
    expect(result.retainedReportCount).toBe(3);

    // Assert: Analysis results preservation verification
    const report001Analysis = result.retainedAnalysisResults.find((r: any) => r.reportId === 'report-001');
    expect(report001Analysis).toBeDefined();
    expect(report001Analysis.extractedKeywords).toEqual([
      { keyword: 'API接続エラー', frequency: 3 },
      { keyword: 'メモリリーク', frequency: 2 }
    ]);
    expect(report001Analysis.impactScore).toBe(75);
    expect(report001Analysis.severity).toBe('high');

    const report002Analysis = result.retainedAnalysisResults.find((r: any) => r.reportId === 'report-002');
    expect(report002Analysis).toBeDefined();
    expect(report002Analysis.extractedKeywords).toEqual([
      { keyword: 'デプロイ遅延', frequency: 4 }
    ]);
    expect(report002Analysis.impactScore).toBe(62);
    expect(report002Analysis.severity).toBe('medium');

    const report003Analysis = result.retainedAnalysisResults.find((r: any) => r.reportId === 'report-003');
    expect(report003Analysis).toBeDefined();
    expect(report003Analysis.extractedKeywords).toEqual([
      { keyword: '要件不明確', frequency: 5 },
      { keyword: 'コミュニケーション不足', frequency: 2 }
    ]);
    expect(report003Analysis.impactScore).toBe(88);
    expect(report003Analysis.severity).toBe('high');

    // Assert: State consistency before and after execution
    expect(result.dataStateConsistent).toBe(true);
    expect(result.deletedReportCount).toBe(0);
    expect(result.archivedReportCount).toBe(0);
  });
});