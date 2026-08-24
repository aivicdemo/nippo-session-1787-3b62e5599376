import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';

const mockFetch = require('jest-fetch-mock');

describe('tx-6-imp-1 agent - weekly report analysis with rollback on partial failure', () => {
  beforeEach(() => {
    mockFetch.enableMocks();
    mockFetch.resetMocks();
  });

  afterEach(() => {
    mockFetch.disableMocks();
  });

  // SCEN-3179: [error] 日報収集から分析レポート生成までの自動実行 AIエージェント - 「日報収集から分析レポート生成までの自動実行」が途中失敗時に完了済みの副作用を巻き戻すか補償する
  test('should rollback completed side effects and send compensating notification when Action 6 fails with TextAnalysisServiceAdapter timeout', async () => {
    const executionTimestamp = new Date('2024-01-15T09:00:00Z');
    const analysisStartDate = '2024-01-08';
    const analysisEndDate = '2024-01-14';
    const teamId = 'team-001';
    const managerUserId = 'mgr-001';

    const mockAiClient = {
      action01_collectWeeklyReports: jest.fn().mockResolvedValue({
        collected_report_count: 10,
        collection_timestamp: executionTimestamp.toISOString(),
        reports: [
          {
            report_id: 'rpt-001',
            author_id: 'eng-001',
            submitted_at: '2024-01-14T08:30:00Z',
            issues_text: 'Database connection timeout during peak hours',
          },
          {
            report_id: 'rpt-002',
            author_id: 'eng-002',
            submitted_at: '2024-01-14T08:45:00Z',
            issues_text: 'Database connection timeout causing delays',
          },
          {
            report_id: 'rpt-003',
            author_id: 'eng-003',
            submitted_at: '2024-01-14T08:35:00Z',
            issues_text: 'API rate limiting on third-party service',
          },
          {
            report_id: 'rpt-004',
            author_id: 'eng-004',
            submitted_at: null,
            issues_text: null,
          },
          {
            report_id: 'rpt-005',
            author_id: 'eng-005',
            submitted_at: '2024-01-13T09:00:00Z',
            issues_text: 'Memory leak in background worker',
          },
          {
            report_id: 'rpt-006',
            author_id: 'eng-006',
            submitted_at: '2024-01-12T08:30:00Z',
            issues_text: 'Database connection timeout intermittent',
          },
          {
            report_id: 'rpt-007',
            author_id: 'eng-007',
            submitted_at: '2024-01-11T08:30:00Z',
            issues_text: 'Deployment pipeline failure',
          },
          {
            report_id: 'rpt-008',
            author_id: 'eng-008',
            submitted_at: '2024-01-10T08:30:00Z',
            issues_text: 'Cache invalidation issue',
          },
          {
            report_id: 'rpt-009',
            author_id: 'eng-009',
            submitted_at: '2024-01-09T08:30:00Z',
            issues_text: 'Database connection timeout stress test',
          },
          {
            report_id: 'rpt-010',
            author_id: 'eng-010',
            submitted_at: null,
            issues_text: null,
          },
        ],
      }),

      action02_identifyNonSubmitters: jest.fn().mockResolvedValue({
        non_submitter_ids: ['eng-004', 'eng-010'],
        reminder_sent_count: 2,
        reminder_sent_at: executionTimestamp.toISOString(),
      }),

      action03_extractIssues: jest.fn().mockResolvedValue({
        extracted_issues: [
          {
            issue_keyword: 'Database connection timeout',
            occurrence_count: 4,
            category: 'infrastructure',
          },
          {
            issue_keyword: 'API rate limiting',
            occurrence_count: 1,
            category: 'integration',
          },
          {
            issue_keyword: 'Memory leak',
            occurrence_count: 1,
            category: 'code_quality',
          },
          {
            issue_keyword: 'Deployment pipeline failure',
            occurrence_count: 1,
            category: 'devops',
          },
          {
            issue_keyword: 'Cache invalidation',
            occurrence_count: 1,
            category: 'infrastructure',
          },
        ],
        extraction_timestamp: executionTimestamp.toISOString(),
      }),

      action04_analyzeTrends: jest.fn().mockResolvedValue({
        trend_data: {
          infrastructure_issues_count: 5,
          integration_issues_count: 1,
          code_quality_issues_count: 1,
          devops_issues_count: 1,
          repeated_issue_count: 1,
          recurring_pattern_detected: true,
        },
        trend_cache_key: 'trend-cache-2024-01-08-to-2024-01-14',
        analysis_timestamp: executionTimestamp.toISOString(),
      }),

      action05_scorePriorities: jest.fn().mockResolvedValue({
        priority_scores: [
          {
            issue_keyword: 'Database connection timeout',
            priority_score: 85,
            priority_rank: 'high',
            occurrence_count: 4,
          },
          {
            issue_keyword: 'API rate limiting',
            priority_score: 45,
            priority_rank: 'medium',
            occurrence_count: 1,
          },
          {
            issue_keyword: 'Memory leak',
            priority_score: 40,
            priority_rank: 'medium',
            occurrence_count: 1,
          },
          {
            issue_keyword: 'Deployment pipeline failure',
            priority_score: 35,
            priority_rank: 'low',
            occurrence_count: 1,
          },
          {
            issue_keyword: 'Cache invalidation',
            priority_score: 30,
            priority_rank: 'low',
            occurrence_count: 1,
          },
        ],
        scoring_timestamp: executionTimestamp.toISOString(),
        scores_persisted_to_db: true,
        persisted_record_ids: ['priority-rec-1', 'priority-rec-2', 'priority-rec-3', 'priority-rec-4', 'priority-rec-5'],
      }),

      action06_generateReport: jest.fn().mockRejectedValue(
        new Error('TextAnalysisServiceAdapter timeout: request exceeded 30000ms limit')
      ),

      action07_deliverReport: jest.fn(),
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        delivery_status: 'sent',
        sent_at: executionTimestamp.toISOString(),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduled: true,
        scheduled_at: executionTimestamp.toISOString(),
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        delivery_status: 'sent',
      }),
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    mockFetch.mockResponseOnce(
      JSON.stringify({
        success: true,
        message: 'Audit log entry created',
      }),
      { status: 200 }
    );

    const result = await runTx6Imp1Agent(
      {
        executionTimestamp,
        analysisStartDate,
        analysisEndDate,
        targetTeamIds: [teamId],
        recipientManagerIds: [managerUserId],
      },
      mockAiClient,
      mockNotificationServiceAdapter,
      mockTextAnalysisServiceAdapter
    );

    expect(result.executionStatus).toBe('partial_failure');

    expect(mockAiClient.action01_collectWeeklyReports).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action02_identifyNonSubmitters).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action03_extractIssues).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action04_analyzeTrends).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action05_scorePriorities).toHaveBeenCalledTimes(1);

    expect(mockAiClient.action06_generateReport).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action07_deliverReport).not.toHaveBeenCalled();

    expect(result.emailDeliveryStatus).toBe('failed');
    expect(result.errorDetails).toMatch(/TextAnalysisServiceAdapter/);

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();
    const compensatingNotificationCall = mockNotificationServiceAdapter.sendReminderNotification.mock.calls.find(
      (call: any[]) => call[0] && call[0].includes && call[0].includes('分析失敗')
    );
    expect(compensatingNotificationCall).toBeDefined();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/audit-log'),
      expect.objectContaining({
        method: 'POST',
      })
    );

    const auditLogCall = await mockFetch.mock.calls[0];
    if (auditLogCall && auditLogCall[1]) {
      const requestBody = JSON.parse(auditLogCall[1].body || '{}');
      expect(requestBody.event_type).toMatch(/PARTIAL_SIDE_EFFECT_ROLLBACK|ROLLBACK/);
      expect(requestBody.actions_rolled_back).toEqual(expect.arrayContaining([3, 4, 5]));
      expect(requestBody.actions_preserved).toEqual(expect.arrayContaining([1, 2]));
    }

    expect(result.reportId).toBeUndefined();
    expect(result.extractedIssueCount).toBeGreaterThan(0);
  });
});