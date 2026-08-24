import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { buildAction01Prompt, ACTION_01_PROMPT_VERSION } from '../../src/agents/tx-4-imp-1/prompts/action-01';
import { buildAction02Prompt, ACTION_02_PROMPT_VERSION } from '../../src/agents/tx-4-imp-1/prompts/action-02';
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from '../../src/agents/tx-4-imp-1/prompts/action-03';
import { buildAction04Prompt, ACTION_04_PROMPT_VERSION } from '../../src/agents/tx-4-imp-1/prompts/action-04';
import { buildAction05Prompt, ACTION_05_PROMPT_VERSION } from '../../src/agents/tx-4-imp-1/prompts/action-05';
import { buildAction06Prompt, ACTION_06_PROMPT_VERSION } from '../../src/agents/tx-4-imp-1/prompts/action-06';
import { buildAction07Prompt, ACTION_07_PROMPT_VERSION } from '../../src/agents/tx-4-imp-1/prompts/action-07';
import { type Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/types';

describe('tx-4-imp-1 orchestrator: ダッシュボード分析から課題指示までの自動実行', () => {
  // SCEN-3134
  test('should execute all 7 autonomous actions and generate morning meeting dashboard report', async () => {
    // 偽AIクライアントのセットアップ
    const fakeAiClient: Tx4Imp1AiClient = {
      generateAction01AggregateProgressData: jest.fn().mockResolvedValue({
        completedTasks: [
          { taskId: 'TASK-001', name: 'Feature A development', owner: 'engineer1', status: 'completed' },
          { taskId: 'TASK-002', name: 'Bug fix B', owner: 'engineer2', status: 'completed' }
        ],
        plannedTasks: [
          { taskId: 'TASK-003', name: 'Feature C development', owner: 'engineer1', status: 'pending' },
          { taskId: 'TASK-004', name: 'Testing phase', owner: 'engineer3', status: 'pending' }
        ],
        aggregatedAt: '2024-01-15T09:00:00Z'
      }),
      generateAction02DetectIssues: jest.fn().mockResolvedValue({
        detectedIssues: [
          {
            issueId: 'ISS-001',
            type: 'delay',
            description: 'Task TASK-005 is overdue by 2 days',
            severity: 'high',
            affectedTeam: ['engineer1', 'engineer4']
          },
          {
            issueId: 'ISS-002',
            type: 'unsubmitted',
            description: 'engineer5 has not submitted daily report',
            severity: 'medium',
            affectedTeam: []
          },
          {
            issueId: 'ISS-003',
            type: 'anomaly',
            description: 'Unusual spike in defect count detected',
            severity: 'high',
            affectedTeam: ['engineer2', 'engineer3', 'engineer6']
          }
        ],
        detectionTimestamp: '2024-01-15T09:05:00Z'
      }),
      generateAction03EvaluateRecurrenceRisk: jest.fn().mockResolvedValue({
        issueRiskAssessments: [
          {
            issueId: 'ISS-001',
            historicalOccurrences: 3,
            lastOccurrenceDate: '2024-01-08T00:00:00Z',
            recurrenceRiskScore: 78,
            similarPastIssues: ['ISS-OLD-001', 'ISS-OLD-002']
          },
          {
            issueId: 'ISS-002',
            historicalOccurrences: 5,
            lastOccurrenceDate: '2024-01-12T00:00:00Z',
            recurrenceRiskScore: 65,
            similarPastIssues: ['ISS-OLD-003']
          },
          {
            issueId: 'ISS-003',
            historicalOccurrences: 0,
            lastOccurrenceDate: null,
            recurrenceRiskScore: 15,
            similarPastIssues: []
          }
        ]
      }),
      generateAction04PrioritizeIssues: jest.fn().mockResolvedValue({
        prioritizedIssues: [
          {
            issueId: 'ISS-001',
            importance: 'high',
            urgency: 'high',
            priorityScore: 95,
            rank: 1
          },
          {
            issueId: 'ISS-003',
            importance: 'high',
            urgency: 'medium',
            priorityScore: 82,
            rank: 2
          },
          {
            issueId: 'ISS-002',
            importance: 'medium',
            urgency: 'low',
            priorityScore: 58,
            rank: 3
          }
        ],
        prioritizationTimestamp: '2024-01-15T09:10:00Z'
      }),
      generateAction05GenerateCountermeasures: jest.fn().mockResolvedValue({
        countermeasures: [
          {
            issueId: 'ISS-001',
            recommendedActions: [
              'Conduct emergency meeting with engineer1 and engineer4 to identify blockers',
              'Allocate additional resources to accelerate task completion',
              'Extend deadline by 1 day if necessary and communicate to stakeholders'
            ],
            estimatedResolutionDays: 1,
            assignedTeamId: 'TEAM-DEV-001'
          },
          {
            issueId: 'ISS-003',
            recommendedActions: [
              'Investigate root cause of defect spike with QA team',
              'Review code changes from last 3 days',
              'Implement preventive measures if systematic issue identified'
            ],
            estimatedResolutionDays: 2,
            assignedTeamId: 'TEAM-QA-001'
          },
          {
            issueId: 'ISS-002',
            recommendedActions: [
              'Send friendly reminder to engineer5 with 1-hour deadline',
              'If still not submitted, director may contact directly before meeting'
            ],
            estimatedResolutionDays: 0,
            assignedTeamId: 'TEAM-DEV-001'
          }
        ]
      }),
      generateAction06GenerateDashboardReport: jest.fn().mockResolvedValue({
        report: {
          reportDate: '2024-01-15',
          yesterdayAccomplishments: [
            'Feature A development completed',
            'Bug fix B resolved',
            'Code review for Feature C initiated'
          ],
          todayPlannedTasks: [
            'Feature C development continuation',
            'Testing phase execution',
            'Integration testing for Feature A'
          ],
          identifiedIssues: [
            {
              issueId: 'ISS-001',
              description: 'Task TASK-005 is overdue by 2 days',
              importance: 'high',
              urgency: 'high',
              priorityScore: 95,
              recommendedActions: [
                'Emergency meeting with team leads',
                'Resource reallocation',
                'Deadline adjustment communication'
              ]
            },
            {
              issueId: 'ISS-003',
              description: 'Unusual spike in defect count detected',
              importance: 'high',
              urgency: 'medium',
              priorityScore: 82,
              recommendedActions: [
                'Root cause investigation',
                'Code review of recent changes',
                'Preventive measure implementation'
              ]
            },
            {
              issueId: 'ISS-002',
              description: 'engineer5 has not submitted daily report',
              importance: 'medium',
              urgency: 'low',
              priorityScore: 58,
              recommendedActions: [
                'Submission reminder notification',
                'Direct contact if necessary'
              ]
            }
          ],
          unsubmittedMembers: ['engineer5'],
          realtimeProgressSummary: {
            totalTeamMembers: 10,
            reportSubmitted: 9,
            tasksCompletedToday: 2,
            tasksPlannedForToday: 4,
            criticalIssuesCount: 2,
            mediumPriorityIssuesCount: 1
          },
          generatedAt: '2024-01-15T09:15:00Z'
        }
      }),
      generateAction07ExtractUnsubmittedMembers: jest.fn().mockResolvedValue({
        unsubmittedMembersDetail: [
          {
            userId: 'engineer5',
            name: 'Engineer 5',
            email: 'engineer5@company.com',
            lastSubmissionDate: '2024-01-14T08:30:00Z',
            submissionDeadline: '2024-01-15T09:00:00Z',
            hoursOverdue: 0.25
          }
        ],
        totalUnsubmittedCount: 1,
        totalTeamMembers: 10,
        notificationsSent: true,
        notificationSentAt: '2024-01-15T09:15:30Z'
      })
    };

    const input: Tx4AgentExecutionRequest = {
      teamId: 'TEAM-DEV-001',
      managerId: 'manager-001',
      reportDate: '2024-01-15',
      meetingStartTime: '09:30'
    };

    // Action プロンプトモジュールが必要な関数とトークンをエクスポートしていることを確認
    expect(typeof buildAction01Prompt).toBe('function');
    expect(typeof ACTION_01_PROMPT_VERSION).toBe('string');
    expect(typeof buildAction02Prompt).toBe('function');
    expect(typeof ACTION_02_PROMPT_VERSION).toBe('string');
    expect(typeof buildAction03Prompt).toBe('function');
    expect(typeof ACTION_03_PROMPT_VERSION).toBe('string');
    expect(typeof buildAction04Prompt).toBe('function');
    expect(typeof ACTION_04_PROMPT_VERSION).toBe('string');
    expect(typeof buildAction05Prompt).toBe('function');
    expect(typeof ACTION_05_PROMPT_VERSION).toBe('string');
    expect(typeof buildAction06Prompt).toBe('function');
    expect(typeof ACTION_06_PROMPT_VERSION).toBe('string');
    expect(typeof buildAction07Prompt).toBe('function');
    expect(typeof ACTION_07_PROMPT_VERSION).toBe('string');

    // runTx4Imp1Agent を実行
    const result = await runTx4Imp1Agent(input, fakeAiClient);

    // 結果の検証
    expect(result).toBeDefined();
    expect(result.executionId).toBeDefined();
    expect(typeof result.executionId).toBe('string');

    // aggregatedReportCount の検証: 実行済み日報 9 件
    expect(result.aggregatedReportCount).toBe(9);

    // extractedIssueCount の検証: 抽出された課題 3 件
    expect(result.extractedIssueCount).toBe(3);

    // prioritizedIssues の検証: 優先順位付き課題リスト
    expect(Array.isArray(result.prioritizedIssues)).toBe(true);
    expect(result.prioritizedIssues.length).toBe(3);

    // 優先度スコア順に並んでいることを確認
    expect(result.prioritizedIssues[0].priorityScore).toBe(95);
    expect(result.prioritizedIssues[1].priorityScore).toBe(82);
    expect(result.prioritizedIssues[2].priorityScore).toBe(58);

    // 最優先課題の詳細確認
    const topPriorityIssue = result.prioritizedIssues[0];
    expect(topPriorityIssue.issueKeyword).toBe('Task overdue');
    expect(topPriorityIssue.importance).toBe('high');
    expect(topPriorityIssue.urgency).toBe('high');
    expect(topPriorityIssue.recurrenceRiskScore).toBe(78);

    // countermeasurePlan の検証
    expect(result.countermeasurePlan).toBeDefined();
    expect(result.countermeasurePlan.topPriorityIssue).toBe('Task overdue');
    expect(Array.isArray(result.countermeasurePlan.recommendedActions)).toBe(true);
    expect(result.countermeasurePlan.recommendedActions.length).toBeLessThanOrEqual(3);
    expect(result.countermeasurePlan.estimatedResolutionDays).toBe(1);
    expect(result.countermeasurePlan.assignedTeamId).toBe('TEAM-DEV-001');

    // 推奨アクションの内容確認
    expect(result.countermeasurePlan.recommendedActions[0]).toMatch(/meeting|blockers/i);
    expect(result.countermeasurePlan.recommendedActions[1]).toMatch(/resource/i);

    // summaryEmailSent の検証
    expect(result.summaryEmailSent).toBe(true);

    // completionTimestamp の検証
    expect(result.completionTimestamp).toBeInstanceOf(Date);
    expect(result.completionTimestamp.getTime()).toBeGreaterThan(0);

    // 朝会報告用ダッシュボード資料の構造確認
    // （generateAction06GenerateDashboardReport の結果が含まれていることを確認）
    expect(result.dashboardReport).toBeDefined();
    if (result.dashboardReport) {
      expect(result.dashboardReport.reportDate).toBe('2024-01-15');
      expect(Array.isArray(result.dashboardReport.yesterdayAccomplishments)).toBe(true);
      expect(Array.isArray(result.dashboardReport.todayPlannedTasks)).toBe(true);
      expect(Array.isArray(result.dashboardReport.identifiedIssues)).toBe(true);

      // 「昨日やったこと」「今日やること」「抱えている課題」の3つの要素確認
      expect(result.dashboardReport.yesterdayAccomplishments.length).toBeGreaterThan(0);
      expect(result.dashboardReport.todayPlannedTasks.length).toBeGreaterThan(0);
      expect(result.dashboardReport.identifiedIssues.length).toBeGreaterThan(0);

      // 未提出メンバーリストの確認
      expect(Array.isArray(result.dashboardReport.unsubmittedMembers)).toBe(true);
      expect(result.dashboardReport.unsubmittedMembers.length).toBeLessThanOrEqual(10);
      expect(result.dashboardReport.unsubmittedMembers[0]).toBe('engineer5');

      // リアルタイム進捗サマリーの確認
      expect(result.dashboardReport.realtimeProgressSummary).toBeDefined();
      expect(result.dashboardReport.realtimeProgressSummary.totalTeamMembers).toBe(10);
      expect(result.dashboardReport.realtimeProgressSummary.reportSubmitted).toBe(9);
    }

    // 偽AIクライアントのメソッドが正しい順序で呼ばれたことを確認
    expect(fakeAiClient.generateAction01AggregateProgressData).toHaveBeenCalledTimes(1);
    expect(fakeAiClient.generateAction02DetectIssues).toHaveBeenCalledTimes(1);
    expect(fakeAiClient.generateAction03EvaluateRecurrenceRisk).toHaveBeenCalledTimes(1);
    expect(fakeAiClient.generateAction04PrioritizeIssues).toHaveBeenCalledTimes(1);
    expect(fakeAiClient.generateAction05GenerateCountermeasures).toHaveBeenCalledTimes(1);
    expect(fakeAiClient.generateAction06GenerateDashboardReport).toHaveBeenCalledTimes(1);
    expect(fakeAiClient.generateAction07ExtractUnsubmittedMembers).toHaveBeenCalledTimes(1);

    // 部員10名規模のチーム向け資料として適切なサイズであることを確認
    expect(result.aggregatedReportCount).toBeLessThanOrEqual(10);
    expect(result.extractedIssueCount).toBeLessThanOrEqual(10);
  });
});