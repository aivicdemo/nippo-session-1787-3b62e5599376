import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';
import { type Tx3Imp1AgentInput, type Tx3Imp1AgentOutput, type ExtractedIssue, type PrioritizedIssue } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('tx-3-imp-1 orchestrator', () => {
  // SCEN-061: [normal] 日報集約から優先度別課題一覧提示までの自動判定・配信
  test('should execute prioritized issue list generation from aggregated reports with all contract requirements', async () => {
    // Setup: Mock aggregated report data (5 reports with multiple issue keywords)
    const aggregatedReports = [
      {
        reportId: 'rpt-001',
        teamId: 'team-001',
        submittedAt: '2024-01-15T08:00:00Z',
        content: 'API response time degradation detected. Customer complaint received. Same issue occurred last month.',
        issueKeywords: ['API performance', 'customer impact', 'recurring'],
        submitterId: 'user-001',
      },
      {
        reportId: 'rpt-002',
        teamId: 'team-001',
        submittedAt: '2024-01-15T08:05:00Z',
        content: 'Database connection pool exhausted in production. Affects all team members. Critical blocker.',
        issueKeywords: ['database', 'production', 'blocker'],
        submitterId: 'user-002',
      },
      {
        reportId: 'rpt-003',
        teamId: 'team-002',
        submittedAt: '2024-01-15T08:10:00Z',
        content: 'Minor UI alignment issue in dashboard. Only visual, no functional impact. Low priority.',
        issueKeywords: ['UI', 'cosmetic'],
        submitterId: 'user-003',
      },
      {
        reportId: 'rpt-004',
        teamId: 'team-001',
        submittedAt: '2024-01-15T08:15:00Z',
        content: 'Deployment pipeline failing intermittently. Affects multiple team members. Third occurrence this week.',
        issueKeywords: ['deployment', 'pipeline', 'recurring'],
        submitterId: 'user-004',
      },
      {
        reportId: 'rpt-005',
        teamId: 'team-003',
        submittedAt: '2024-01-15T08:20:00Z',
        content: 'Documentation outdated for new API endpoint. Causes developer confusion. Departmental impact.',
        issueKeywords: ['documentation', 'API', 'confusion'],
        submitterId: 'user-005',
      },
    ];

    // Setup: Priority determination rules reference table
    const priorityRules = [
      {
        ruleId: 'rule-high-001',
        impactScope: 'company-wide',
        urgency: 'high',
        recurrenceRisk: true,
        priorityLevel: 'High',
      },
      {
        ruleId: 'rule-high-002',
        impactScope: 'company-wide',
        urgency: 'high',
        recurrenceRisk: false,
        priorityLevel: 'High',
      },
      {
        ruleId: 'rule-medium-001',
        impactScope: 'department',
        urgency: 'medium',
        recurrenceRisk: true,
        priorityLevel: 'Medium',
      },
      {
        ruleId: 'rule-medium-002',
        impactScope: 'department',
        urgency: 'medium',
        recurrenceRisk: false,
        priorityLevel: 'Medium',
      },
      {
        ruleId: 'rule-low-001',
        impactScope: 'individual',
        urgency: 'low',
        recurrenceRisk: false,
        priorityLevel: 'Low',
      },
    ];

    // Setup: Fake AI client implementing Tx3Imp1AiClient interface
    const fakeAiClient: Tx3Imp1AiClient = {
      // Action 1: Extract issue keywords
      extractIssueKeywords: jest.fn().mockResolvedValue({
        keywords: ['API performance', 'customer impact', 'database', 'production', 'UI', 'deployment', 'documentation'],
        frequency: { 'API performance': 2, 'customer impact': 1, 'database': 1, 'production': 1, 'UI': 1, 'deployment': 2, 'documentation': 1 },
      }),

      // Action 2: Classify issues
      classifyIssues: jest.fn().mockResolvedValue({
        classifications: [
          { keyword: 'API performance', category: 'Performance' },
          { keyword: 'customer impact', category: 'SLA' },
          { keyword: 'database', category: 'Infrastructure' },
          { keyword: 'production', category: 'Infrastructure' },
          { keyword: 'UI', category: 'Frontend' },
          { keyword: 'deployment', category: 'DevOps' },
          { keyword: 'documentation', category: 'Knowledge' },
        ],
      }),

      // Action 3: Evaluate priority factors
      evaluatePriorityFactors: jest.fn().mockResolvedValue({
        factorAssessments: [
          {
            issueId: 'iss-001',
            impactScope: 'company-wide',
            urgency: 'high',
            recurrenceRisk: true,
          },
          {
            issueId: 'iss-002',
            impactScope: 'company-wide',
            urgency: 'high',
            recurrenceRisk: false,
          },
          {
            issueId: 'iss-003',
            impactScope: 'individual',
            urgency: 'low',
            recurrenceRisk: false,
          },
          {
            issueId: 'iss-004',
            impactScope: 'department',
            urgency: 'medium',
            recurrenceRisk: true,
          },
          {
            issueId: 'iss-005',
            impactScope: 'department',
            urgency: 'medium',
            recurrenceRisk: false,
          },
        ],
      }),

      // Action 4: Generate prioritized issue list (main action)
      generatePrioritizedIssueList: jest.fn().mockResolvedValue({
        prioritizedIssues: [
          {
            priority: 'High',
            issueId: 'iss-001',
            title: 'API response time degradation - customer complaint',
            category: 'Performance',
            ruleId: 'rule-high-001',
            impactScope: 'company-wide',
            urgency: 'high',
            recurrenceRisk: true,
            frequency: 2,
          },
          {
            priority: 'High',
            issueId: 'iss-002',
            title: 'Database connection pool exhausted in production',
            category: 'Infrastructure',
            ruleId: 'rule-high-002',
            impactScope: 'company-wide',
            urgency: 'high',
            recurrenceRisk: false,
            frequency: 1,
          },
          {
            priority: 'Medium',
            issueId: 'iss-004',
            title: 'Deployment pipeline failing intermittently',
            category: 'DevOps',
            ruleId: 'rule-medium-001',
            impactScope: 'department',
            urgency: 'medium',
            recurrenceRisk: true,
            frequency: 2,
          },
          {
            priority: 'Medium',
            issueId: 'iss-005',
            title: 'Documentation outdated for new API endpoint',
            category: 'Knowledge',
            ruleId: 'rule-medium-002',
            impactScope: 'department',
            urgency: 'medium',
            recurrenceRisk: false,
            frequency: 1,
          },
          {
            priority: 'Low',
            issueId: 'iss-003',
            title: 'Minor UI alignment issue in dashboard',
            category: 'Frontend',
            ruleId: 'rule-low-001',
            impactScope: 'individual',
            urgency: 'low',
            recurrenceRisk: false,
            frequency: 1,
          },
        ],
      }),

      // Action 5: Send email notification
      sendEmailNotification: jest.fn().mockResolvedValue({
        emailSent: true,
        recipientEmail: 'manager@company.com',
        sentAt: '2024-01-15T08:30:00Z',
      }),
    };

    // Prepare input
    const input: Tx3Imp1AgentInput = {
      reportAggregationId: 'agg-001',
      analysisExecutionTime: new Date('2024-01-15T08:30:00Z'),
      managerEmail: 'manager@company.com',
      priorityThresholds: {
        highPriorityMinScore: 70,
        mediumPriorityMinScore: 40,
      },
    };

    // Execute: Run the orchestrator
    const result = await runTx3Imp1Agent(input, fakeAiClient);

    // Verify: Action 4 (generate prioritized issue list) was called
    expect(fakeAiClient.generatePrioritizedIssueList).toHaveBeenCalled();

    // Verify: Output structure matches Tx3Imp1AgentOutput contract
    expect(result).toHaveProperty('prioritizedIssueList');
    expect(result).toHaveProperty('executionTimestamp');
    expect(result).toHaveProperty('extractedIssues');
    expect(result).toHaveProperty('emailSendStatus');

    // Verify: Prioritized issue list is an array
    expect(Array.isArray(result.prioritizedIssueList)).toBe(true);
    expect(result.prioritizedIssueList.length).toBe(5);

    // Verify: Each issue contains required fields
    result.prioritizedIssueList.forEach((issue: PrioritizedIssue) => {
      expect(issue).toHaveProperty('priority');
      expect(issue).toHaveProperty('issueId');
      expect(issue).toHaveProperty('title');
      expect(issue).toHaveProperty('category');
      expect(issue).toHaveProperty('ruleId');
      expect(issue).toHaveProperty('impactScope');
      expect(issue).toHaveProperty('urgency');
      expect(issue).toHaveProperty('recurrenceRisk');
    });

    // Verify: Issues are sorted by priority (High → Medium → Low)
    const priorityOrder = ['High', 'Medium', 'Low'];
    for (let i = 1; i < result.prioritizedIssueList.length; i++) {
      const prevPriority = result.prioritizedIssueList[i - 1].priority;
      const currPriority = result.prioritizedIssueList[i].priority;
      const prevIndex = priorityOrder.indexOf(prevPriority);
      const currIndex = priorityOrder.indexOf(currPriority);
      expect(prevIndex).toBeLessThanOrEqual(currIndex);
    }

    // Verify: No duplicate issue IDs
    const issueIds = result.prioritizedIssueList.map((issue: PrioritizedIssue) => issue.issueId);
    const uniqueIssueIds = new Set(issueIds);
    expect(uniqueIssueIds.size).toBe(issueIds.length);
    expect(uniqueIssueIds.size).toBe(5);

    // Verify: Rule IDs match registered rules
    const validRuleIds = priorityRules.map((rule) => rule.ruleId);
    result.prioritizedIssueList.forEach((issue: PrioritizedIssue) => {
      expect(validRuleIds).toContain(issue.ruleId);
    });

    // Verify: All 5 reports' issues are included (data integrity)
    const expectedIssueIds = ['iss-001', 'iss-002', 'iss-003', 'iss-004', 'iss-005'];
    expectedIssueIds.forEach((expectedId: string) => {
      expect(issueIds).toContain(expectedId);
    });

    // Verify: Priority levels are valid
    const validPriorities = ['High', 'Medium', 'Low'];
    result.prioritizedIssueList.forEach((issue: PrioritizedIssue) => {
      expect(validPriorities).toContain(issue.priority);
    });

    // Verify: Execution timestamp is set
    expect(result.executionTimestamp).toBeInstanceOf(Date);

    // Verify: Email send status
    expect(result.emailSendStatus).toBeDefined();
    if (result.emailSendStatus) {
      expect(result.emailSendStatus).toHaveProperty('status');
    }

    // Verify: High priority issues contain expected data
    const highPriorityIssues = result.prioritizedIssueList.filter((issue: PrioritizedIssue) => issue.priority === 'High');
    expect(highPriorityIssues.length).toBeGreaterThanOrEqual(2);
    highPriorityIssues.forEach((issue: PrioritizedIssue) => {
      expect(issue.impactScope).toBe('company-wide');
      expect(issue.urgency).toBe('high');
    });

    // Verify: Ai client boundary - second parameter must be structurally identical to Tx3Imp1AiClient
    expect(typeof fakeAiClient.extractIssueKeywords).toBe('function');
    expect(typeof fakeAiClient.classifyIssues).toBe('function');
    expect(typeof fakeAiClient.evaluatePriorityFactors).toBe('function');
    expect(typeof fakeAiClient.generatePrioritizedIssueList).toBe('function');
    expect(typeof fakeAiClient.sendEmailNotification).toBe('function');
  });
});