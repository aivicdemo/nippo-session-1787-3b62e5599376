import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';
import type { MonthlyReportDataset, MonthlyReportApprovalResult } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - extractMonthlyReportData', () => {
  let performanceMetrics: {
    startTime: number;
    endTime: number;
    memoryBefore: number;
    memoryAfter: number;
  };

  beforeEach(() => {
    performanceMetrics = {
      startTime: 0,
      endTime: 0,
      memoryBefore: 0,
      memoryAfter: 0,
    };
  });

  afterEach(() => {
    performanceMetrics = {
      startTime: 0,
      endTime: 0,
      memoryBefore: 0,
      memoryAfter: 0,
    };
  });

  // SCEN-1786: [edge] 月次レポート生成機能 - 業務上の最大規模データ量を抽出してデータセットが確定する
  test('should extract maximum-scale monthly report data for all teams and members within performance limits', () => {
    const targetYear = 2024;
    const targetMonth = 11;
    const requestedByUserId = 'user-director-001';

    // Setup: 5 teams with 10 members each = 50 total members
    const teamIds = ['team-001', 'team-002', 'team-003', 'team-004', 'team-005'];
    const membersPerTeam = 10;
    const totalMembers = teamIds.length * membersPerTeam;

    // Setup: Maximum 22 business days in a month
    const businessDaysInMonth = 22;
    const maxExpectedRecords = totalMembers * businessDaysInMonth; // 1,100 records max

    // Generate mock report records
    // Each member should have up to 22 daily reports
    const mockReportRecords = [];
    let recordIndex = 0;

    for (let teamIdx = 0; teamIdx < teamIds.length; teamIdx++) {
      const teamId = teamIds[teamIdx];
      for (let memberIdx = 0; memberIdx < membersPerTeam; memberIdx++) {
        const memberId = `member-${teamIdx * membersPerTeam + memberIdx + 1}`;

        // Generate 22 daily reports for November 2024 (business days)
        for (let dayOfMonth = 1; dayOfMonth <= businessDaysInMonth; dayOfMonth++) {
          const reportDate = new Date(`2024-11-${String(dayOfMonth).padStart(2, '0')}T09:00:00Z`);

          mockReportRecords.push({
            reportId: `report-${teamId}-${memberId}-day${dayOfMonth}`,
            teamId: teamId,
            memberId: memberId,
            reportDate: reportDate,
            submittedAt: new Date(`2024-11-${String(dayOfMonth).padStart(2, '0')}T08:30:00Z`),
            yesterdayWork: `Yesterday work for ${memberId} on day ${dayOfMonth}`,
            todayPlan: `Today plan for ${memberId} on day ${dayOfMonth}`,
            issues: `Issue: Database query performance, Network latency for ${memberId}`,
            dataQualityScore: 85,
          });

          recordIndex++;
        }
      }
    }

    // Verify generated records
    expect(mockReportRecords.length).toBe(1100);

    // Mock TextAnalysisServiceAdapter for keyword extraction
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        const keywords = [];
        if (text.includes('Database')) keywords.push('database_performance');
        if (text.includes('Network')) keywords.push('network_latency');
        if (text.includes('performance')) keywords.push('performance_optimization');
        return Promise.resolve(keywords);
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        const scoreMap: Record<string, number> = {
          database_performance: 75,
          network_latency: 68,
          performance_optimization: 72,
        };
        return Promise.resolve(scoreMap[keyword] || 50);
      }),
      classifyIssueSeverity: jest.fn((issueText: string) => {
        if (issueText.includes('critical')) return Promise.resolve('critical');
        if (issueText.includes('high')) return Promise.resolve('high');
        return Promise.resolve('medium');
      }),
    };

    // Capture performance metrics
    performanceMetrics.memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    performanceMetrics.startTime = Date.now();

    // Execute: Call extractMonthlyReportData with maximum-scale data
    const extractionRequest = {
      targetYear: targetYear,
      targetMonth: targetMonth,
      requestedByUserId: requestedByUserId,
      teamIdFilter: undefined, // No filter = all teams
    };

    // Since extractMonthlyReportData is the actual function being tested,
    // we call it with the mock data structure it expects
    const result: MonthlyReportDataset = extractMonthlyReportData(
      extractionRequest,
      mockReportRecords,
      mockTextAnalysisAdapter as any
    );

    performanceMetrics.endTime = Date.now();
    performanceMetrics.memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024; // MB

    // Calculate metrics
    const executionTimeMs = performanceMetrics.endTime - performanceMetrics.startTime;
    const memoryUsedMb =
      performanceMetrics.memoryAfter - performanceMetrics.memoryBefore;
    const peakMemoryMb = performanceMetrics.memoryAfter;

    // Assertions: Data completeness
    expect(result).toBeDefined();
    expect(result.totalReportCount).toBe(1100);
    expect(result.reportsByTeam).toBeDefined();
    expect(result.reportsByTeam.length).toBe(5); // 5 teams

    // Assertions: Team-level data integrity
    result.reportsByTeam.forEach((teamSummary, index) => {
      expect(teamSummary.teamId).toBe(teamIds[index]);
      expect(teamSummary.reportCount).toBe(220); // 10 members × 22 days each
      expect(teamSummary.reportIds.length).toBe(220);
      expect(teamSummary.submissionRate).toBe(100); // All records submitted in this test
    });

    // Assertions: Extraction period correctness
    expect(result.extractionPeriodStart).toBe('2024-11-01T00:00:00Z');
    expect(result.extractionPeriodEnd).toBe('2024-11-30T23:59:59Z');

    // Assertions: Data quality score
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(80);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // Assertions: Extraction timestamp is ISO 8601 format and recent
    const extractedAtDate = new Date(result.extractedAt);
    expect(extractedAtDate.getTime()).toBeLessThanOrEqual(Date.now());
    expect(extractedAtDate.getTime()).toBeGreaterThan(Date.now() - 10000); // Within last 10 seconds

    // Performance Assertions: Memory usage under 200 MB
    expect(peakMemoryMb).toBeLessThan(200);

    // Performance Assertions: Execution time under 30 seconds
    expect(executionTimeMs).toBeLessThan(30000);

    // Assertions: External API calls were made (mock verification)
    // Verify that TextAnalysisServiceAdapter was called appropriately
    // Since we process issues containing keywords, expect multiple calls
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();

    // The number of extract calls should be reasonable (not 0, not excessive)
    const extractCallCount = mockTextAnalysisAdapter.extractKeywords.mock.calls.length;
    expect(extractCallCount).toBeGreaterThan(0);
    expect(extractCallCount).toBeLessThanOrEqual(1100); // At most 1 per record

    // Assertions: Verify data structure completeness
    expect(result.reportsByTeam[0].reportIds).toBeDefined();
    expect(Array.isArray(result.reportsByTeam[0].reportIds)).toBe(true);

    // Assertions: Verify no duplicates in report IDs across all teams
    const allReportIds = result.reportsByTeam.flatMap(team => team.reportIds);
    const uniqueReportIds = new Set(allReportIds);
    expect(uniqueReportIds.size).toBe(allReportIds.length); // No duplicates

    // Assertions: Verify report IDs match expected format and count
    const reportIdSample = allReportIds[0];
    expect(reportIdSample).toMatch(/^report-team-\d{3}-member-\d+-day\d+$/);

    // Assertions: Verify total records sum across teams equals totalReportCount
    const sumReportCountByTeam = result.reportsByTeam.reduce(
      (sum, team) => sum + team.reportCount,
      0
    );
    expect(sumReportCountByTeam).toBe(result.totalReportCount);
    expect(result.totalReportCount).toBe(1100);
  });
});