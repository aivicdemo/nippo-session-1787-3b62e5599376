import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import { buildAction04Prompt, ACTION_04_PROMPT_VERSION } from '../../src/agents/tx-1-imp-1/prompts/action-04';
import type { Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('Tx1Imp1Agent - 日報集約から課題優先順位付けと未提出通知までの自律実行', () => {
  // SCEN-027: Action 4 課題の重要度と緊急度から優先順位を自動付与
  test('should execute Action 4 autonomously and assign priority scores to extracted issues based on severity and urgency', async () => {
    // 入力データ: 提出済み日報3件から抽出された課題
    const mockSubmittedReports = [
      {
        userId: 'user001',
        userName: 'Team Member A',
        reportDate: '2024-01-15',
        issues: [
          {
            issueId: 'ISSUE-001',
            content: 'Critical production outage - database connection failure',
            severity: 'critical',
            urgency: 'high',
            impactRange: 'all_teams',
            occurrenceFrequency: 'first_time'
          }
        ]
      },
      {
        userId: 'user002',
        userName: 'Team Member B',
        reportDate: '2024-01-15',
        issues: [
          {
            issueId: 'ISSUE-002',
            content: 'Minor documentation update required',
            severity: 'normal',
            urgency: 'low',
            impactRange: 'single_team',
            occurrenceFrequency: 'first_time'
          }
        ]
      },
      {
        userId: 'user003',
        userName: 'Team Member C',
        reportDate: '2024-01-15',
        issues: [
          {
            issueId: 'ISSUE-003',
            content: 'Performance degradation in API endpoint',
            severity: 'medium',
            urgency: 'high',
            impactRange: 'multiple_teams',
            occurrenceFrequency: 'recurring'
          }
        ]
      }
    ];

    const executionTimestamp = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineTime = '09:00';
    const morningMeetingStartTime = '09:30';
    const teamMemberIds = ['user001', 'user002', 'user003'];
    const managerEmail = 'manager@example.com';

    // モック AI クライアント
    let action04PromptBuilderCalls = 0;
    let action04AiResponses = 0;

    const fakeAiClient: Tx1Imp1AiClient = {
      async callAction01(prompt: string): Promise<string> {
        return JSON.stringify({
          unsubmittedMembers: [],
          remindersSent: 0
        });
      },
      async callAction02(prompt: string): Promise<string> {
        return JSON.stringify({
          aggregatedCount: 3,
          extractedIssuesCount: 3
        });
      },
      async callAction03(prompt: string): Promise<string> {
        return JSON.stringify({
          extractedIssues: mockSubmittedReports.flatMap(r => r.issues)
        });
      },
      async callAction04(prompt: string): Promise<string> {
        action04AiResponses++;
        // 優先度計算: 重要度スコア(1-10) + 緊急度スコア(1-10) の加重平均
        // critical + high = 10点 + 10点 = 最高優先度
        // normal + low = 3点 + 2点 = 最低優先度
        // medium + high = 7点 + 10点 = 中程度上位
        return JSON.stringify({
          prioritizedIssues: [
            {
              issueId: 'ISSUE-001',
              content: 'Critical production outage - database connection failure',
              severityScore: 10,
              urgencyScore: 10,
              totalPriorityScore: 10,
              priorityRank: 1
            },
            {
              issueId: 'ISSUE-003',
              content: 'Performance degradation in API endpoint',
              severityScore: 7,
              urgencyScore: 10,
              totalPriorityScore: 8.5,
              priorityRank: 2
            },
            {
              issueId: 'ISSUE-002',
              content: 'Minor documentation update required',
              severityScore: 3,
              urgencyScore: 2,
              totalPriorityScore: 2.5,
              priorityRank: 3
            }
          ]
        });
      },
      async callAction05(prompt: string): Promise<string> {
        return JSON.stringify({
          meetingMaterialGenerated: true,
          contentSectionCount: 5
        });
      },
      async callAction06(prompt: string): Promise<string> {
        return JSON.stringify({
          notificationSent: true
        });
      }
    };

    // buildAction04Prompt が正しくエクスポートされていることを確認
    expect(typeof buildAction04Prompt).toBe('function');
    expect(ACTION_04_PROMPT_VERSION).toBeDefined();

    // buildAction04Prompt を呼び出し、プロンプトが生成されることを確認
    const action04Prompt = buildAction04Prompt(
      mockSubmittedReports.flatMap(r => r.issues),
      {
        severityWeights: { critical: 10, high: 7, medium: 5, low: 3, normal: 3 },
        urgencyWeights: { high: 10, medium: 5, low: 2 }
      }
    );
    expect(action04Prompt).toBeTruthy();
    expect(typeof action04Prompt).toBe('string');
    expect(action04Prompt.length).toBeGreaterThan(0);

    // オーケストレータを実行
    const result = await runTx1Imp1Agent(
      {
        executionTimestamp,
        reportDeadlineTime,
        morningMeetingStartTime,
        teamMemberIds,
        managerEmail
      },
      fakeAiClient
    );

    // 返却値の検証
    expect(result).toBeDefined();
    expect(result.executionStatus).toMatch(/success|partial_failure|failure/);
    expect(result.aggregatedReportCount).toBe(3);
    expect(result.extractedIssueCount).toBe(3);

    // Action 4 が返却する優先度付き課題一覧の検証
    expect(result.prioritizedIssueList).toBeDefined();
    expect(Array.isArray(result.prioritizedIssueList)).toBe(true);
    expect(result.prioritizedIssueList.length).toBeGreaterThan(0);

    // 優先度順が正確に計算されていることを検証
    // ISSUE-001: severity=10, urgency=10 → totalScore=10, rank=1
    const issue001 = result.prioritizedIssueList.find(
      issue => issue.issueId === 'ISSUE-001'
    );
    expect(issue001).toBeDefined();
    expect(issue001!.priorityRank).toBe(1);
    expect(issue001!.totalPriorityScore).toBe(10);

    // ISSUE-003: severity=7, urgency=10 → totalScore≈8.5, rank=2
    const issue003 = result.prioritizedIssueList.find(
      issue => issue.issueId === 'ISSUE-003'
    );
    expect(issue003).toBeDefined();
    expect(issue003!.priorityRank).toBe(2);
    expect(issue003!.totalPriorityScore).toBe(8.5);

    // ISSUE-002: severity=3, urgency=2 → totalScore=2.5, rank=3
    const issue002 = result.prioritizedIssueList.find(
      issue => issue.issueId === 'ISSUE-002'
    );
    expect(issue002).toBeDefined();
    expect(issue002!.priorityRank).toBe(3);
    expect(issue002!.totalPriorityScore).toBe(2.5);

    // 返却されるレスポンスが後続 Action 5 で消費可能な構造か確認
    result.prioritizedIssueList.forEach(issue => {
      expect(issue.issueId).toBeDefined();
      expect(typeof issue.issueId).toBe('string');
      expect(issue.content).toBeDefined();
      expect(typeof issue.content).toBe('string');
      expect(typeof issue.severityScore).toBe('number');
      expect(typeof issue.urgencyScore).toBe('number');
      expect(typeof issue.totalPriorityScore).toBe('number');
      expect(typeof issue.priorityRank).toBe('number');
    });

    // Action 4 呼び出しが正確に実行されたことを確認
    expect(action04AiResponses).toBe(1);

    // 冪等性検証: 同一入力で再実行
    const result2 = await runTx1Imp1Agent(
      {
        executionTimestamp,
        reportDeadlineTime,
        morningMeetingStartTime,
        teamMemberIds,
        managerEmail
      },
      fakeAiClient
    );

    // 同一出力が得られることを確認
    expect(result2.prioritizedIssueList.length).toBe(result.prioritizedIssueList.length);
    expect(result2.prioritizedIssueList[0].issueId).toBe(result.prioritizedIssueList[0].issueId);
    expect(result2.prioritizedIssueList[0].priorityRank).toBe(result.prioritizedIssueList[0].priorityRank);

    // completionTimestamp が設定されていることを確認
    expect(result.completionTimestamp).toBeInstanceOf(Date);
    expect(result.completionTimestamp.getTime()).toBeGreaterThanOrEqual(
      executionTimestamp.getTime()
    );
  });
});