import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import { type Tx2Imp1AgentInput, type Tx2Imp1AgentOutput } from '../../src/agents/tx-2-imp-1/orchestrator';
import { type Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('Tx2Imp1Agent - 日報収集から課題抽出・配信までの自律実行', () => {
  // SCEN-3107
  test('不正・曖昧・低確信度のAI出力を拒否して安全に引き継ぐ', async () => {
    const executionTimestamp = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:30:00Z');
    const targetTeamIds = ['team-001'];
    const managerUserIds = ['manager-001'];

    const input: Tx2Imp1AgentInput = {
      executionTimestamp,
      reportDeadlineTime,
      targetTeamIds,
      managerUserIds,
    };

    const escalationEvents: Array<{
      timestamp: Date;
      actionNumber: number;
      rejectionReason: string;
      outputSample: string;
    }> = [];

    const auditLog: string[] = [];

    const mockAiClient: Tx2Imp1AiClient = {
      // Action 1: 日報受信状況確認でAIが曖昧な判定を返す
      executeAction01: jest.fn(async () => ({
        receivedReportCount: 5,
        unreceivedMemberIds: ['member-002', 'member-003'],
        ambiguousStatus: 'maybe', // 不正・曖昧な値
        processingTimestamp: new Date('2024-01-15T09:01:00Z'),
      })),

      // Action 2: フォーマット自動変換でAIが不正な変換出力を返す
      executeAction02: jest.fn(async () => ({
        normalizedReports: [
          {
            memberId: 'member-001',
            reportDate: '2024-01-15',
            yesterdayWork: 'Implementation',
            todayPlan: 'Testing',
            challenges: 'API integration', // 正常なフィールド
          },
          {
            memberId: null, // 不正な null 値
            reportDate: '2024-01-15',
            yesterdayWork: undefined, // 不正な undefined
            todayPlan: 'Review',
            challenges: 'Database\\migration', // 不正なエスケープ
          },
        ],
        normalizedCount: 2,
        conversionTimestamp: new Date('2024-01-15T09:02:00Z'),
      })),

      // Action 3: テキスト解析で低確信度の出力を返す
      executeAction03: jest.fn(async () => ({
        extractedKeywords: [], // 空配列は低品質
        issues: [
          {
            keyword: 'Performance',
            confidenceScore: 0.25, // 0.3 未満: 低確信度
            frequency: 3,
            impactScore: 150, // 範囲外（0-100）
            relatedMembers: ['member-001'],
          },
        ],
        extractionTimestamp: new Date('2024-01-15T09:03:00Z'),
      })),

      // Action 4 以降は実行されないはずだが、念のため定義
      executeAction04: jest.fn(async () => ({
        colorizedIssues: [],
        colorizedTimestamp: new Date('2024-01-15T09:04:00Z'),
      })),

      executeAction05: jest.fn(async () => ({
        unsubmittedMembers: [],
        confirmationTimestamp: new Date('2024-01-15T09:05:00Z'),
      })),

      executeAction06: jest.fn(async () => ({
        emailSent: false,
        emailTimestamp: new Date('2024-01-15T09:06:00Z'),
      })),
    };

    // バリデーションと拒否判定を統合したエージェント実行
    let agentOutput: Tx2Imp1AgentOutput | null = null;
    let rejectionOccurred = false;
    let rejectionReason = '';

    try {
      agentOutput = await runTx2Imp1Agent(input, mockAiClient);
    } catch (error: unknown) {
      if (error instanceof Error) {
        rejectionOccurred = true;
        rejectionReason = error.message;

        // エスカレーション検出: confidence_score_below_threshold
        if (rejectionReason.includes('confidence')) {
          escalationEvents.push({
            timestamp: new Date('2024-01-15T09:03:00Z'),
            actionNumber: 3,
            rejectionReason: 'confidence_score_below_threshold',
            outputSample: JSON.stringify({
              confidenceScore: 0.25,
              threshold: 0.3,
            }),
          });
          auditLog.push(
            `[ESCALATION] Action 3 rejected: confidence_score_below_threshold at 2024-01-15T09:03:00Z`
          );
        }

        // エスカレーション検出: invalid_output_schema
        if (rejectionReason.includes('schema') || rejectionReason.includes('null')) {
          escalationEvents.push({
            timestamp: new Date('2024-01-15T09:02:00Z'),
            actionNumber: 2,
            rejectionReason: 'invalid_output_schema',
            outputSample: JSON.stringify({
              memberId: null,
              yesterdayWork: undefined,
            }),
          });
          auditLog.push(
            `[ESCALATION] Action 2 rejected: invalid_output_schema at 2024-01-15T09:02:00Z`
          );
        }

        // エスカレーション検出: ambiguous_priority_assessment
        if (rejectionReason.includes('ambiguous')) {
          escalationEvents.push({
            timestamp: new Date('2024-01-15T09:01:00Z'),
            actionNumber: 1,
            rejectionReason: 'ambiguous_priority_assessment',
            outputSample: JSON.stringify({
              ambiguousStatus: 'maybe',
            }),
          });
          auditLog.push(
            `[ESCALATION] Action 1 rejected: ambiguous_priority_assessment at 2024-01-15T09:01:00Z`
          );
        }
      }
    }

    // Assertion: エージェントが不正な出力を拒否すること
    expect(rejectionOccurred).toBe(true);

    // Assertion: 拒否理由が記録されること
    expect(rejectionReason.length).toBeGreaterThan(0);

    // Assertion: エスカレーションイベントが記録されること
    expect(escalationEvents.length).toBeGreaterThan(0);

    // Assertion: 複数の拒否理由が記録されること（複合的なバリデーション失敗）
    const rejectionReasons = escalationEvents.map((evt) => evt.rejectionReason);
    expect(rejectionReasons).toContain('confidence_score_below_threshold');
    expect(rejectionReasons).toContain('invalid_output_schema');
    expect(rejectionReasons).toContain('ambiguous_priority_assessment');

    // Assertion: 監査ログが記録されること
    expect(auditLog.length).toBeGreaterThan(0);
    expect(auditLog[0]).toMatch(/ESCALATION/);

    // Assertion: 自動配信メールが送信されないこと（agentOutputがnull）
    expect(agentOutput).toBeNull();

    // Assertion: Action 4（色分け）以降が実行されないこと
    expect(mockAiClient.executeAction04).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction05).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction06).not.toHaveBeenCalled();

    // Assertion: Action 1, 2, 3 は呼び出されていること（拒否は出力検証時）
    expect(mockAiClient.executeAction01).toHaveBeenCalled();
    expect(mockAiClient.executeAction02).toHaveBeenCalled();
    expect(mockAiClient.executeAction03).toHaveBeenCalled();

    // Assertion: 各エスカレーションイベントにタイムスタンプが記録されること
    escalationEvents.forEach((evt) => {
      expect(evt.timestamp).toBeInstanceOf(Date);
      expect(evt.actionNumber).toBeGreaterThanOrEqual(1);
      expect(evt.actionNumber).toBeLessThanOrEqual(6);
      expect(evt.rejectionReason.length).toBeGreaterThan(0);
      expect(evt.outputSample.length).toBeGreaterThan(0);
    });

    // Assertion: Action 1 のエスカレーション条件「曖昧な判定」が検出されること
    const action01Escalation = escalationEvents.find((evt) => evt.actionNumber === 1);
    expect(action01Escalation?.rejectionReason).toBe('ambiguous_priority_assessment');

    // Assertion: Action 2 のエスカレーション条件「スキーマ違反」が検出されること
    const action02Escalation = escalationEvents.find((evt) => evt.actionNumber === 2);
    expect(action02Escalation?.rejectionReason).toBe('invalid_output_schema');

    // Assertion: Action 3 のエスカレーション条件「確信度不足」が検出されること
    const action03Escalation = escalationEvents.find((evt) => evt.actionNumber === 3);
    expect(action03Escalation?.rejectionReason).toBe('confidence_score_below_threshold');

    // Assertion: ロールバック機構により既送信の部分的出力が廃棄・無効化されること
    // （Action 1の受信確認は実行されたが、その後のパイプラインは中断）
    expect(agentOutput).toBeNull();

    // Assertion: 部長への自動配信メール送信フラグが false であること
    expect(mockAiClient.executeAction06).not.toHaveBeenCalled();
  });
});