import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { generateMonthlyAnalysisReport } from '../../src/logic/analysis-reporting';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';
import {
  buildAction01Prompt,
  ACTION_01_PROMPT_VERSION,
} from '../../src/agents/tx-7-imp-1/prompts/action-01';
import {
  buildAction02Prompt,
  ACTION_02_PROMPT_VERSION,
} from '../../src/agents/tx-7-imp-1/prompts/action-02';
import {
  buildAction03Prompt,
  ACTION_03_PROMPT_VERSION,
} from '../../src/agents/tx-7-imp-1/prompts/action-03';
import {
  buildAction04Prompt,
  ACTION_04_PROMPT_VERSION,
} from '../../src/agents/tx-7-imp-1/prompts/action-04';
import {
  buildAction05Prompt,
  ACTION_05_PROMPT_VERSION,
} from '../../src/agents/tx-7-imp-1/prompts/action-05';
import {
  buildAction06Prompt,
  ACTION_06_PROMPT_VERSION,
} from '../../src/agents/tx-7-imp-1/prompts/action-06';
import {
  buildAction07Prompt,
  ACTION_07_PROMPT_VERSION,
} from '../../src/agents/tx-7-imp-1/prompts/action-07';
import {
  buildAction08Prompt,
  ACTION_08_PROMPT_VERSION,
} from '../../src/agents/tx-7-imp-1/prompts/action-08';

