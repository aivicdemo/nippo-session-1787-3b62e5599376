import { runTx1Imp1Agent, type Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';
import { buildAction01Prompt, ACTION_01_PROMPT_VERSION } from '../../src/agents/tx-1-imp-1/prompts/action-01';
import { buildAction02Prompt, ACTION_02_PROMPT_VERSION } from '../../src/agents/tx-1-imp-1/prompts/action-02';
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from '../../src/agents/tx-1-imp-1/prompts/action-03';
import { buildAction04Prompt, ACTION_04_PROMPT_VERSION } from '../../src/agents/tx-1-imp-1/prompts/action-04';
import { buildAction05Prompt, ACTION_05_PROMPT_VERSION } from '../../src/agents/tx-1-imp-1/prompts/action-05';
import { buildAction06Prompt, ACTION_06_PROMPT_VERSION } from '../../src/agents/tx-1-imp-1/prompts/action-06';

describe('tx-1-imp-1 Orchestrator - 日報集約から課題優先順位付けと未提出通知までの自律実行', () => {
  // SCEN-3084
  test('should execute autonomous actions for report aggregation, issue prioritization and unsubmitted notifications in correct order', async () => {
    // Setup: Create stub for Tx1Imp1AiClient
    const mockAiClient: Tx1Imp1AiClient = {
      executeAction: jest.fn(),
    };

    // Mock implementation for executeAction to handle all 6 actions
    let actionCount = 0;
    (mockAiClient.executeAction as jest.Mock).mockImplementation(async (prompt: string) => {
      actionCount++;

      if (actionCount === 1) {
        // Action 1: Fetch report submission status
        // Expected: 5 submitted, 3 unsubmitted
        return {
          submitted_count: 5,
          unsubmitted_count: 3,
          submitted_members: [
            { user_id: 'user-1', submitted_at: '2024-01-15T08:30:00Z' },
            { user_id: 'user-2', submitted_at: '2024-01-15T08:35:00Z' },
            { user_id: 'user-3', submitted_at: '2024-01-15T08:40:00Z' },
            { user_id: 'user-4', submitted_at: '2024-01-15T08:45:00Z' },
            { user_id: 'user-5', submitted_at: '2024-01-15T08:50:00Z' },
          ],
          unsubmitted_members: [
            { user_id: 'user-A', name: 'ユーザーA' },
            { user_id: 'user-B', name: 'ユーザーB' },
            { user_id: 'user-C', name: 'ユーザーC' },
          ],
        };
      } else if (actionCount === 2) {
        // Action 2: Send reminder notification to unsubmitted members
        // Expected: 3 notifications sent with delivery log
        return {
          notifications_sent: 3,
          delivery_log: [
            { user_id: 'user-A', status: 'sent', timestamp: '2024-01-15T09:00:01Z' },
            { user_id: 'user-B', status: 'sent', timestamp: '2024-01-15T09:00:02Z' },
            { user_id: 'user-C', status: 'sent', timestamp: '2024-01-15T09:00:03Z' },
          ],
          message: 'ユーザーA・B・C へリマインド送信完了',
        };
      } else if (actionCount === 3) {
        // Action 3: Extract issues and keywords from submitted reports
        // Expected: 3 issues extracted
        return {
          extracted_issues: [
            {
              keyword: 'データベース接続障害',
              occurrence_frequency: 5,
              description: 'DB接続タイムアウトが複数報告',
            },
            {
              keyword: 'テスト環境セットアップ遅延',
              occurrence_frequency: 3,
              description: 'テスト環境の準備が予定より遅れている',
            },
            {
              keyword: '営業資料修正',
              occurrence_frequency: 2,
              description: '営業資料の修正対応が発生',
            },
          ],
        };
      } else if (actionCount === 4) {
        // Action 4: Assign priority scores to extracted issues
        // Expected: Impact scores 85, 60, 30; severity high, medium, low
        return {
          prioritized_issues: [
            {
              keyword: 'データベース接続障害',
              priority: 1,
              impact_score: 85,
              severity: 'high',
            },
            {
              keyword: 'テスト環境セットアップ遅延',
              priority: 2,
              impact_score: 60,
              severity: 'medium',
            },
            {
              keyword: '営業資料修正',
              priority: 3,
              impact_score: 30,
              severity: 'low',
            },
          ],
        };
      } else if (actionCount === 5) {
        // Action 5: Generate morning meeting materials
        // Expected: Materials in priority order
        return {
          meeting_material_generated: true,
          material_content: [
            {
              priority: 1,
              title: '【優先度1】データベース接続障害',
              impact_score: 85,
              action: '即対応',
            },
            {
              priority: 2,
              title: '【優先度2】テスト環境セットアップ遅延',
              impact_score: 60,
              action: '本日中に対応',
            },
            {
              priority: 3,
              title: '【優先度3】営業資料修正',
              impact_score: 30,
              action: '明日までに対応',
            },
          ],
          material_url: 'https://example.com/morning-meeting/2024-01-15',
        };
      } else if (actionCount === 6) {
        // Action 6: Send completion notification to manager
        // Expected: Completion message sent
        return {
          notification_sent: true,
          manager_user_id: 'manager-001',
          message: '朝会資料が完成しました。優先度付き課題3件を確認してください',
          timestamp: '2024-01-15T09:00:10Z',
        };
      }

      throw new Error(`Unexpected action count: ${actionCount}`);
    });

    // Prepare input for runTx1Imp1Agent
    const executionTimestamp = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const morningMeetingStartTime = new Date('2024-01-15T09:30:00Z');
    const targetTeamIds = ['team-001'];
    const managerUserId = 'manager-001';

    const input = {
      executionTimestamp,
      reportDeadlineTime,
      morningMeetingStartTime,
      targetTeamIds,
      managerUserId,
    };

    // Execute the agent
    const output = await runTx1Imp1Agent(input, mockAiClient);

    // Verify execution status
    expect(output.executionStatus).toBe('success');

    // Verify report aggregation summary
    expect(output.reportAggregationSummary).toBeDefined();
    expect(output.reportAggregationSummary.totalTeamMembers).toBe(8); // 5 submitted + 3 unsubmitted
    expect(output.reportAggregationSummary.submittedCount).toBe(5);
    expect(output.reportAggregationSummary.unsubmittedMembers).toHaveLength(3);
    expect(output.reportAggregationSummary.unsubmittedMembers[0].name).toBe('ユーザーA');
    expect(output.reportAggregationSummary.unsubmittedMembers[1].name).toBe('ユーザーB');
    expect(output.reportAggregationSummary.unsubmittedMembers[2].name).toBe('ユーザーC');

    // Verify prioritized issues list
    expect(output.prioritizedIssuesList).toHaveLength(3);
    expect(output.prioritizedIssuesList[0].keyword).toBe('データベース接続障害');
    expect(output.prioritizedIssuesList[0].priority).toBe(1);
    expect(output.prioritizedIssuesList[0].impactScore).toBe(85);
    expect(output.prioritizedIssuesList[0].severity).toBe('high');

    expect(output.prioritizedIssuesList[1].keyword).toBe('テスト環境セットアップ遅延');
    expect(output.prioritizedIssuesList[1].priority).toBe(2);
    expect(output.prioritizedIssuesList[1].impactScore).toBe(60);
    expect(output.prioritizedIssuesList[1].severity).toBe('medium');

    expect(output.prioritizedIssuesList[2].keyword).toBe('営業資料修正');
    expect(output.prioritizedIssuesList[2].priority).toBe(3);
    expect(output.prioritizedIssuesList[2].impactScore).toBe(30);
    expect(output.prioritizedIssuesList[2].severity).toBe('low');

    // Verify morning meeting material URL
    expect(output.morningMeetingMaterialUrl).toBe(
      'https://example.com/morning-meeting/2024-01-15'
    );

    // Verify unsubmitted members notification flag
    expect(output.unsubmittedMembersNotified).toBe(true);

    // Verify execution timestamp
    expect(output.executionTimestamp).toBeInstanceOf(Date);
    expect(output.executionTimestamp.getTime()).toBeGreaterThan(
      executionTimestamp.getTime()
    );

    // Verify all actions were called in correct order
    expect(mockAiClient.executeAction).toHaveBeenCalledTimes(6);

    // Verify action prompts were built correctly for each action
    const action01Prompt = buildAction01Prompt({
      targetTeamIds,
      executionTimestamp,
    });
    expect(action01Prompt).toContain('日報');

    const action02Prompt = buildAction02Prompt({
      unsubmittedMembers: output.reportAggregationSummary.unsubmittedMembers,
      reportDeadlineTime,
    });
    expect(action02Prompt).toContain('通知');

    const action03Prompt = buildAction03Prompt({
      submittedReports: 5,
    });
    expect(action03Prompt).toContain('課題');

    const action04Prompt = buildAction04Prompt({
      extractedIssues: 3,
    });
    expect(action04Prompt).toContain('優先度');

    const action05Prompt = buildAction05Prompt({
      prioritizedIssues: output.prioritizedIssuesList,
    });
    expect(action05Prompt).toContain('朝会資料');

    const action06Prompt = buildAction06Prompt({
      managerUserId,
      materialUrl: output.morningMeetingMaterialUrl,
    });
    expect(action06Prompt).toContain('完成');
  });
});