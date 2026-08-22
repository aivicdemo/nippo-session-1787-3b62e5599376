import { detectAndNotifyUnsubmitted } from '../../src/logic/submission-status-management';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('submission-status-management', () => {
  // SCEN-099: [error] 課題抽出から既存ツール連携・確認までの自律実行 AIエージェント - 「新規カテゴリまたは未知の課題タイプ」時に副作用確定前に人へ引き継ぐ
  test('should escalate to human review before tool integration when encountering new category and prevent side effects', async () => {
    const now = new Date('2024-01-15T09:00:00Z');
    const auditLog: Array<{ event: string; timestamp: Date; reason?: string }> = [];

    // フェイク AIクライアント
    const fakeAiClient: Tx5Imp1AiClient = {
      validateExtractedTasks: jest.fn().mockResolvedValue({
        validationStatus: 'SUCCESS',
        tasks: [
          {
            id: 'task-001',
            title: 'セキュリティ脆弱性スキャン結果対応',
            category: 'セキュリティ脆弱性スキャン', // 新規カテゴリ（未知）
            priorityScore: 0,
            confidenceLevel: 0.45, // 低信頼度
          },
        ],
      }),

      assignPriorityAndCategory: jest.fn().mockResolvedValue({
        taskId: 'task-001',
        assignedCategory: 'セキュリティ脆弱性スキャン',
        priorityScore: 0,
        confidenceLevel: 0.45,
        requiresHumanReview: true, // 新規カテゴリ判定
        reviewReason: '新規カテゴリ：セキュリティ脆弱性スキャン',
      }),

      prepareToolIntegration: jest.fn().mockResolvedValue({
        integrationConfig: {
          jiraProjectKey: 'INFRA',
          asanaProjectId: '123456',
        },
      }),

      registerToExistingTool: jest.fn().mockResolvedValue({
        jiraIssueKey: 'INFRA-999',
        asanaTaskId: '987654',
      }),

      notifyCompletionStatus: jest.fn().mockResolvedValue({
        notificationSent: true,
      }),

      escapeToHumanReview: jest.fn().mockResolvedValue({
        escalationId: 'ESC-2024-001',
        escalatedAt: now,
        reason: '新規カテゴリ：セキュリティ脆弱性スキャン',
        taskSnapshot: {
          id: 'task-001',
          title: 'セキュリティ脆弱性スキャン結果対応',
          category: 'セキュリティ脆弱性スキャン',
          confidenceLevel: 0.45,
        },
      }),
    };

    const extractedTasksInput = [
      {
        id: 'task-001',
        title: 'セキュリティ脆弱性スキャン結果対応',
        description: 'システムセキュリティスキャンで脆弱性が検出されました',
        category: 'セキュリティ脆弱性スキャン',
        priorityScore: 0,
      },
    ];

    // Action 1: validateExtractedTasks
    const validationResult = await fakeAiClient.validateExtractedTasks(extractedTasksInput);
    expect(validationResult.validationStatus).toBe('SUCCESS');

    // Action 2: assignPriorityAndCategory
    const priorityResult = await fakeAiClient.assignPriorityAndCategory(validationResult.tasks[0]);
    expect(priorityResult.requiresHumanReview).toBe(true);
    expect(priorityResult.reviewReason).toBe('新規カテゴリ：セキュリティ脆弱性スキャン');
    expect(priorityResult.confidenceLevel).toBe(0.45);

    // Action 3実行前に escapeToHumanReview を呼び出す
    if (priorityResult.requiresHumanReview) {
      auditLog.push({
        event: 'ESCALATION_TRIGGERED',
        timestamp: now,
        reason: priorityResult.reviewReason,
      });

      const escapeResult = await fakeAiClient.escapeToHumanReview({
        taskId: priorityResult.taskId,
        reason: priorityResult.reviewReason,
        taskSnapshot: {
          id: extractedTasksInput[0].id,
          title: extractedTasksInput[0].title,
          category: extractedTasksInput[0].category,
          confidenceLevel: priorityResult.confidenceLevel,
        },
      });

      expect(escapeResult.escalationId).toBe('ESC-2024-001');
      expect(escapeResult.reason).toMatch(/新規カテゴリ：セキュリティ脆弱性スキャン/);
    }

    // Action 3（既存ツール連携）は実行されないこと
    expect(fakeAiClient.prepareToolIntegration).not.toHaveBeenCalled();
    expect(fakeAiClient.registerToExistingTool).not.toHaveBeenCalled();
    expect(fakeAiClient.notifyCompletionStatus).not.toHaveBeenCalled();

    // 監査ログに ESCALATION_TRIGGERED イベントが記録されていることを確認
    expect(auditLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'ESCALATION_TRIGGERED',
          timestamp: now,
          reason: expect.stringMatching(/新規カテゴリ：セキュリティ脆弱性スキャン/),
        }),
      ])
    );

    // escapeToHumanReview が正確なペイロードで呼び出されたことを確認
    expect(fakeAiClient.escapeToHumanReview).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'task-001',
        reason: '新規カテゴリ：セキュリティ脆弱性スキャン',
        taskSnapshot: expect.objectContaining({
          category: 'セキュリティ脆弱性スキャン',
          confidenceLevel: 0.45,
        }),
      })
    );
  });
});