describe('tx-7-imp-1: 月次レポート生成から分析完了までの自動実行', () => {
  // SCEN-124
  test('should complete monthly analysis report generation without human approval for normal case', async () => {
    const mockAuditLog: Array<{
      timestamp: string;
      actionNumber: number;
      promptVersion: string;
      status: string;
    }> = [];

    const mockReportingSystemData = {
      reportedDates: [
        '2024-01-01',
        '2024-01-02',
        '2024-01-03',
        '2024-01-04',
        '2024-01-05',
      ],
      teamMembers: [
        { memberId: 'mem001', name: 'Member A' },
        { memberId: 'mem002', name: 'Member B' },
        { memberId: 'mem003', name: 'Member C' },
        { memberId: 'mem004', name: 'Member D' },
        { memberId: 'mem005', name: 'Member E' },
        { memberId: 'mem006', name: 'Member F' },
        { memberId: 'mem007', name: 'Member G' },
        { memberId: 'mem008', name: 'Member H' },
        { memberId: 'mem009', name: 'Member I' },
        { memberId: 'mem010', name: 'Member J' },
      ],
      reports: [
        {
          memberId: 'mem001',
          date: '2024-01-01',
          accomplishment: 'Completed API integration',
          todayPlan: 'Test API endpoints',
          issue: 'Database connection timeout',
        },
        {
          memberId: 'mem002',
          date: '2024-01-01',
          accomplishment: 'Reviewed pull requests',
          todayPlan: 'Fix code review issues',
          issue: null,
        },
        {
          memberId: 'mem003',
          date: '2024-01-02',
          accomplishment: 'Deployed to staging',
          todayPlan: 'Run integration tests',
          issue: 'Deployment script error',
        },
        {
          memberId: 'mem001',
          date: '2024-01-02',
          accomplishment: 'Fixed database timeout',
          todayPlan: 'Implement caching layer',
          issue: 'Database connection timeout persists in load test',
        },
        {
          memberId: 'mem004',
          date: '2024-01-03',
          accomplishment: 'Written unit tests',
          todayPlan: 'Increase coverage to 85%',
          issue: 'Flaky tests in CI environment',
        },
        {
          memberId: 'mem005',
          date: '2024-01-03',
          accomplishment: 'Updated documentation',
          todayPlan: 'Add API examples',
          issue: null,
        },
        {
          memberId: 'mem006',
          date: '2024-01-04',
          accomplishment: 'Refactored authentication module',
          todayPlan: 'Add OAuth2 support',
          issue: 'Session token expiration issue',
        },
        {
          memberId: 'mem007',
          date: '2024-01-04',
          accomplishment: 'Resolved customer support ticket',
          todayPlan: 'Follow up on customer issue',
          issue: null,
        },
        {
          memberId: 'mem008',
          date: '2024-01-05',
          accomplishment: 'Completed performance benchmarks',
          todayPlan: 'Optimize slow queries',
          issue: 'Query response time exceeds SLA by 15%',
        },
        {
          memberId: 'mem009',
          date: '2024-01-05',
          accomplishment: 'Prepared monitoring alerts',
          todayPlan: 'Configure dashboard',
          issue: null,
        },
        {
          memberId: 'mem010',
          date: '2024-01-05',
          accomplishment: 'Backed up production data',
          todayPlan: 'Test backup restoration',
          issue: null,
        },
      ],
    };

    const mockTimeSeriesAnalysis = {
      issueAIncreaseCount: 2,
      issueBDecreaseCount: 1,
      comparisonPeriod: 'previous month',
      finding: 'Issue A increased by 2 cases, Issue B decreased by 1 case',
    };

    const mockBottleneckAnalysis = {
      bottleneckCategory: 'System Integration Delay',
      percentageOfTotal: 35,
      finding:
        'Bottleneck: System integration delay accounts for 35% of total issues',
    };

    const mockTeamPerformance = {
      teamA: { issueCount: 5, resolutionRate: 0.8, avgResolutionDays: 2.5 },
      teamB: { issueCount: 3, resolutionRate: 0.9, avgResolutionDays: 1.8 },
      teamC: { issueCount: 2, resolutionRate: 0.85, avgResolutionDays: 3.2 },
    };

    const mockPriorityAnalysis = {
      priority1High: 'System Integration Delay Improvement',
      priority2Medium: 'Issue A Recurrence Prevention',
      priority3Low: 'Issue C Tracking',
    };

    const mockFinalReport = {
      generatedDate: '2024-01-01T00:00:00Z',
      reportPeriod: 'January 2024',
      status: 'completed',
      prioritizedIssues: [
        {
          priority: 1,
          level: 'High',
          title: 'System Integration Delay Improvement',
          recommendation: 'Allocate resources to optimize system integration',
        },
        {
          priority: 2,
          level: 'Medium',
          title: 'Issue A Recurrence Prevention',
          recommendation: 'Implement preventive measures for database connection issues',
        },
        {
          priority: 3,
          level: 'Low',
          title: 'Issue C Tracking',
          recommendation: 'Monitor Issue C for trend analysis',
        },
      ],
    };

    const mockAiClient: Tx7Imp1AiClient = {
      callAction01TriggerCheck: jest.fn(async () => {
        mockAuditLog.push({
          timestamp: '2024-01-01T00:00:00Z',
          actionNumber: 1,
          promptVersion: ACTION_01_PROMPT_VERSION,
          status: 'confirmed_ready_to_generate',
        });
        return {
          triggerConfirmed: true,
          readyToGenerate: true,
          message: 'Report generation confirmed',
        };
      }),

      callAction02ExtractReportingData: jest.fn(async () => {
        mockAuditLog.push({
          timestamp: '2024-01-01T00:05:00Z',
          actionNumber: 2,
          promptVersion: ACTION_02_PROMPT_VERSION,
          status: 'data_extracted',
        });
        return mockReportingSystemData;
      }),

      callAction03GenerateReport: jest.fn(async () => {
        mockAuditLog.push({
          timestamp: '2024-01-01T00:10:00Z',
          actionNumber: 3,
          promptVersion: ACTION_03_PROMPT_VERSION,
          status: 'report_generated',
        });
        return {
          reportTemplate: 'monthly_report_v1',
          sections: [
            'executive_summary',
            'issue_analysis',
            'performance_metrics',
            'recommendations',
          ],
          generatedContent:
            'Monthly report generated successfully with all required sections',
        };
      }),

      callAction04AnalyzeTimeSeriesChange: jest.fn(async () => {
        mockAuditLog.push({
          timestamp: '2024-01-01T00:15:00Z',
          actionNumber: 4,
          promptVersion: ACTION_04_PROMPT_VERSION,
          status: 'timeseries_analyzed',
        });
        return mockTimeSeriesAnalysis;
      }),

      callAction05IdentifyBottleneckShift: jest.fn(async () => {
        mockAuditLog.push({
          timestamp: '2024-01-01T00:20:00Z',
          actionNumber: 5,
          promptVersion: ACTION_05_PROMPT_VERSION,
          status: 'bottleneck_identified',
        });
        return mockBottleneckAnalysis;
      }),

      callAction06CalculateTeamPerformance: jest.fn(async () => {
        mockAuditLog.push({
          timestamp: '2024-01-01T00:25:00Z',
          actionNumber: 6,
          promptVersion: ACTION_06_PROMPT_VERSION,
          status: 'team_performance_calculated',
        });
        return mockTeamPerformance;
      }),

      callAction07PrioritizeAnalysisResults: jest.fn(async () => {
        mockAuditLog.push({
          timestamp: '2024-01-01T00:30:00Z',
          actionNumber: 7,
          promptVersion: ACTION_07_PROMPT_VERSION,
          status: 'analysis_prioritized',
        });
        return mockPriorityAnalysis;
      }),

      callAction08PresentReportToDirector: jest.fn(async () => {
        mockAuditLog.push({
          timestamp: '2024-01-01T00:35:00Z',
          actionNumber: 8,
          promptVersion: ACTION_08_PROMPT_VERSION,
          status: 'report_presented_to_director',
        });
        return {
          presentationStatus: 'success',
          reportDeliveredTo: 'director',
          finalReport: mockFinalReport,
        };
      }),
    };

    const currentMonthStartDate = new Date('2024-01-01T00:00:00Z');

    const result = await runTx7Imp1Agent(currentMonthStartDate, mockAiClient);

    expect(result).toBeDefined();
    expect(result.status).toBe('completed');
    expect(result.reportGenerated).toBe(true);

    expect(mockAiClient.callAction01TriggerCheck).toHaveBeenCalled();
    expect(mockAiClient.callAction02ExtractReportingData).toHaveBeenCalled();
    expect(mockAiClient.callAction03GenerateReport).toHaveBeenCalled();
    expect(mockAiClient.callAction04AnalyzeTimeSeriesChange).toHaveBeenCalled();
    expect(mockAiClient.callAction05IdentifyBottleneckShift).toHaveBeenCalled();
    expect(mockAiClient.callAction06CalculateTeamPerformance).toHaveBeenCalled();
    expect(mockAiClient.callAction07PrioritizeAnalysisResults).toHaveBeenCalled();
    expect(mockAiClient.callAction08PresentReportToDirector).toHaveBeenCalled();

    expect(mockAuditLog).toHaveLength(8);
    expect(mockAuditLog[0].actionNumber).toBe(1);
    expect(mockAuditLog[0].promptVersion).toBe(ACTION_01_PROMPT_VERSION);
    expect(mockAuditLog[1].actionNumber).toBe(2);
    expect(mockAuditLog[1].promptVersion).toBe(ACTION_02_PROMPT_VERSION);
    expect(mockAuditLog[2].actionNumber).toBe(3);
    expect(mockAuditLog[2].promptVersion).toBe(ACTION_03_PROMPT_VERSION);
    expect(mockAuditLog[3].actionNumber).toBe(4);
    expect(mockAuditLog[3].promptVersion).toBe(ACTION_04_PROMPT_VERSION);
    expect(mockAuditLog[4].actionNumber).toBe(5);
    expect(mockAuditLog[4].promptVersion).toBe(ACTION_05_PROMPT_VERSION);
    expect(mockAuditLog[5].actionNumber).toBe(6);
    expect(mockAuditLog[5].promptVersion).toBe(ACTION_06_PROMPT_VERSION);
    expect(mockAuditLog[6].actionNumber).toBe(7);
    expect(mockAuditLog[6].promptVersion).toBe(ACTION_07_PROMPT_VERSION);
    expect(mockAuditLog[7].actionNumber).toBe(8);
    expect(mockAuditLog[7].promptVersion).toBe(ACTION_08_PROMPT_VERSION);

    expect(result.analysisResults).toBeDefined();
    expect(result.analysisResults.timeSeriesChange).toEqual(
      mockTimeSeriesAnalysis
    );
    expect(result.analysisResults.bottleneckAnalysis).toEqual(
      mockBottleneckAnalysis
    );
    expect(result.analysisResults.teamPerformance).toEqual(mockTeamPerformance);
    expect(result.analysisResults.priorityAnalysis).toEqual(mockPriorityAnalysis);

    expect(result.finalReport).toBeDefined();
    expect(result.finalReport.generatedDate).toBe('2024-01-01T00:00:00Z');
    expect(result.finalReport.reportPeriod).toBe('January 2024');
    expect(result.finalReport.prioritizedIssues).toHaveLength(3);
    expect(result.finalReport.prioritizedIssues[0].priority).toBe(1);
    expect(result.finalReport.prioritizedIssues[0].level).toBe('High');
    expect(result.finalReport.prioritizedIssues[0].title).toBe(
      'System Integration Delay Improvement'
    );
    expect(result.finalReport.prioritizedIssues[1].priority).toBe(2);
    expect(result.finalReport.prioritizedIssues[1].level).toBe('Medium');
    expect(result.finalReport.prioritizedIssues[1].title).toBe(
      'Issue A Recurrence Prevention'
    );
    expect(result.finalReport.prioritizedIssues[2].priority).toBe(3);
    expect(result.finalReport.prioritizedIssues[2].level).toBe('Low');
    expect(result.finalReport.prioritizedIssues[2].title).toBe('Issue C Tracking');

    expect(result.humanApprovalRequired).toBe(false);
    expect(result.allActionsCompleted).toBe(true);

    const action01Prompt = buildAction01Prompt(currentMonthStartDate);
    expect(action01Prompt).toBeDefined();
    expect(typeof action01Prompt).toBe('string');
    expect(action01Prompt.length).toBeGreaterThan(0);

    const action02Prompt = buildAction02Prompt('2024-01');
    expect(action02Prompt).toBeDefined();
    expect(typeof action02Prompt).toBe('string');
    expect(action02Prompt.length).toBeGreaterThan(0);

    const action03Prompt = buildAction03Prompt(
      mockReportingSystemData.reports.length,
      mockReportingSystemData.teamMembers.length
    );
    expect(action03Prompt).toBeDefined();
    expect(typeof action03Prompt).toBe('string');

    const action04Prompt = buildAction04Prompt(
      mockReportingSystemData.reports
    );
    expect(action04Prompt).toBeDefined();
    expect(typeof action04Prompt).toBe('string');

    const action05Prompt = buildAction05Prompt(
      mockReportingSystemData.reports
    );
    expect(action05Prompt).toBeDefined();
    expect(typeof action05Prompt).toBe('string');

    const action06Prompt = buildAction06Prompt(
      mockReportingSystemData.teamMembers
    );
    expect(action06Prompt).toBeDefined();
    expect(typeof action06Prompt).toBe('string');

    const action07Prompt = buildAction07Prompt([
      mockTimeSeriesAnalysis,
      mockBottleneckAnalysis,
      mockTeamPerformance,
    ]);
    expect(action07Prompt).toBeDefined();
    expect(typeof action07Prompt).toBe('string');

    const action08Prompt = buildAction08Prompt(mockFinalReport);
    expect(action08Prompt).toBeDefined();
    expect(typeof action08Prompt).toBe('string');

    expect(result).toMatchObject({
      status: 'completed',
      reportGenerated: true,
      humanApprovalRequired: false,
      allActionsCompleted: true,
    });
  });
});