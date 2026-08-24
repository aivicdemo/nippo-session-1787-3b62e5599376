import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { buildAction01Prompt, ACTION_01_PROMPT_VERSION } from '../../src/agents/tx-4-imp-1/prompts/action-01';
import { buildAction02Prompt, ACTION_02_PROMPT_VERSION } from '../../src/agents/tx-4-imp-1/prompts/action-02';
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from '../../src/agents/tx-4-imp-1/prompts/action-03';
import { buildAction04Prompt, ACTION_04_PROMPT_VERSION } from '../../src/agents/tx-4-imp-1/prompts/action-04';
import { buildAction05Prompt, ACTION_05_PROMPT_VERSION } from '../../src/agents/tx-4-imp-1/prompts/action-05';
import { buildAction06Prompt, ACTION_06_PROMPT_VERSION } from '../../src/agents/tx-4-imp-1/prompts/action-06';
import { buildAction07Prompt, ACTION_07_PROMPT_VERSION } from '../../src/agents/tx-4-imp-1/prompts/action-07';

describe('Tx4Imp1Agent - ダッシュボード分析から課題指示までの自動実行', () => {
  test('SCEN-3128: Normal path - AIエージェントが7つのアクションを完了し、部長向け朝会報告資料を生成する', async () => {
    // Arrange
    const executionId = 'exec-tx4-20240115-001';
    const teamId = 'team-dev-001';
    const managerId = 'user-manager-001';
    const reportDate = '2024-01-15';
    const meetingStartTime = '09:00';

    const request = {
      teamId,
      managerId,
      reportDate,
      meetingStartTime,
    };

    // Mock AI client that tracks action executions
    const executedActions = new Map<string, { promptVersion: string; timestamp: Date }>();

    const fakeAiClient = {
      async executeAction01(prompt: string): Promise<string> {
        const version = ACTION_01_PROMPT_VERSION;
        executedActions.set('action-01', { promptVersion: version, timestamp: new Date() });
        expect(buildAction01Prompt).toBeDefined();
        return JSON.stringify({
          aggregatedProgressData: {
            totalTeamMembers: 10,
            submittedReports: 8,
            pendingReports: 2,
            systemStatus: 'operational',
            lastUpdateTime: '2024-01-15T08:50:00Z',
          },
        });
      },

      async executeAction02(prompt: string): Promise<string> {
        const version = ACTION_02_PROMPT_VERSION;
        executedActions.set('action-02', { promptVersion: version, timestamp: new Date() });
        expect(buildAction02Prompt).toBeDefined();
        return JSON.stringify({
          detectedIssues: [
            {
              issueId: 'issue-001',
              type: 'schedule_delay',
              description: 'Development module A delivery delayed by 2 days',
              severity: 'high',
              affectedMembers: ['emp-001', 'emp-002'],
            },
            {
              issueId: 'issue-002',
              type: 'incomplete_report',
              description: 'emp-009 and emp-010 missing daily reports',
              severity: 'medium',
              affectedMembers: ['emp-009', 'emp-010'],
            },
          ],
        });
      },

      async executeAction03(prompt: string): Promise<string> {
        const version = ACTION_03_PROMPT_VERSION;
        executedActions.set('action-03', { promptVersion: version, timestamp: new Date() });
        expect(buildAction03Prompt).toBeDefined();
        return JSON.stringify({
          similarPastIssues: [
            {
              pastIssueId: 'past-issue-2024-001',
              issueName: 'Module A delays in Q4 2023',
              matchSimilarity: 0.92,
              resolutionDaysInPast: 5,
              rootCauseInPast: 'Resource shortage',
              recurrenceRiskScore: 0.88,
            },
          ],
          recurrenceIndicator: 'HIGH - Similar delay pattern detected within past 30 days',
        });
      },

      async executeAction04(prompt: string): Promise<string> {
        const version = ACTION_04_PROMPT_VERSION;
        executedActions.set('action-04', { promptVersion: version, timestamp: new Date() });
        expect(buildAction04Prompt).toBeDefined();
        return JSON.stringify({
          prioritizedIssues: [
            {
              issueId: 'issue-001',
              description: 'Development module A delivery delayed by 2 days',
              priorityScore: 92,
              priorityRank: 'high',
              urgencyLevel: 'critical',
              importanceLevel: 'high',
              recommendedActionDaysEstimate: 2,
            },
            {
              issueId: 'issue-002',
              description: 'emp-009 and emp-010 missing daily reports',
              priorityScore: 45,
              priorityRank: 'medium',
              urgencyLevel: 'medium',
              importanceLevel: 'medium',
              recommendedActionDaysEstimate: 1,
            },
          ],
        });
      },

      async executeAction05(prompt: string): Promise<string> {
        const version = ACTION_05_PROMPT_VERSION;
        executedActions.set('action-05', { promptVersion: version, timestamp: new Date() });
        expect(buildAction05Prompt).toBeDefined();
        return JSON.stringify({
          countermeasurePlans: [
            {
              issueId: 'issue-001',
              topPriorityAction: 'Allocate additional resources to Module A development team',
              recommendedActions: [
                'Assign 2 senior engineers to accelerate Module A delivery',
                'Conduct daily standup with extended 15-minute technical discussion',
                'Request customer approval for 1-day schedule adjustment',
              ],
              estimatedResolutionDays: 2,
              assignedTeamId: 'team-dev-001',
            },
            {
              issueId: 'issue-002',
              topPriorityAction: 'Send immediate reminder and enforce reporting deadline',
              recommendedActions: [
                'Send escalation reminder to emp-009 and emp-010',
                'Conduct brief 1-on-1 check-in with non-reporters',
                'Update team reporting expectations in Slack channel',
              ],
              estimatedResolutionDays: 0,
              assignedTeamId: 'team-dev-001',
            },
          ],
        });
      },

      async executeAction06(prompt: string): Promise<string> {
        const version = ACTION_06_PROMPT_VERSION;
        executedActions.set('action-06', { promptVersion: version, timestamp: new Date() });
        expect(buildAction06Prompt).toBeDefined();
        return JSON.stringify({
          dashboardReport: {
            reportDate: '2024-01-15',
            generatedAt: '2024-01-15T08:55:00Z',
            progressSummary: {
              totalMembers: 10,
              submittedCount: 8,
              submissionRate: 0.8,
              statusColor: 'yellow',
            },
            prioritizedIssuesSummary: [
              {
                rank: 1,
                issueId: 'issue-001',
                description: 'Development module A delivery delayed by 2 days',
                priorityScore: 92,
                colorCode: 'red',
              },
              {
                rank: 2,
                issueId: 'issue-002',
                description: 'emp-009 and emp-010 missing daily reports',
                priorityScore: 45,
                colorCode: 'yellow',
              },
            ],
            recommendedFocusArea: 'Module A schedule recovery and reporting compliance',
          },
        });
      },

      async executeAction07(prompt: string): Promise<string> {
        const version = ACTION_07_PROMPT_VERSION;
        executedActions.set('action-07', { promptVersion: version, timestamp: new Date() });
        expect(buildAction07Prompt).toBeDefined();
        return JSON.stringify({
          unsubmittedMembers: ['emp-009', 'emp-010'],
          unsubmittedMemberCount: 2,
          totalTeamMembers: 10,
        });
      },
    };

    // Act
    const result = await runTx4Imp1Agent(request, fakeAiClient as any);

    // Assert - Verify all actions were executed
    expect(executedActions.size).toBe(7);
    expect(executedActions.has('action-01')).toBe(true);
    expect(executedActions.has('action-02')).toBe(true);
    expect(executedActions.has('action-03')).toBe(true);
    expect(executedActions.has('action-04')).toBe(true);
    expect(executedActions.has('action-05')).toBe(true);
    expect(executedActions.has('action-06')).toBe(true);
    expect(executedActions.has('action-07')).toBe(true);

    // Verify prompt versions
    const action01 = executedActions.get('action-01');
    expect(action01?.promptVersion).toBe(ACTION_01_PROMPT_VERSION);

    const action02 = executedActions.get('action-02');
    expect(action02?.promptVersion).toBe(ACTION_02_PROMPT_VERSION);

    const action03 = executedActions.get('action-03');
    expect(action03?.promptVersion).toBe(ACTION_03_PROMPT_VERSION);

    const action04 = executedActions.get('action-04');
    expect(action04?.promptVersion).toBe(ACTION_04_PROMPT_VERSION);

    const action05 = executedActions.get('action-05');
    expect(action05?.promptVersion).toBe(ACTION_05_PROMPT_VERSION);

    const action06 = executedActions.get('action-06');
    expect(action06?.promptVersion).toBe(ACTION_06_PROMPT_VERSION);

    const action07 = executedActions.get('action-07');
    expect(action07?.promptVersion).toBe(ACTION_07_PROMPT_VERSION);

    // Assert output structure - aggregated progress data
    expect(result.aggregatedProgressData).toBeDefined();
    expect(result.aggregatedProgressData.totalTeamMembers).toBe(10);
    expect(result.aggregatedProgressData.submittedReports).toBe(8);
    expect(result.aggregatedProgressData.pendingReports).toBe(2);

    // Assert output structure - detected issues
    expect(result.detectedIssues).toBeDefined();
    expect(result.detectedIssues.length).toBe(2);
    expect(result.detectedIssues[0].issueId).toBe('issue-001');
    expect(result.detectedIssues[0].type).toBe('schedule_delay');
    expect(result.detectedIssues[0].severity).toBe('high');

    // Assert output structure - similar past issues and recurrence risk
    expect(result.similarPastIssues).toBeDefined();
    expect(result.similarPastIssues.length).toBeGreaterThan(0);
    expect(result.recurrenceIndicator).toMatch(/HIGH/);

    // Assert output structure - prioritized issues
    expect(result.prioritizedIssues).toBeDefined();
    expect(result.prioritizedIssues.length).toBe(2);
    expect(result.prioritizedIssues[0].priorityScore).toBe(92);
    expect(result.prioritizedIssues[0].priorityRank).toBe('high');
    expect(result.prioritizedIssues[1].priorityScore).toBe(45);
    expect(result.prioritizedIssues[1].priorityRank).toBe('medium');

    // Assert output structure - countermeasure plans
    expect(result.countermeasurePlans).toBeDefined();
    expect(result.countermeasurePlans.length).toBe(2);
    expect(result.countermeasurePlans[0].issueId).toBe('issue-001');
    expect(result.countermeasurePlans[0].recommendedActions.length).toBe(3);
    expect(result.countermeasurePlans[0].estimatedResolutionDays).toBe(2);

    // Assert output structure - dashboard report
    expect(result.dashboardReport).toBeDefined();
    expect(result.dashboardReport.reportDate).toBe('2024-01-15');
    expect(result.dashboardReport.progressSummary.totalMembers).toBe(10);
    expect(result.dashboardReport.progressSummary.submittedCount).toBe(8);
    expect(result.dashboardReport.progressSummary.submissionRate).toBe(0.8);
    expect(result.dashboardReport.prioritizedIssuesSummary.length).toBe(2);
    expect(result.dashboardReport.prioritizedIssuesSummary[0].colorCode).toBe('red');
    expect(result.dashboardReport.prioritizedIssuesSummary[1].colorCode).toBe('yellow');

    // Assert output structure - unsubmitted members
    expect(result.unsubmittedMembers).toBeDefined();
    expect(result.unsubmittedMembers.length).toBe(2);
    expect(result.unsubmittedMembers).toContain('emp-009');
    expect(result.unsubmittedMembers).toContain('emp-010');
    expect(result.unsubmittedMemberCount).toBe(2);
    expect(result.totalTeamMembers).toBe(10);

    // Verify execution completion
    expect(result.executionId).toBe(executionId);
    expect(result.completionStatus).toBe('completed');
    expect(result.completionTimestamp).toBeDefined();
  });
});