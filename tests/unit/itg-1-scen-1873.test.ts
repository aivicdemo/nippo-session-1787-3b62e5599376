import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AgentInput, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1: Monthly Report Generation with Retry Control', () => {
  // SCEN-1873
  test('should handle retry control correctly when month-initial period occurs between previous completion and failure detection', async () => {
    // Setup: Initialize test fixtures
    const previousReportCompletionTime = new Date('2024-01-31T23:59:59Z');
    const currentMonthStartDate = new Date('2024-02-01T00:00:00Z');
    const currentMonthEndDate = new Date('2024-02-29T23:59:59Z');
    const targetMonth = '2024-02';
    const managerUserId = 'user_manager_001';

    // Prepare test data: 10 members × 20 daily reports each = 200 total reports for test
    // First set will have data inconsistency (NULL records), second set will be clean
    const teamMemberIds = Array.from({ length: 10 }, (_, i) => `user_eng_${String(i + 1).padStart(3, '0')}`);
    const reportsPerMember = 20;
    const totalReportsBeforeFix = teamMemberIds.length * reportsPerMember;

    interface MockReport {
      report_id: string;
      user_id: string;
      team_id: string;
      report_date: string;
      yesterday_content: string | null;
      today_plan: string | null;
      issue_content: string | null;
      submitted_at: string;
    }

    // First dataset with inconsistency (some NULL fields)
    const inconsistentReports: MockReport[] = [];
    for (let i = 0; i < teamMemberIds.length; i++) {
      for (let j = 0; j < reportsPerMember; j++) {
        const reportDate = new Date(currentMonthStartDate.getTime() + j * 86400000); // Each day in February
        inconsistentReports.push({
          report_id: `report_fail_${i}_${j}`,
          user_id: teamMemberIds[i],
          team_id: 'team_dev_001',
          report_date: reportDate.toISOString().split('T')[0],
          yesterday_content: j % 5 === 0 ? null : `Yesterday work item ${i}-${j}`,
          today_plan: j % 7 === 0 ? null : `Today plan item ${i}-${j}`,
          issue_content: `Issue ${i}-${j}`,
          submitted_at: reportDate.toISOString(),
        });
      }
    }

    // Clean dataset after fix
    const consistentReports: MockReport[] = [];
    for (let i = 0; i < teamMemberIds.length; i++) {
      for (let j = 0; j < reportsPerMember; j++) {
        const reportDate = new Date(currentMonthStartDate.getTime() + j * 86400000);
        consistentReports.push({
          report_id: `report_ok_${i}_${j}`,
          user_id: teamMemberIds[i],
          team_id: 'team_dev_001',
          report_date: reportDate.toISOString().split('T')[0],
          yesterday_content: `Yesterday work item ${i}-${j}`,
          today_plan: `Today plan item ${i}-${j}`,
          issue_content: `Issue ${i}-${j}`,
          submitted_at: reportDate.toISOString(),
        });
      }
    }

    // Audit log storage
    const auditEvents: Array<{
      timestamp: Date;
      eventType: string;
      details: Record<string, unknown>;
    }> = [];

    // Retry state tracker
    let retryAttempt = 0;
    const retryTimestamps: Date[] = [];
    let dataFixApplied = false;

    // Create mock AI client stub
    const mockAiClient: Tx7Imp1AiClient = {
      executeAction01ExtractMonthlyDataAsync: jest.fn(async () => {
        return { success: true, extractedRecordCount: 0 };
      }),
      executeAction02ExtractMonthlyData: jest.fn(async () => {
        // First call returns inconsistent data, subsequent calls return consistent data
        if (retryAttempt === 0 && !dataFixApplied) {
          throw new Error('Data extraction failed: NULL records detected in dataset');
        }
        return {
          success: true,
          extractedReports: dataFixApplied ? consistentReports : inconsistentReports,
          extractedRecordCount: totalReportsBeforeFix,
          dataQualityScore: dataFixApplied ? 0.95 : 0.45,
        };
      }),
      executeAction03AnalyzeTimeSeries: jest.fn(async () => {
        return {
          success: true,
          timeSeriesData: [
            {
              date: '2024-02-01',
              bottleneckSeverity: 7,
              activeIssueCount: 12,
            },
            {
              date: '2024-02-15',
              bottleneckSeverity: 5,
              activeIssueCount: 8,
            },
            {
              date: '2024-02-29',
              bottleneckSeverity: 3,
              activeIssueCount: 5,
            },
          ],
          improvementTrend: 'improving',
        };
      }),
      executeAction04AnalyzeBottleneckTrend: jest.fn(async () => {
        return {
          success: true,
          recurringIssuePatterns: ['API response delay', 'Database query optimization', 'Test coverage gap'],
          bottleneckRankHistory: [
            { date: '2024-02-01', rank: 1, issueCount: 12 },
            { date: '2024-02-15', rank: 1, issueCount: 8 },
            { date: '2024-02-29', rank: 2, issueCount: 5 },
          ],
        };
      }),
      executeAction05CalculateTeamPerformanceMetrics: jest.fn(async () => {
        return {
          success: true,
          metrics: {
            avgResolutionDays: 3.5,
            reportSubmissionRate: 0.92,
            issueRecurrenceRate: 0.18,
          },
        };
      }),
      executeAction06GenerateAnalysisReport: jest.fn(async () => {
        return {
          success: true,
          reportContent: {
            topChallenges: [
              { challengeId: 'ch_001', priorityScore: 92, occurrenceFrequency: 15, impactLevel: 'high', resolutionDaysAverage: 4.2 },
              { challengeId: 'ch_002', priorityScore: 78, occurrenceFrequency: 11, impactLevel: 'high', resolutionDaysAverage: 3.8 },
              { challengeId: 'ch_003', priorityScore: 65, occurrenceFrequency: 8, impactLevel: 'medium', resolutionDaysAverage: 2.9 },
              { challengeId: 'ch_004', priorityScore: 52, occurrenceFrequency: 5, impactLevel: 'medium', resolutionDaysAverage: 3.1 },
              { challengeId: 'ch_005', priorityScore: 38, occurrenceFrequency: 3, impactLevel: 'low', resolutionDaysAverage: 1.5 },
            ],
          },
        };
      }),
      executeAction07DeliverReportToManager: jest.fn(async () => {
        return {
          success: true,
          deliveryTimestamp: new Date(),
          emailSentTo: ['manager@example.com'],
        };
      }),
      executeAction08RecordAuditLog: jest.fn(async (eventType: string, details: Record<string, unknown>) => {
        auditEvents.push({
          timestamp: new Date(),
          eventType,
          details,
        });
        return { success: true };
      }),
    };

    // Input for orchestrator
    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp: currentMonthStartDate,
      targetMonth,
      managerUserId,
      includeDetailedAnalysis: true,
    };

    // Simulate orchestrator execution with retry logic
    let executionResult: {
      reportId: string;
      executionStatus: string;
      analysisResultSummary: {
        topPriorityChallenges: Array<{
          challengeId: string;
          priorityScore: number;
          occurrenceFrequency: number;
          impactLevel: string;
          resolutionDaysAverage: number;
        }>;
        performanceMetrics: {
          avgResolutionDays: number;
          reportSubmissionRate: number;
          issueRecurrenceRate: number;
        };
        bottleneckTrend: {
          timeSeriesData: Array<{
            date: string;
            bottleneckSeverity: number;
            activeIssueCount: number;
          }>;
          improvementTrend: string;
          recurringIssuePatterns: string[];
        };
      };
      deliveryTimestamp: Date;
    } | null = null;

    const maxRetries = 3;
    const retryIntervals = [5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000]; // 5min, 15min, 1hour

    try {
      // Initial execution
      retryAttempt = 0;
      await runTx7Imp1Agent(agentInput, mockAiClient);
    } catch (error) {
      // First error detected - start retry loop
      auditEvents.push({
        timestamp: new Date(),
        eventType: 'error_detected',
        details: { errorMessage: (error as Error).message, retryAttempt: 0 },
      });

      // Retry loop
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        // Wait for retry interval (simulated)
        const retryDelayMs = retryIntervals[attempt - 1];
        retryAttempt = attempt;
        retryTimestamps.push(new Date(Date.now() + retryDelayMs));

        try {
          // If this is the second retry (attempt === 2), apply data fix
          if (attempt === 2) {
            dataFixApplied = true;
            auditEvents.push({
              timestamp: new Date(),
              eventType: 'data_inconsistency_fixed',
              details: { fixedAt: attempt, transactionRollback: true },
            });
          }

          executionResult = await runTx7Imp1Agent(agentInput, mockAiClient);

          auditEvents.push({
            timestamp: new Date(),
            eventType: `retry_${attempt}_success`,
            details: { retryAttempt: attempt, reportId: executionResult.reportId },
          });
          break;
        } catch (retryError) {
          auditEvents.push({
            timestamp: new Date(),
            eventType: `retry_${attempt}_failure`,
            details: { retryAttempt: attempt, errorMessage: (retryError as Error).message },
          });

          if (attempt === maxRetries) {
            throw retryError;
          }
        }
      }
    }

    // Assertions

    // 1. Report generation succeeded after retries
    expect(executionResult).not.toBeNull();
    expect(executionResult!.executionStatus).toBe('success');

    // 2. Report ID is generated
    expect(executionResult!.reportId).toMatch(/^report_/);

    // 3. Analysis includes top 5 challenges with correct structure
    expect(executionResult!.analysisResultSummary.topPriorityChallenges).toHaveLength(5);
    expect(executionResult!.analysisResultSummary.topPriorityChallenges[0].priorityScore).toBe(92);
    expect(executionResult!.analysisResultSummary.topPriorityChallenges[0].impactLevel).toBe('high');
    expect(executionResult!.analysisResultSummary.topPriorityChallenges[0].resolutionDaysAverage).toBe(4.2);

    // 4. Performance metrics are calculated
    expect(executionResult!.analysisResultSummary.performanceMetrics.avgResolutionDays).toBe(3.5);
    expect(executionResult!.analysisResultSummary.performanceMetrics.reportSubmissionRate).toBe(0.92);
    expect(executionResult!.analysisResultSummary.performanceMetrics.issueRecurrenceRate).toBe(0.18);

    // 5. Bottleneck trend shows improving trend
    expect(executionResult!.analysisResultSummary.bottleneckTrend.improvementTrend).toBe('improving');
    expect(executionResult!.analysisResultSummary.bottleneckTrend.timeSeriesData).toHaveLength(3);
    expect(executionResult!.analysisResultSummary.bottleneckTrend.timeSeriesData[0].bottleneckSeverity).toBe(7);
    expect(executionResult!.analysisResultSummary.bottleneckTrend.timeSeriesData[2].bottleneckSeverity).toBe(3);

    // 6. Recurring issue patterns identified
    expect(executionResult!.analysisResultSummary.bottleneckTrend.recurringIssuePatterns).toHaveLength(3);
    expect(executionResult!.analysisResultSummary.bottleneckTrend.recurringIssuePatterns).toContain('API response delay');

    // 7. Delivery timestamp is set
    expect(executionResult!.deliveryTimestamp).toBeInstanceOf(Date);

    // 8. Retry attempts recorded correctly
    expect(retryTimestamps).toHaveLength(2); // Two retry attempts
    expect(retryAttempt).toBe(2); // Final successful retry at attempt 2

    // 9. Audit events contain complete history
    expect(auditEvents.length).toBeGreaterThanOrEqual(3); // At least: error, retry failures, retry success
    const auditEventTypes = auditEvents.map(e => e.eventType);
    expect(auditEventTypes).toContain('error_detected');
    expect(auditEventTypes).toContain('retry_1_failure');
    expect(auditEventTypes).toContain('retry_2_success');

    // 10. Audit events are in chronological order
    for (let i = 1; i < auditEvents.length; i++) {
      expect(auditEvents[i].timestamp.getTime()).toBeGreaterThanOrEqual(auditEvents[i - 1].timestamp.getTime());
    }

    // 11. Action-02 (data extraction) was called multiple times during retries
    const action02CallCount = (mockAiClient.executeAction02ExtractMonthlyData as jest.Mock).mock.calls.length;
    expect(action02CallCount).toBeGreaterThanOrEqual(2); // Initial call + at least one retry

    // 12. Data fix was applied before second retry
    expect(dataFixApplied).toBe(true);

    // 13. Verify data period spans February 1-29, 2024
    const timeSeriesDates = executionResult!.analysisResultSummary.bottleneckTrend.timeSeriesData.map(d => new Date(d.date + 'T00:00:00Z'));
    expect(timeSeriesDates[0].toISOString().split('T')[0]).toBe('2024-02-01');
    expect(timeSeriesDates[timeSeriesDates.length - 1].toISOString().split('T')[0]).toBe('2024-02-29');

    // 14. Verify audit log contains retry count metadata
    const successEvent = auditEvents.find(e => e.eventType === 'retry_2_success');
    expect(successEvent).toBeDefined();
    expect(successEvent!.details.retryAttempt).toBe(2);

    // 15. Data inconsistency fix event recorded
    const fixEvent = auditEvents.find(e => e.eventType === 'data_inconsistency_fixed');
    expect(fixEvent).toBeDefined();
    expect(fixEvent!.details.fixedAt).toBe(2);
  });
});