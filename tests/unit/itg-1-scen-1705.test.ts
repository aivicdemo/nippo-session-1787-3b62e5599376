import { extractWeeklyReportData, type WeeklyExtractionRequest, type WeeklyReportDataset } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis - Extract Weekly Report Data', () => {
  test('SCEN-1705: Extract and analyze full week report dataset (50 reports across all team members)', async () => {
    // === Setup: Mock TextAnalysisServiceAdapter ===
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async (text: string) => {
        // Mock implementation: return sample keywords with frequencies
        const keywordMap: Record<string, { keyword: string; occurrenceCount: number }[]> = {
          'default': [
            { keyword: 'データベース接続エラー', occurrenceCount: 8 },
            { keyword: 'パフォーマンス問題', occurrenceCount: 6 },
            { keyword: 'APIレイテンシ', occurrenceCount: 5 },
            { keyword: 'メモリリーク疑い', occurrenceCount: 3 },
            { keyword: 'デプロイ遅延', occurrenceCount: 4 },
          ],
        };
        return keywordMap['default'];
      }),
      assessImpactScore: jest.fn(async (keyword: string) => {
        // Mock implementation: return impact score 0-100 based on keyword
        const scoreMap: Record<string, number> = {
          'データベース接続エラー': 92,
          'パフォーマンス問題': 78,
          'APIレイテンシ': 65,
          'メモリリーク疑い': 88,
          'デプロイ遅延': 55,
        };
        return scoreMap[keyword] ?? 50;
      }),
      classifyIssueSeverity: jest.fn(async (text: string) => {
        // Mock implementation: classify severity as high/medium/low
        const severityMap: Record<string, 'high' | 'medium' | 'low'> = {
          'データベース接続エラー': 'high',
          'パフォーマンス問題': 'medium',
          'APIレイテンシ': 'medium',
          'メモリリーク疑い': 'high',
          'デプロイ遅延': 'low',
        };
        // Extract first keyword-like token for severity classification
        for (const [keyword, severity] of Object.entries(severityMap)) {
          if (text.includes(keyword)) {
            return severity;
          }
        }
        return 'medium';
      }),
    };

    // === Prepare test data: 50 reports (5 days × 10 team members) ===
    const baseDate = new Date('2024-01-08T00:00:00Z'); // Monday
    const reportData: Array<{
      reportDate: Date;
      userId: string;
      yesterdayWork: string;
      todayPlan: string;
      challengeItems: string;
    }> = [];

    const teamMemberIds = [
      'user001', 'user002', 'user003', 'user004', 'user005',
      'user006', 'user007', 'user008', 'user009', 'user010',
    ];

    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      const reportDate = new Date(baseDate);
      reportDate.setDate(reportDate.getDate() + dayOffset);

      for (const userId of teamMemberIds) {
        reportData.push({
          reportDate,
          userId,
          yesterdayWork: `completed task for ${userId} on day ${dayOffset}`,
          todayPlan: `planned work for ${userId} on day ${dayOffset}`,
          challengeItems: `データベース接続エラー パフォーマンス問題 APIレイテンシ メモリリーク疑い デプロイ遅延 for ${userId}`,
        });
      }
    }

    // === Build WeeklyExtractionRequest ===
    const request: WeeklyExtractionRequest = {
      weekStartDate: new Date('2024-01-08T00:00:00Z'), // Monday
      weekEndDate: new Date('2024-01-14T23:59:59Z'),   // Sunday
      teamIds: ['team_dev', 'team_qa', 'team_infra'],
      requestedByUserId: 'manager001',
    };

    // === Execute extractWeeklyReportData ===
    const result: WeeklyReportDataset = await extractWeeklyReportData(
      request,
      mockTextAnalysisAdapter,
      reportData
    );

    // === Assertions: Verify structure and content ===

    // Assert week range
    expect(result.weekRange.startDate).toEqual(new Date('2024-01-08T00:00:00Z'));
    expect(result.weekRange.endDate).toEqual(new Date('2024-01-14T23:59:59Z'));

    // Assert total reports extracted
    expect(result.totalReportsExtracted).toBe(50);

    // Assert reportsByDate has 5 entries (Mon-Fri)
    expect(result.reportsByDate.length).toBe(5);

    // Verify each day summary
    for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
      const dailySummary = result.reportsByDate[dayIndex];
      const expectedReportDate = new Date(baseDate);
      expectedReportDate.setDate(expectedReportDate.getDate() + dayIndex);

      expect(dailySummary.reportDate).toEqual(expectedReportDate);
      expect(dailySummary.reportCount).toBe(10); // 10 team members per day
      expect(dailySummary.submittedByUserIds.length).toBe(10);
      expect(dailySummary.submittedByUserIds).toContain('user001');
      expect(dailySummary.submittedByUserIds).toContain('user010');
      expect(dailySummary.challengeItems.length).toBeGreaterThan(0);
    }

    // Assert extracted challenges are normalized and ranked
    expect(result.extractedChallenges.length).toBeGreaterThan(0);
    
    // Verify top 5 challenges by frequency (mock returns 5 keywords)
    const topChallenges = result.extractedChallenges.slice(0, 5);
    expect(topChallenges[0].keyword).toBe('データベース接続エラー');
    expect(topChallenges[0].occurrenceCount).toBe(8);
    expect(topChallenges[1].keyword).toBe('パフォーマンス問題');
    expect(topChallenges[1].occurrenceCount).toBe(6);

    // Assert impact scores are calculated and within range 0-100
    for (const challenge of result.extractedChallenges) {
      expect(challenge.impactScore).toBeGreaterThanOrEqual(0);
      expect(challenge.impactScore).toBeLessThanOrEqual(100);
    }

    // Assert severity classifications present
    for (const challenge of result.extractedChallenges) {
      expect(['high', 'medium', 'low']).toContain(challenge.severity);
    }

    // Assert data quality score (0-100)
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // === Verify mock call counts ===
    // extractKeywords should be called 50 times (once per report)
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(50);

    // assessImpactScore called for each extracted keyword
    expect(mockTextAnalysisAdapter.assessImpactScore.mock.calls.length).toBeGreaterThan(0);

    // classifyIssueSeverity called for classification
    expect(mockTextAnalysisAdapter.classifyIssueSeverity.mock.calls.length).toBeGreaterThan(0);

    // === Verify data consistency ===
    // Sum of daily report counts should equal total reports
    const totalFromDaily = result.reportsByDate.reduce((sum, daily) => sum + daily.reportCount, 0);
    expect(totalFromDaily).toBe(50);

    // All submitted user IDs should match expected team members across all days
    const allSubmittedUsers = new Set<string>();
    result.reportsByDate.forEach(daily => {
      daily.submittedByUserIds.forEach(userId => allSubmittedUsers.add(userId));
    });
    expect(allSubmittedUsers.size).toBe(10);
    for (const userId of teamMemberIds) {
      expect(allSubmittedUsers).toContain(userId);
    }

    // Challenge items should contain expected keywords
    const allChallengeItems = result.reportsByDate.flatMap(d => d.challengeItems);
    const hasDbError = allChallengeItems.some(item => item.includes('データベース接続エラー'));
    expect(hasDbError).toBe(true);
  });
});