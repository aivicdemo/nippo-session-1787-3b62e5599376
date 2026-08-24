import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';
import type { MonthlyReportDataset, DailyReportRecord } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - Extract Monthly Report Data', () => {
  // SCEN-2354: [normal] 朝会報告集約分析機能 - 課題の解決速度（期間内の状態遷移）を定量化して分析レポートに含める
  test('should quantify issue resolution speed with state transitions and include in analysis report', () => {
    // Prepare test data: 5 daily report records with same issue keyword but different states
    const reportRecords: DailyReportRecord[] = [
      {
        reportId: 'report-001',
        reportDate: new Date('2026-01-01T09:00:00Z'),
        teamId: 'team-alpha',
        reporterId: 'user-001',
        previousDayAccomplishment: 'System design completed',
        todayPlan: 'Start implementation',
        issuesReported: ['データベース接続タイムアウト対応'],
        issueDetails: [
          {
            keyword: 'データベース接続タイムアウト対応',
            state: '未着手',
            reportedDate: '2026-01-01',
            impact: 45
          }
        ]
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2026-01-03T09:00:00Z'),
        teamId: 'team-alpha',
        reporterId: 'user-001',
        previousDayAccomplishment: 'Started implementation',
        todayPlan: 'Continue implementation',
        issuesReported: ['データベース接続タイムアウト対応'],
        issueDetails: [
          {
            keyword: 'データベース接続タイムアウト対応',
            state: '進行中',
            reportedDate: '2026-01-03',
            impact: 45
          }
        ]
      },
      {
        reportId: 'report-003',
        reportDate: new Date('2026-01-05T09:00:00Z'),
        teamId: 'team-alpha',
        reporterId: 'user-001',
        previousDayAccomplishment: 'Implementation in progress',
        todayPlan: 'Submit for review',
        issuesReported: ['データベース接続タイムアウト対応'],
        issueDetails: [
          {
            keyword: 'データベース接続タイムアウト対応',
            state: 'レビュー待ち',
            reportedDate: '2026-01-05',
            impact: 45
          }
        ]
      },
      {
        reportId: 'report-004',
        reportDate: new Date('2026-01-07T09:00:00Z'),
        teamId: 'team-alpha',
        reporterId: 'user-001',
        previousDayAccomplishment: 'Code review passed',
        todayPlan: 'Deploy to staging',
        issuesReported: ['データベース接続タイムアウト対応'],
        issueDetails: [
          {
            keyword: 'データベース接続タイムアウト対応',
            state: '完了',
            reportedDate: '2026-01-07',
            impact: 45
          }
        ]
      },
      {
        reportId: 'report-005',
        reportDate: new Date('2026-01-10T09:00:00Z'),
        teamId: 'team-alpha',
        reporterId: 'user-001',
        previousDayAccomplishment: 'Deployed and verified',
        todayPlan: 'Close ticket',
        issuesReported: ['データベース接続タイムアウト対応'],
        issueDetails: [
          {
            keyword: 'データベース接続タイムアウト対応',
            state: 'クローズ',
            reportedDate: '2026-01-10',
            impact: 45
          }
        ]
      }
    ];

    // Stub TextAnalysisServiceAdapter to extract same keyword from all records
    const mockTextAnalysisService = {
      extractKeywords: jest.fn((text: string) => {
        return {
          keywords: [
            { keyword: 'データベース接続タイムアウト対応', frequency: 1, confidence: 0.95 }
          ]
        };
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        return { impactScore: 45 };
      }),
      classifyIssueSeverity: jest.fn((text: string) => {
        return { severity: 'high' };
      })
    };

    // Execute analysis for period 2026-01-01 to 2026-01-10
    const analysisResult = extractMonthlyReportData(
      reportRecords,
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-01-10T23:59:59Z'),
      mockTextAnalysisService
    );

    // Verify result is MonthlyReportDataset type
    expect(analysisResult).toBeDefined();
    expect(analysisResult.extractionPeriodStart).toBe('2026-01-01T00:00:00Z');
    expect(analysisResult.extractionPeriodEnd).toBe('2026-01-10T23:59:59Z');
    expect(analysisResult.totalReportCount).toBe(5);

    // Verify the resolution metrics for the issue keyword
    const issueAnalysis = analysisResult.issueAnalysisByKeyword?.find(
      (item) => item.keyword === 'データベース接続タイムアウト対応'
    );
    
    expect(issueAnalysis).toBeDefined();
    expect(issueAnalysis?.resolutionMetrics).toBeDefined();
    
    // Verify (1) transitionCount = 5 (state transitions: 未着手→進行中→レビュー待ち→完了→クローズ)
    expect(issueAnalysis?.resolutionMetrics.transitionCount).toBe(5);
    
    // Verify (2) resolutionDays = 10 (from 2026-01-01 to 2026-01-10 is 10 days inclusive)
    expect(issueAnalysis?.resolutionMetrics.resolutionDays).toBe(10);
    
    // Verify (3) stateTransitionTimeline contains date-state pairs in chronological order
    expect(issueAnalysis?.resolutionMetrics.stateTransitionTimeline).toBeDefined();
    expect(Array.isArray(issueAnalysis?.resolutionMetrics.stateTransitionTimeline)).toBe(true);
    
    const timeline = issueAnalysis?.resolutionMetrics.stateTransitionTimeline || [];
    expect(timeline.length).toBe(5);
    
    // Verify each transition record
    expect(timeline[0]).toEqual({
      date: '2026-01-01',
      state: '未着手'
    });
    expect(timeline[1]).toEqual({
      date: '2026-01-03',
      state: '進行中'
    });
    expect(timeline[2]).toEqual({
      date: '2026-01-05',
      state: 'レビュー待ち'
    });
    expect(timeline[3]).toEqual({
      date: '2026-01-07',
      state: '完了'
    });
    expect(timeline[4]).toEqual({
      date: '2026-01-10',
      state: 'クローズ'
    });
    
    // Verify issue is properly included in report
    expect(issueAnalysis?.occurrenceCount).toBe(5);
    expect(issueAnalysis?.impactScore).toBe(45);
  });
});