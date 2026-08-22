import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { detectAndNotifyUnsubmitted } from '../../src/logic/submission-status-management';

describe('submission-status-management', () => {
  // SCEN-210: [normal] 日報収集・確認・催促の自動化エージェント - 監査記録に開始・各処理・完了イベントが時系列で記録される
  test('should record audit events in chronological order with all required fields', async () => {
    const auditRecords: Array<{
      agent_id: string;
      timestamp: string;
      event_type: string;
      action_id?: string;
      status: string;
      result?: unknown;
    }> = [];

    const mockAuditLogger = {
      logEvent: jest.fn((event: {
        agent_id: string;
        timestamp: string;
        event_type: string;
        action_id?: string;
        status: string;
        result?: unknown;
      }) => {
        auditRecords.push(event);
      }),
    };

    const mockSubmissionStatusService = {
      getSubmissionStatus: jest.fn().mockResolvedValue({
        submitted_count: 18,
        unsubmitted_count: 2,
        unsubmitted_members: [
          { user_id: 'user_001', name: 'Member A', email: 'member_a@company.com' },
          { user_id: 'user_002', name: 'Member B', email: 'member_b@company.com' },
        ],
      }),
      notifyUnsubmitted: jest.fn().mockResolvedValue({
        notification_sent_count: 2,
        success: true,
      }),
    };

    const mockIssueExtractionService = {
      extractIssuesFromReports: jest.fn().mockResolvedValue({
        issues: [
          { id: 'issue_001', title: 'System Performance', severity: 'high' },
          { id: 'issue_002', title: 'Database Connection', severity: 'medium' },
        ],
      }),
    };

    const mockReferenceInformationService = {
      searchSimilarIssues: jest.fn().mockResolvedValue({
        similar_issues: [
          { id: 'past_issue_001', title: 'Previous Performance Issue', resolution: 'Cache optimization' },
        ],
      }),
    };

    const mockPriorityScoreService = {
      calculatePriorityScores: jest.fn().mockResolvedValue({
        prioritized_issues: [
          { id: 'issue_001', score: 85, priority_level: 'HIGH' },
          { id: 'issue_002', score: 60, priority_level: 'MEDIUM' },
        ],
      }),
    };

    const mockSummaryGenerationService = {
      generateMorningBriefSummary: jest.fn().mockResolvedValue({
        summary_id: 'summary_001',
        generated_at: '2024-01-15T06:30:00Z',
        content: 'High priority issues requiring immediate attention',
      }),
    };

    const mockNotificationService = {
      notifyDirector: jest.fn().mockResolvedValue({
        director_notification_id: 'notif_dir_001',
        status: 'sent',
      }),
      notifyMembersWithReferences: jest.fn().mockResolvedValue({
        member_notification_count: 18,
        status: 'sent',
      }),
    };

    const baseTimestamp = new Date('2024-01-15T06:00:00Z').toISOString();
    let callCount = 0;

    const mockGetTimestamp = () => {
      const timestamps = [
        '2024-01-15T06:00:00Z',
        '2024-01-15T06:05:00Z',
        '2024-01-15T06:10:00Z',
        '2024-01-15T06:15:00Z',
        '2024-01-15T06:20:00Z',
        '2024-01-15T06:25:00Z',
        '2024-01-15T06:30:00Z',
        '2024-01-15T06:35:00Z',
        '2024-01-15T06:40:00Z',
      ];
      return timestamps[callCount++];
    };

    const input = {
      audit_logger: mockAuditLogger,
      submission_status_service: mockSubmissionStatusService,
      issue_extraction_service: mockIssueExtractionService,
      reference_information_service: mockReferenceInformationService,
      priority_score_service: mockPriorityScoreService,
      summary_generation_service: mockSummaryGenerationService,
      notification_service: mockNotificationService,
      get_timestamp: mockGetTimestamp,
      agent_id: 'tx-11-imp-1',
      director_email: 'director@company.com',
    };

    await detectAndNotifyUnsubmitted(input);

    expect(auditRecords).toHaveLength(9);

    expect(auditRecords[0]).toEqual({
      agent_id: 'tx-11-imp-1',
      timestamp: '2024-01-15T06:00:00Z',
      event_type: 'STARTED',
      status: 'SUCCESS',
    });

    expect(auditRecords[1]).toEqual({
      agent_id: 'tx-11-imp-1',
      timestamp: '2024-01-15T06:05:00Z',
      event_type: 'action_completed',
      action_id: 'action_01_check_submission_status',
      status: 'SUCCESS',
    });

    expect(auditRecords[2]).toEqual({
      agent_id: 'tx-11-imp-1',
      timestamp: '2024-01-15T06:10:00Z',
      event_type: 'action_completed',
      action_id: 'action_02_notify_unsubmitted',
      status: 'SUCCESS',
    });

    expect(auditRecords[3]).toEqual({
      agent_id: 'tx-11-imp-1',
      timestamp: '2024-01-15T06:15:00Z',
      event_type: 'action_completed',
      action_id: 'action_03_extract_issues',
      status: 'SUCCESS',
    });

    expect(auditRecords[4]).toEqual({
      agent_id: 'tx-11-imp-1',
      timestamp: '2024-01-15T06:20:00Z',
      event_type: 'action_completed',
      action_id: 'action_04_search_references',
      status: 'SUCCESS',
    });

    expect(auditRecords[5]).toEqual({
      agent_id: 'tx-11-imp-1',
      timestamp: '2024-01-15T06:25:00Z',
      event_type: 'action_completed',
      action_id: 'action_05_prioritize_issues',
      status: 'SUCCESS',
    });

    expect(auditRecords[6]).toEqual({
      agent_id: 'tx-11-imp-1',
      timestamp: '2024-01-15T06:30:00Z',
      event_type: 'action_completed',
      action_id: 'action_06_notify_director',
      status: 'SUCCESS',
    });

    expect(auditRecords[7]).toEqual({
      agent_id: 'tx-11-imp-1',
      timestamp: '2024-01-15T06:35:00Z',
      event_type: 'action_completed',
      action_id: 'action_07_provide_member_references',
      status: 'SUCCESS',
    });

    expect(auditRecords[8]).toEqual({
      agent_id: 'tx-11-imp-1',
      timestamp: '2024-01-15T06:40:00Z',
      event_type: 'completion',
      status: 'SUCCESS',
    });

    for (let i = 0; i < auditRecords.length; i++) {
      expect(auditRecords[i]).toHaveProperty('agent_id');
      expect(auditRecords[i]).toHaveProperty('timestamp');
      expect(auditRecords[i]).toHaveProperty('event_type');
      expect(auditRecords[i]).toHaveProperty('status');
      expect(auditRecords[i].agent_id).toBe('tx-11-imp-1');
      expect(auditRecords[i].status).toBe('SUCCESS');
    }

    for (let i = 1; i < 8; i++) {
      expect(auditRecords[i]).toHaveProperty('action_id');
      expect(auditRecords[i].action_id).toMatch(/^action_\d{2}_/);
    }

    const timestamps = auditRecords.map(r => new Date(r.timestamp).getTime());
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1]);
    }

    expect(mockSubmissionStatusService.getSubmissionStatus).toHaveBeenCalledTimes(1);
    expect(mockSubmissionStatusService.notifyUnsubmitted).toHaveBeenCalledTimes(1);
    expect(mockIssueExtractionService.extractIssuesFromReports).toHaveBeenCalledTimes(1);
    expect(mockReferenceInformationService.searchSimilarIssues).toHaveBeenCalledTimes(1);
    expect(mockPriorityScoreService.calculatePriorityScores).toHaveBeenCalledTimes(1);
    expect(mockSummaryGenerationService.generateMorningBriefSummary).toHaveBeenCalledTimes(1);
    expect(mockNotificationService.notifyDirector).toHaveBeenCalledTimes(1);
    expect(mockNotificationService.notifyMembersWithReferences).toHaveBeenCalledTimes(1);
  });
});