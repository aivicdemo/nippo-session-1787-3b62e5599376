import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AgentInput, Tx1Imp1AgentOutput } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('Tx1Imp1Agent - Escalation on Critical Incident Detection', () => {
  let mockAiClient: jest.Mocked<Tx1Imp1AiClient>;
  let auditLogEvents: Array<{
    eventType: string;
    timestamp: string;
    escalationReason?: string;
    criticalIncidentCount?: number;
    incidentDetails?: Array<{ id: string; severity: string; reportedContent: string }>;
  }>;

  beforeEach(() => {
    auditLogEvents = [];

    mockAiClient = {
      executeAction01: jest.fn(),
      executeAction02: jest.fn(),
      executeAction03: jest.fn(),
      executeAction04: jest.fn(),
      executeAction05: jest.fn(),
      executeAction06: jest.fn(),
    } as unknown as jest.Mocked<Tx1Imp1AiClient>;

    mockAiClient.executeAction01.mockResolvedValue({
      actionId: '01',
      status: 'completed',
      reportSubmissions: [
        {
          userId: 'user_001',
          teamId: 'team_A',
          submittedAt: new Date('2024-01-15T08:30:00Z'),
          content: 'Daily tasks completed',
        },
        {
          userId: 'user_002',
          teamId: 'team_A',
          submittedAt: new Date('2024-01-15T08:45:00Z'),
          content: 'Backend API development in progress',
        },
      ],
      totalReportCount: 2,
    });

    mockAiClient.executeAction02.mockResolvedValue({
      actionId: '02',
      status: 'completed',
      unsubmittedMembers: [
        {
          userId: 'user_003',
          email: 'user_003@example.com',
          name: 'John Doe',
        },
      ],
      unsubmittedCount: 1,
    });

    mockAiClient.executeAction03.mockResolvedValue({
      actionId: '03',
      status: 'completed',
      extractedIssues: [
        {
          id: 'issue_001',
          title: 'Database connection timeout',
          severity: 'CRITICAL',
          isCriticalIncident: true,
          reportedContent: 'Critical incident: Production database unreachable for 15 minutes',
          reportedBy: 'user_001',
          extractedAt: new Date('2024-01-15T09:00:00Z'),
        },
        {
          id: 'issue_002',
          title: 'Minor UI bug in dashboard',
          severity: 'LOW',
          isCriticalIncident: false,
          reportedContent: 'Dashboard filter button not responding',
          reportedBy: 'user_002',
          extractedAt: new Date('2024-01-15T09:00:00Z'),
        },
      ],
      totalExtractedCount: 2,
    });

    mockAiClient.executeAction04.mockResolvedValue({
      actionId: '04',
      status: 'completed',
      prioritizedIssues: [
        {
          issueId: 'issue_001',
          priority: 1,
          priorityLevel: 'CRITICAL',
          urgencyScore: 95,
          impactScore: 90,
          frequencyScore: 50,
        },
        {
          issueId: 'issue_002',
          priority: 2,
          priorityLevel: 'LOW',
          urgencyScore: 20,
          impactScore: 10,
          frequencyScore: 100,
        },
      ],
      prioritizedCount: 2,
      criticalIssueCount: 1,
      criticalIssueIds: ['issue_001'],
    });

    mockAiClient.executeAction05.mockResolvedValue({
      actionId: '05',
      status: 'pending',
      humanReviewRequired: true,
      escalationReason: 'CRITICAL_INCIDENT_DETECTED',
      escalationContext: {
        detectedAt: new Date('2024-01-15T09:05:00Z'),
        criticalIssues: [
          {
            id: 'issue_001',
            title: 'Database connection timeout',
            severity: 'CRITICAL',
            reportedContent: 'Critical incident: Production database unreachable for 15 minutes',
          },
        ],
      },
      pendingActions: ['朝会資料生成', '部長通知送信'],
      executedActions: ['日報取得', '未提出検出', '課題抽出', '優先順位付与'],
      reportGenerationPending: true,
      notificationSendingPending: true,
    });

    mockAiClient.executeAction06.mockResolvedValue({
      actionId: '06',
      status: 'skipped',
      reason: 'Awaiting human approval on escalation',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-031
  test('should escalate to human review when critical incident detected before finalizing side effects', async () => {
    const input: Tx1Imp1AgentInput = {
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
      reportDeadlineTime: '09:00',
      morningMeetingStartTime: '09:30',
      teamMemberIds: ['user_001', 'user_002', 'user_003'],
      managerEmail: 'manager@example.com',
    };

    let capturedAuditEvent: {
      eventType: string;
      timestamp: string;
      escalationReason?: string;
      criticalIncidentCount?: number;
      incidentDetails?: Array<{ id: string; severity: string; reportedContent: string }>;
    } | null = null;

    const auditLogSpy = jest.fn((event) => {
      capturedAuditEvent = event;
      auditLogEvents.push(event);
    });

    const result: Tx1Imp1AgentOutput & {
      status?: string;
      humanReviewRequired?: boolean;
      escalationReason?: string;
      criticalIncidentIds?: string[];
      pendingActions?: string[];
      executedActions?: string[];
      approvalRequired?: boolean;
      escalationContext?: {
        detectedAt: Date;
        criticalIssues: Array<{
          id: string;
          title: string;
          severity: string;
          reportedContent: string;
        }>;
      };
    } = await runTx1Imp1Agent(input, mockAiClient, auditLogSpy);

    expect(result.status).toBe('ESCALATION_PENDING');
    expect(result.humanReviewRequired).toBe(true);
    expect(result.escalationReason).toBe('CRITICAL_INCIDENT_DETECTED');
    expect(Array.isArray(result.criticalIncidentIds)).toBe(true);
    expect(result.criticalIncidentIds?.length).toBeGreaterThanOrEqual(1);
    expect(result.criticalIncidentIds).toContain('issue_001');

    expect(result.pendingActions).toEqual(['朝会資料生成', '部長通知送信']);
    expect(result.executedActions).toEqual(['日報取得', '未提出検出', '課題抽出', '優先順位付与']);

    expect(mockAiClient.executeAction05).toHaveBeenCalled();
    expect(mockAiClient.executeAction06).not.toHaveBeenCalled();

    expect(result.approvalRequired).toBe(true);
    expect(result.escalationContext).toBeDefined();
    expect(result.escalationContext?.detectedAt).toEqual(new Date('2024-01-15T09:05:00Z'));
    expect(result.escalationContext?.criticalIssues).toBeDefined();
    expect(result.escalationContext?.criticalIssues?.length).toBeGreaterThanOrEqual(1);
    expect(result.escalationContext?.criticalIssues?.[0]?.id).toBe('issue_001');
    expect(result.escalationContext?.criticalIssues?.[0]?.severity).toBe('CRITICAL');

    expect(capturedAuditEvent).toBeDefined();
    expect(capturedAuditEvent?.eventType).toBe('ESCALATION_INITIATED');
    expect(capturedAuditEvent?.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(capturedAuditEvent?.escalationReason).toBe('CRITICAL_INCIDENT_DETECTED');
    expect(capturedAuditEvent?.criticalIncidentCount).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(capturedAuditEvent?.incidentDetails)).toBe(true);
    expect(capturedAuditEvent?.incidentDetails?.length).toBeGreaterThanOrEqual(1);
    expect(capturedAuditEvent?.incidentDetails?.[0]?.id).toBe('issue_001');
    expect(capturedAuditEvent?.incidentDetails?.[0]?.severity).toBe('CRITICAL');
    expect(capturedAuditEvent?.incidentDetails?.[0]?.reportedContent).toContain('Critical incident');

    expect(result.summaryEmailSent).toBe(false);
    expect(result.completionTimestamp).toBeDefined();
  });
});