import { describe, test, expect } from '@jest/globals';
import { generateWeeklyAnalysisReport, type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-analysis-report';
import { type AggregatedWeeklyReportData, type ExtractedIssue, type WeeklyReportRecord } from '../../src/logic/weekly-analysis-report';

describe('generateWeeklyAnalysisReport', () => {
  // SCEN-429: [edge] 優先度スコア閾値の境界条件テスト
  test('should clamp priority threshold to 0-100 range when out of bounds', () => {
    const analysisStartDate = new Date('2024-01-08T00:00:00Z');
    const analysisEndDate = new Date('2024-01-14T23:59:59Z');
    const teamId = 'team-001';

    // Create valid extracted issues dataset (10 items minimum)
    const extractedIssues: ExtractedIssue[] = [
      { issueId: 'issue-001', issueContent: 'バグ', reporterTeamId: teamId, occurrenceCount: 5 },
      { issueId: 'issue-002', issueContent: '遅延', reporterTeamId: teamId, occurrenceCount: 3 },
      { issueId: 'issue-003', issueContent: 'リソース不足', reporterTeamId: teamId, occurrenceCount: 7 },
      { issueId: 'issue-004', issueContent: '依存関係', reporterTeamId: teamId, occurrenceCount: 2 },
      { issueId: 'issue-005', issueContent: 'ビルド失敗', reporterTeamId: teamId, occurrenceCount: 4 },
      { issueId: 'issue-006', issueContent: 'テスト失敗', reporterTeamId: teamId, occurrenceCount: 6 },
      { issueId: 'issue-007', issueContent: '環境問題', reporterTeamId: teamId, occurrenceCount: 1 },
      { issueId: 'issue-008', issueContent: '仕様変更', reporterTeamId: teamId, occurrenceCount: 3 },
      { issueId: 'issue-009', issueContent: 'パフォーマンス低下', reporterTeamId: teamId, occurrenceCount: 2 },
      { issueId: 'issue-010', issueContent: 'セキュリティ問題', reporterTeamId: teamId, occurrenceCount: 4 },
    ];

    const weeklyReportRecords: WeeklyReportRecord[] = [
      {
        reportId: 'rep-001',
        reporterId: 'emp-001',
        reportDate: '2024-01-08',
        yesterdayWork: 'バグ修正',
        todayWork: 'テスト実行',
        issues: 'バグ',
        submittedAt: '2024-01-08T09:00:00Z',
      },
    ];

    const aggregatedReportData: AggregatedWeeklyReportData = {
      reportRecords: weeklyReportRecords,
      extractedIssues: extractedIssues,
      dataQualityMetrics: {
        completenessRate: 0.95,
        deduplicationRate: 0.88,
        validityRate: 0.92,
      },
    };

    // Test Case 1: priorityThresholdScore = -1 (below minimum)
    const inputWithNegativeThreshold: WeeklyAnalysisReportInput = {
      analysisStartDate: analysisStartDate,
      analysisEndDate: analysisEndDate,
      teamId: teamId,
      aggregatedReportData: aggregatedReportData,
      minimumReportThreshold: 5,
    };

    const reportNegativeThreshold: WeeklyAnalysisReport = generateWeeklyAnalysisReport(
      inputWithNegativeThreshold,
      -1
    );

    expect(reportNegativeThreshold.reportId).toBeDefined();
    expect(reportNegativeThreshold.aggregationPeriod.startDate).toEqual(analysisStartDate);
    expect(reportNegativeThreshold.aggregationPeriod.endDate).toEqual(analysisEndDate);
    expect(reportNegativeThreshold.priorityScores).toBeDefined();
    expect(Array.isArray(reportNegativeThreshold.priorityScores)).toBe(true);
    // When threshold is clamped to 0, all issues with score >= 0 should be included
    expect(reportNegativeThreshold.priorityScores.length).toBeGreaterThan(0);
    reportNegativeThreshold.priorityScores.forEach((score) => {
      expect(score.priorityScore).toBeGreaterThanOrEqual(0);
      expect(score.priorityScore).toBeLessThanOrEqual(100);
    });
    expect(reportNegativeThreshold.generatedAt).toBeDefined();
    expect(reportNegativeThreshold.generatedAt instanceof Date).toBe(true);

    // Test Case 2: priorityThresholdScore = 101 (above maximum)
    const inputWithExcessiveThreshold: WeeklyAnalysisReportInput = {
      analysisStartDate: analysisStartDate,
      analysisEndDate: analysisEndDate,
      teamId: teamId,
      aggregatedReportData: aggregatedReportData,
      minimumReportThreshold: 5,
    };

    const reportExcessiveThreshold: WeeklyAnalysisReport = generateWeeklyAnalysisReport(
      inputWithExcessiveThreshold,
      101
    );

    expect(reportExcessiveThreshold.reportId).toBeDefined();
    expect(reportExcessiveThreshold.aggregationPeriod.startDate).toEqual(analysisStartDate);
    expect(reportExcessiveThreshold.aggregationPeriod.endDate).toEqual(analysisEndDate);
    expect(reportExcessiveThreshold.priorityScores).toBeDefined();
    expect(Array.isArray(reportExcessiveThreshold.priorityScores)).toBe(true);
    // When threshold is clamped to 100, only issues with score === 100 should be included
    reportExcessiveThreshold.priorityScores.forEach((score) => {
      expect(score.priorityScore).toBeGreaterThanOrEqual(0);
      expect(score.priorityScore).toBeLessThanOrEqual(100);
    });
    expect(reportExcessiveThreshold.generatedAt).toBeDefined();
    expect(reportExcessiveThreshold.generatedAt instanceof Date).toBe(true);

    // Both reports should be valid and not throw errors
    expect(reportNegativeThreshold).toBeDefined();
    expect(reportExcessiveThreshold).toBeDefined();
  });
});