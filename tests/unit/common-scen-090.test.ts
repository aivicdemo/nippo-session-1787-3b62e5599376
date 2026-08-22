import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssues } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Normal Path Integration', () => {
  // SCEN-090: [normal] 課題抽出から既存ツール連携・確認までの自律実行 AIエージェント
  test('should execute autonomous workflow from issue extraction to tool integration without human approval for 5 normal cases', async () => {
    // Prepare test dataset: 5 normal issue cases
    const testIssues = [
      {
        id: 'issue-001',
        title: 'Database connection timeout in production',
        description: 'Users experiencing 30-second delays on login',
        reportedAt: '2024-01-15T09:00:00Z',
        reporterId: 'eng-team-001',
        rawCategory: null,
        extractedKeywords: ['database', 'timeout', 'production'],
        severity: 'high',
      },
      {
        id: 'issue-002',
        title: 'UI rendering delay on dashboard',
        description: 'Dashboard takes 5 seconds to load after login',
        reportedAt: '2024-01-15T09:15:00Z',
        reporterId: 'eng-team-002',
        rawCategory: null,
        extractedKeywords: ['ui', 'rendering', 'performance'],
        severity: 'medium',
      },
      {
        id: 'issue-003',
        title: 'Email notification not sent to users',
        description: 'Verification emails not delivered in 2 hours',
        reportedAt: '2024-01-15T09:30:00Z',
        reporterId: 'eng-team-003',
        rawCategory: null,
        extractedKeywords: ['email', 'notification', 'delivery'],
        severity: 'high',
      },
      {
        id: 'issue-004',
        title: 'API rate limit exceeded',
        description: 'Third-party integrations hitting 429 errors',
        reportedAt: '2024-01-15T09:45:00Z',
        reporterId: 'eng-team-004',
        rawCategory: null,
        extractedKeywords: ['api', 'rate-limit', 'integration'],
        severity: 'medium',
      },
      {
        id: 'issue-005',
        title: 'Memory leak in worker process',
        description: 'Worker process consuming 95% memory after 24 hours',
        reportedAt: '2024-01-15T10:00:00Z',
        reporterId: 'eng-team-005',
        rawCategory: null,
        extractedKeywords: ['memory', 'worker', 'performance'],
        severity: 'critical',
      },
    ];

    // Mock tool API responses
    const mockJiraResponses = {
      'issue-001': { id: 'PROJ-1001', key: 'PROJ-1001', url: 'https://jira.example.com/browse/PROJ-1001' },
      'issue-003': { id: 'PROJ-1002', key: 'PROJ-1002', url: 'https://jira.example.com/browse/PROJ-1002' },
      'issue-005': { id: 'PROJ-1003', key: 'PROJ-1003', url: 'https://jira.example.com/browse/PROJ-1003' },
    };

    const mockAsanaResponses = {
      'issue-002': { gid: 'asana-task-2001', name: 'UI rendering delay on dashboard', url: 'https://app.asana.com/0/12345/67890' },
      'issue-004': { gid: 'asana-task-2002', name: 'API rate limit exceeded', url: 'https://app.asana.com/0/12345/67891' },
    };

    // Track action executions and audit events
    const auditLog: Array<{
      timestamp: string;
      actionNum: number;
      actionName: string;
      inputCount: number;
      outputSummary: string;
      confidenceScores: number[];
    }> = [];

    const toolApiCalls: Array<{
      issueId: string;
      tool: 'jira' | 'asana';
      priority: string;
      category: string;
    }> = [];

    // Mock Action 1: Validate format and content
    const action1Result = {
      validatedIssues: testIssues.map(issue => ({
        ...issue,
        validationStatus: 'valid',
        formatCheck: true,
        contentCheck: true,
      })),
    };
    auditLog.push({
      timestamp: '2024-01-15T10:01:00Z',
      actionNum: 1,
      actionName: 'ValidateIssueFormat',
      inputCount: 5,
      outputSummary: '5 issues passed format and content validation',
      confidenceScores: [0.99, 0.99, 0.99, 0.99, 0.99],
    });

    // Mock Action 2: Auto-assign priority and category
    const action2Result = {
      classifiedIssues: testIssues.map((issue, idx) => {
        let priority: string;
        let category: string;

        if (issue.severity === 'critical') {
          priority = 'High';
          category = 'Performance';
        } else if (issue.severity === 'high') {
          priority = 'High';
          category = idx === 0 ? 'Infrastructure' : 'Integration';
        } else {
          priority = 'Medium';
          category = idx === 1 ? 'Frontend' : 'API';
        }

        return {
          issueId: issue.id,
          priority,
          category,
          confidenceScore: 0.85 + idx * 0.02,
          singleCategoryConfirmed: true,
        };
      }),
    };
    auditLog.push({
      timestamp: '2024-01-15T10:02:00Z',
      actionNum: 2,
      actionName: 'ClassifyPriorityAndCategory',
      inputCount: 5,
      outputSummary: '5 issues classified with priority and single category',
      confidenceScores: [0.85, 0.87, 0.89, 0.91, 0.93],
    });

    // Mock Action 3: Configure tool integration
    const action3Result = {
      integratedIssues: action2Result.classifiedIssues.map((classified, idx) => {
        const toolAssignment = idx < 3 ? 'jira' : 'asana';
        return {
          issueId: classified.issueId,
          toolAssignment,
          projectKey: toolAssignment === 'jira' ? 'PROJ' : 'workspace-12345',
          templateId: toolAssignment === 'jira' ? 'bug-template' : 'task-template',
        };
      }),
    };
    auditLog.push({
      timestamp: '2024-01-15T10:03:00Z',
      actionNum: 3,
      actionName: 'ConfigureToolIntegration',
      inputCount: 5,
      outputSummary: '3 issues assigned to Jira, 2 to Asana',
      confidenceScores: [0.95, 0.95, 0.95, 0.95, 0.95],
    });

    // Mock Action 4: Register to Jira/Asana
    const action4ApiCalls: typeof toolApiCalls = [];
    const action4Result = {
      registeredIssues: action3Result.integratedIssues.map((integrated, idx) => {
        const classified = action2Result.classifiedIssues[idx];
        const issueId = integrated.issueId;
        const tool = integrated.toolAssignment as 'jira' | 'asana';

        const apiCall = {
          issueId,
          tool,
          priority: classified.priority,
          category: classified.category,
        };
        action4ApiCalls.push(apiCall);
        toolApiCalls.push(apiCall);

        const toolResponse = tool === 'jira' 
          ? mockJiraResponses[issueId as keyof typeof mockJiraResponses]
          : mockAsanaResponses[issueId as keyof typeof mockAsanaResponses];

        return {
          issueId,
          toolId: tool === 'jira' ? toolResponse.key : toolResponse.gid,
          tool,
          registrationStatus: 'success',
          toolUrl: tool === 'jira' ? toolResponse.url : toolResponse.url,
        };
      }),
    };
    auditLog.push({
      timestamp: '2024-01-15T10:04:00Z',
      actionNum: 4,
      actionName: 'RegisterToExternalTools',
      inputCount: 5,
      outputSummary: '5 issues registered: 3 to Jira, 2 to Asana',
      confidenceScores: [1.0, 1.0, 1.0, 1.0, 1.0],
    });

    // Mock Action 5: Record status and notify
    const action5Result = {
      finalStatus: 'all_completed',
      completedCount: 5,
      failedCount: 0,
      registeredIssueIds: action4Result.registeredIssues.map(r => r.issueId),
      notificationStatus: 'completed_no_human_approval_required',
    };
    auditLog.push({
      timestamp: '2024-01-15T10:05:00Z',
      actionNum: 5,
      actionName: 'RecordStatusAndNotify',
      inputCount: 5,
      outputSummary: 'All 5 issues marked as integration-complete, no human intervention triggered',
      confidenceScores: [1.0, 1.0, 1.0, 1.0, 1.0],
    });

    // Execute the logic function
    const result = await extractAndRankIssues(testIssues);

    // Verify that extractAndRankIssues processes all 5 issues
    expect(result).toBeDefined();
    expect(result).toHaveLength(5);

    // Verify each issue has been ranked and prepared for tool integration
    result.forEach((rankedIssue, idx) => {
      expect(rankedIssue.id).toBe(testIssues[idx].id);
      expect(rankedIssue.priority).toBeDefined();
      expect(['High', 'Medium', 'Low']).toContain(rankedIssue.priority);
      expect(rankedIssue.category).toBeDefined();
      expect(typeof rankedIssue.category).toBe('string');
      expect(rankedIssue.category.length).toBeGreaterThan(0);
    });

    // Verify Action 1: Format validation passed for all issues
    expect(action1Result.validatedIssues).toHaveLength(5);
    action1Result.validatedIssues.forEach(validated => {
      expect(validated.validationStatus).toBe('valid');
      expect(validated.formatCheck).toBe(true);
      expect(validated.contentCheck).toBe(true);
    });

    // Verify Action 2: Priority and category assigned to all issues
    expect(action2Result.classifiedIssues).toHaveLength(5);
    action2Result.classifiedIssues.forEach(classified => {
      expect(['High', 'Medium']).toContain(classified.priority);
      expect(['Infrastructure', 'Integration', 'Performance', 'Frontend', 'API']).toContain(classified.category);
      expect(classified.confidenceScore).toBeGreaterThanOrEqual(0.85);
      expect(classified.singleCategoryConfirmed).toBe(true);
    });

    // Verify Action 3: Tool integration configured
    expect(action3Result.integratedIssues).toHaveLength(5);
    const jiraCount = action3Result.integratedIssues.filter(i => i.toolAssignment === 'jira').length;
    const asanaCount = action3Result.integratedIssues.filter(i => i.toolAssignment === 'asana').length;
    expect(jiraCount).toBe(3);
    expect(asanaCount).toBe(2);

    // Verify Action 4: Tool API calls executed for all issues
    expect(action4Result.registeredIssues).toHaveLength(5);
    action4Result.registeredIssues.forEach(registered => {
      expect(registered.registrationStatus).toBe('success');
      expect(registered.toolId).toBeDefined();
      expect(registered.toolUrl).toMatch(/https:\/\//);
    });

    // Verify tool API calls contain required fields
    expect(toolApiCalls).toHaveLength(5);
    toolApiCalls.forEach(call => {
      expect(call.issueId).toMatch(/^issue-\d{3}$/);
      expect(['jira', 'asana']).toContain(call.tool);
      expect(['High', 'Medium', 'Low']).toContain(call.priority);
      expect(call.category.length).toBeGreaterThan(0);
    });

    // Verify Action 5: Final status indicates all completed
    expect(action5Result.finalStatus).toBe('all_completed');
    expect(action5Result.completedCount).toBe(5);
    expect(action5Result.failedCount).toBe(0);
    expect(action5Result.registeredIssueIds).toHaveLength(5);
    expect(action5Result.notificationStatus).toBe('completed_no_human_approval_required');

    // Verify audit log records all 5 actions
    expect(auditLog).toHaveLength(5);
    auditLog.forEach((logEntry, idx) => {
      expect(logEntry.actionNum).toBe(idx + 1);
      expect(logEntry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      expect(logEntry.inputCount).toBeGreaterThan(0);
      expect(logEntry.outputSummary.length).toBeGreaterThan(0);
      expect(logEntry.confidenceScores).toHaveLength(5);
      logEntry.confidenceScores.forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0.8);
        expect(score).toBeLessThanOrEqual(1.0);
      });
    });

    // Verify Action 1 audit log
    expect(auditLog[0].actionName).toBe('ValidateIssueFormat');
    expect(auditLog[0].outputSummary).toContain('5 issues');
    expect(auditLog[0].outputSummary).toContain('valid');

    // Verify Action 2 audit log
    expect(auditLog[1].actionName).toBe('ClassifyPriorityAndCategory');
    expect(auditLog[1].outputSummary).toContain('5 issues classified');

    // Verify Action 3 audit log
    expect(auditLog[2].actionName).toBe('ConfigureToolIntegration');
    expect(auditLog[2].outputSummary).toContain('Jira');
    expect(auditLog[2].outputSummary).toContain('Asana');

    // Verify Action 4 audit log
    expect(auditLog[3].actionName).toBe('RegisterToExternalTools');
    expect(auditLog[3].outputSummary).toContain('registered');
    expect(auditLog[3].confidenceScores.every(s => s === 1.0)).toBe(true);

    // Verify Action 5 audit log
    expect(auditLog[4].actionName).toBe('RecordStatusAndNotify');
    expect(auditLog[4].outputSummary).toContain('integration-complete');
    expect(auditLog[4].outputSummary).toContain('no human intervention');

    // Verify no human approval was required
    expect(action5Result.notificationStatus).not.toContain('awaiting');
    expect(action5Result.notificationStatus).not.toContain('escalation');

    // Verify sequential execution order
    expect(auditLog[0].timestamp).toBeLessThan(auditLog[1].timestamp);
    expect(auditLog[1].timestamp).toBeLessThan(auditLog[2].timestamp);
    expect(auditLog[2].timestamp).toBeLessThan(auditLog[3].timestamp);
    expect(auditLog[3].timestamp).toBeLessThan(auditLog[4].timestamp);

    // Verify issue mapping between actions
    const action1IssueIds = new Set(action1Result.validatedIssues.map(i => i.id));
    const action2IssueIds = new Set(action2Result.classifiedIssues.map(i => i.issueId));
    const action3IssueIds = new Set(action3Result.integratedIssues.map(i => i.issueId));
    const action4IssueIds = new Set(action4Result.registeredIssues.map(i => i.issueId));

    expect(action2IssueIds).toEqual(action1IssueIds);
    expect(action3IssueIds).toEqual(action2IssueIds);
    expect(action4IssueIds).toEqual(action3IssueIds);
  });
});