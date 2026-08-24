import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';
import type { Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';
import type { Tx9AggregationRequest, Tx9AnalysisReport, ProductivityMetrics, PrioritizedIssue, CountermeasureProposal } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('Tx9Imp1Agent - 日報集約から分析報告までの自動実行エージェント', () => {
  // SCEN-3222
  test('should execute Action 1-7 in order and generate comprehensive analysis report with productivity metrics, prioritized issues, and countermeasures', async () => {
    const aggregationStartDate = '2026-08-19';
    const aggregationEndDate = '2026-08-25';
    const targetTeamIds: string[] = [];
    const requestedByUserId = 'manager-001';

    const mockAggregationRequest: Tx9AggregationRequest = {
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      requestedByUserId,
    };

    const mockSubmittedReports = [
      {
        memberId: 'eng-001',
        memberName: 'Engineer A',
        submittedAt: '2026-08-19T09:15:00Z',
        yesterday: 'Completed feature X implementation',
        today: 'Review code and deploy to staging',
        issues: 'Database query performance issue affecting search feature',
      },
      {
        memberId: 'eng-002',
        memberName: 'Engineer B',
        submittedAt: '2026-08-19T09:22:00Z',
        yesterday: 'Fixed bug in authentication module',
        today: 'Unit testing and integration testing',
        issues: 'Database query performance issue affecting search feature, Memory leak in caching layer',
      },
      {
        memberId: 'eng-003',
        memberName: 'Engineer C',
        submittedAt: '2026-08-19T09:18:00Z',
        yesterday: 'Refactored API endpoints',
        today: 'Documentation update',
        issues: 'API rate limiting configuration needs review',
      },
      {
        memberId: 'eng-004',
        memberName: 'Engineer D',
        submittedAt: '2026-08-19T09:25:00Z',
        yesterday: 'Database migration planning',
        today: 'Execute migration scripts',
        issues: 'Database query performance issue affecting search feature',
      },
      {
        memberId: 'eng-005',
        memberName: 'Engineer E',
        submittedAt: '2026-08-19T09:30:00Z',
        yesterday: 'Security audit preparation',
        today: 'Conduct security review',
        issues: 'Memory leak in caching layer',
      },
      {
        memberId: 'eng-006',
        memberName: 'Engineer F',
        submittedAt: '2026-08-19T09:20:00Z',
        yesterday: 'Documentation completed',
        today: 'Training materials preparation',
        issues: 'API rate limiting configuration needs review',
      },
      {
        memberId: 'eng-007',
        memberName: 'Engineer G',
        submittedAt: '2026-08-19T09:28:00Z',
        yesterday: 'Infrastructure setup',
        today: 'Monitoring setup',
        issues: 'Deployment pipeline reliability',
      },
      {
        memberId: 'eng-008',
        memberName: 'Engineer H',
        submittedAt: '2026-08-19T09:19:00Z',
        yesterday: 'Test suite enhancement',
        today: 'Coverage analysis',
        issues: 'Database query performance issue affecting search feature',
      },
      {
        memberId: 'eng-009',
        memberName: 'Engineer I',
        submittedAt: '2026-08-19T09:26:00Z',
        yesterday: 'Requirements gathering',
        today: 'Design specification',
        issues: 'Unclear requirements from stakeholders',
      },
      {
        memberId: 'eng-010',
        memberName: 'Engineer J',
        submittedAt: '2026-08-19T09:23:00Z',
        yesterday: 'Release notes preparation',
        today: 'Release communication',
        issues: 'Memory leak in caching layer, Deployment pipeline reliability',
      },
    ];

    const unsubmittedMemberIds: string[] = [];

    const notificationSuccessResponse = { status: 'success', sentAt: '2026-08-19T09:31:00Z' };

    const mockAiClient: Tx9Imp1AiClient = {
      action01AggregateReports: jest.fn().mockResolvedValue({
        aggregatedReports: mockSubmittedReports,
        totalSubmitted: 10,
        totalExpected: 10,
        periodStart: aggregationStartDate,
        periodEnd: aggregationEndDate,
      }),

      action02DetectAndNotifyUnsubmitted: jest.fn().mockResolvedValue({
        unsubmittedMembers: unsubmittedMemberIds,
        notificationStatus: 'completed',
        notificationDetails: [],
      }),

      action03QuantifyProductivityMetrics: jest.fn().mockResolvedValue({
        totalIssueCount: 11,
        averageResolutionDays: 3.2,
        completionRate: 87.5,
        issueFrequencyPerDay: 1.57,
        averageResolutionDaysResult: 3.2,
        completionRateResult: 87.5,
      }),

      action04ClassifyAndAnalyzeByPriority: jest.fn().mockResolvedValue({
        highPriority: [
          {
            issueId: 'issue-001',
            keyword: 'Database query performance issue affecting search feature',
            frequency: 4,
            impactScore: 85,
            priority: 'high',
            affectedMembers: ['eng-001', 'eng-002', 'eng-004', 'eng-008'],
          },
          {
            issueId: 'issue-002',
            keyword: 'Memory leak in caching layer',
            frequency: 3,
            impactScore: 78,
            priority: 'high',
            affectedMembers: ['eng-002', 'eng-005', 'eng-010'],
          },
        ],
        mediumPriority: [
          {
            issueId: 'issue-003',
            keyword: 'API rate limiting configuration needs review',
            frequency: 2,
            impactScore: 62,
            priority: 'medium',
            affectedMembers: ['eng-003', 'eng-006'],
          },
          {
            issueId: 'issue-004',
            keyword: 'Deployment pipeline reliability',
            frequency: 2,
            impactScore: 58,
            priority: 'medium',
            affectedMembers: ['eng-007', 'eng-010'],
          },
        ],
        lowPriority: [
          {
            issueId: 'issue-005',
            keyword: 'Unclear requirements from stakeholders',
            frequency: 1,
            impactScore: 45,
            priority: 'low',
            affectedMembers: ['eng-009'],
          },
        ],
      }),

      action05DetectRecurrencePatterns: jest.fn().mockResolvedValue({
        recurringIssues: [
          {
            issueId: 'issue-001',
            keyword: 'Database query performance issue affecting search feature',
            firstReportedDate: '2026-08-12',
            occurrenceCount: 4,
            lastReportedDate: '2026-08-19',
            recurrenceInterval: 1.75,
            riskLevel: 'critical',
          },
          {
            issueId: 'issue-002',
            keyword: 'Memory leak in caching layer',
            firstReportedDate: '2026-08-15',
            occurrenceCount: 3,
            lastReportedDate: '2026-08-19',
            recurrenceInterval: 2.0,
            riskLevel: 'high',
          },
        ],
        newIssues: [
          {
            issueId: 'issue-005',
            keyword: 'Unclear requirements from stakeholders',
            reportedDate: '2026-08-19',
            priority: 'low',
          },
        ],
      }),

      action06ProposeCoutermeasures: jest.fn().mockResolvedValue({
        countermeasures: [
          {
            measureId: 'cm-001',
            targetIssueId: 'issue-001',
            title: 'Optimize database query indexes',
            description: 'Add composite indexes to frequently queried columns',
            expectedEffectiveness: 85,
            estimatedEffort: 5,
            feasibility: 0.92,
            recommendedPriority: 'high',
          },
          {
            measureId: 'cm-002',
            targetIssueId: 'issue-002',
            title: 'Implement cache lifecycle management',
            description: 'Add TTL-based cache eviction and memory monitoring',
            expectedEffectiveness: 78,
            estimatedEffort: 8,
            feasibility: 0.88,
            recommendedPriority: 'high',
          },
          {
            measureId: 'cm-003',
            targetIssueId: 'issue-003',
            title: 'Review and configure rate limiting thresholds',
            description: 'Analyze current usage patterns and adjust limits',
            expectedEffectiveness: 65,
            estimatedEffort: 3,
            feasibility: 0.95,
            recommendedPriority: 'medium',
          },
          {
            measureId: 'cm-004',
            targetIssueId: 'issue-004',
            title: 'Implement automated deployment rollback',
            description: 'Add health checks and automatic rollback on failure',
            expectedEffectiveness: 72,
            estimatedEffort: 6,
            feasibility: 0.85,
            recommendedPriority: 'medium',
          },
        ],
      }),

      action07GenerateAndFormatReport: jest.fn().mockResolvedValue({
        reportId: 'report-tx9-20260819-001',
        aggregationPeriod: {
          startDate: aggregationStartDate,
          endDate: aggregationEndDate,
        },
        productivityMetrics: {
          issueResolutionSpeed: 3.2,
          reportSubmissionRate: 100,
          issueRecurrenceRate: 36.36,
        },
        prioritizedIssues: [
          {
            rank: 1,
            issueId: 'issue-001',
            keyword: 'Database query performance issue affecting search feature',
            frequency: 4,
            impactScore: 85,
            priority: 'high',
            color: 'red',
            affectedMemberCount: 4,
          },
          {
            rank: 2,
            issueId: 'issue-002',
            keyword: 'Memory leak in caching layer',
            frequency: 3,
            impactScore: 78,
            priority: 'high',
            color: 'red',
            affectedMemberCount: 3,
          },
          {
            rank: 3,
            issueId: 'issue-003',
            keyword: 'API rate limiting configuration needs review',
            frequency: 2,
            impactScore: 62,
            priority: 'medium',
            color: 'yellow',
            affectedMemberCount: 2,
          },
          {
            rank: 4,
            issueId: 'issue-004',
            keyword: 'Deployment pipeline reliability',
            frequency: 2,
            impactScore: 58,
            priority: 'medium',
            color: 'yellow',
            affectedMemberCount: 2,
          },
          {
            rank: 5,
            issueId: 'issue-005',
            keyword: 'Unclear requirements from stakeholders',
            frequency: 1,
            impactScore: 45,
            priority: 'low',
            color: 'green',
            affectedMemberCount: 1,
          },
        ],
        recommendedCountermeasures: [
          {
            measureId: 'cm-001',
            targetIssue: 'Database query performance issue affecting search feature',
            measureTitle: 'Optimize database query indexes',
            description: 'Add composite indexes to frequently queried columns',
            expectedEffect: '85% issue resolution expected',
            effortDays: 5,
            feasibility: 0.92,
            priority: 'high',
          },
          {
            measureId: 'cm-002',
            targetIssue: 'Memory leak in caching layer',
            measureTitle: 'Implement cache lifecycle management',
            description: 'Add TTL-based cache eviction and memory monitoring',
            expectedEffect: '78% issue resolution expected',
            effortDays: 8,
            feasibility: 0.88,
            priority: 'high',
          },
          {
            measureId: 'cm-003',
            targetIssue: 'API rate limiting configuration needs review',
            measureTitle: 'Review and configure rate limiting thresholds',
            description: 'Analyze current usage patterns and adjust limits',
            expectedEffect: '65% issue resolution expected',
            effortDays: 3,
            feasibility: 0.95,
            priority: 'medium',
          },
          {
            measureId: 'cm-004',
            targetIssue: 'Deployment pipeline reliability',
            measureTitle: 'Implement automated deployment rollback',
            description: 'Add health checks and automatic rollback on failure',
            expectedEffect: '72% issue resolution expected',
            effortDays: 6,
            feasibility: 0.85,
            priority: 'medium',
          },
        ],
        generatedAt: '2026-08-19T10:00:00Z',
        textSummary: `Aggregation Period: 2026-08-19 to 2026-08-25
Total Reports Submitted: 10/10 (100%)
Total Issues Identified: 11

Productivity Metrics:
- Issue Resolution Speed: 3.2 days average
- Report Submission Rate: 100%
- Issue Recurrence Rate: 36.36%

Priority Breakdown:
- High Priority Issues: 2 (54% of impact)
- Medium Priority Issues: 2 (31% of impact)
- Low Priority Issues: 1 (15% of impact)

Top 2 Recurring Issues:
1. Database query performance issue affecting search feature (4 occurrences, recurrence interval: 1.75 days)
2. Memory leak in caching layer (3 occurrences, recurrence interval: 2.0 days)

Recommended Immediate Actions:
1. Optimize database query indexes (Expected 85% resolution, 5 days effort, 92% feasibility)
2. Implement cache lifecycle management (Expected 78% resolution, 8 days effort, 88% feasibility)`,
      }),
    };

    const result = await runTx9Imp1Agent(mockAggregationRequest, mockAiClient);

    expect(mockAiClient.action01AggregateReports).toHaveBeenCalledWith(
      expect.objectContaining({
        periodStart: aggregationStartDate,
        periodEnd: aggregationEndDate,
      })
    );

    expect(mockAiClient.action02DetectAndNotifyUnsubmitted).toHaveBeenCalled();
    expect(mockAiClient.action03QuantifyProductivityMetrics).toHaveBeenCalled();
    expect(mockAiClient.action04ClassifyAndAnalyzeByPriority).toHaveBeenCalled();
    expect(mockAiClient.action05DetectRecurrencePatterns).toHaveBeenCalled();
    expect(mockAiClient.action06ProposeCoutermeasures).toHaveBeenCalled();
    expect(mockAiClient.action07GenerateAndFormatReport).toHaveBeenCalled();

    expect(result).toBeDefined();
    expect(result.reportId).toBe('report-tx9-20260819-001');
    expect(result.aggregationPeriod).toEqual({
      startDate: aggregationStartDate,
      endDate: aggregationEndDate,
    });

    expect(result.productivityMetrics).toBeDefined();
    expect(result.productivityMetrics.issueResolutionSpeed).toBe(3.2);
    expect(result.productivityMetrics.reportSubmissionRate).toBe(100);
    expect(result.productivityMetrics.issueRecurrenceRate).toBe(36.36);

    expect(result.prioritizedIssues).toBeDefined();
    expect(result.prioritizedIssues.length).toBe(5);

    const highPriorityIssues = result.prioritizedIssues.filter(
      (issue: PrioritizedIssue) => issue.priority === 'high'
    );
    expect(highPriorityIssues.length).toBe(2);
    expect(highPriorityIssues[0].keyword).toBe(
      'Database query performance issue affecting search feature'
    );
    expect(highPriorityIssues[0].frequency).toBe(4);
    expect(highPriorityIssues[0].impactScore).toBe(85);

    const mediumPriorityIssues = result.prioritizedIssues.filter(
      (issue: PrioritizedIssue) => issue.priority === 'medium'
    );
    expect(mediumPriorityIssues.length).toBe(2);

    const lowPriorityIssues = result.prioritizedIssues.filter(
      (issue: PrioritizedIssue) => issue.priority === 'low'
    );
    expect(lowPriorityIssues.length).toBe(1);

    expect(result.recommendedCountermeasures).toBeDefined();
    expect(result.recommendedCountermeasures.length).toBe(4);

    const highPriorityCountermeasures = result.recommendedCountermeasures.filter(
      (cm: CountermeasureProposal) => cm.priority === 'high'
    );
    expect(highPriorityCountermeasures.length).toBe(2);
    expect(highPriorityCountermeasures[0].measureTitle).toBe(
      'Optimize database query indexes'
    );
    expect(highPriorityCountermeasures[0].expectedEffect).toBe(
      '85% issue resolution expected'
    );
    expect(highPriorityCountermeasures[0].effortDays).toBe(5);
    expect(highPriorityCountermeasures[0].feasibility).toBe(0.92);

    expect(result.generatedAt).toBe('2026-08-19T10:00:00Z');

    expect(result.textSummary).toBeDefined();
    expect(result.textSummary).toContain('Aggregation Period: 2026-08-19 to 2026-08-25');
    expect(result.textSummary).toContain('Total Reports Submitted: 10/10 (100%)');
    expect(result.textSummary).toContain('Total Issues Identified: 11');
    expect(result.textSummary).toContain('Issue Resolution Speed: 3.2 days average');
    expect(result.textSummary).toContain('Report Submission Rate: 100%');
    expect(result.textSummary).toContain('Issue Recurrence Rate: 36.36%');
    expect(result.textSummary).toContain(
      'Database query performance issue affecting search feature (4 occurrences'
    );
    expect(result.textSummary).toContain('Optimize database query indexes');
  });
});