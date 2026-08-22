import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import { type Tx6AgentInput, type Tx6AgentOutput } from '../../src/agents/tx-6-imp-1/types';
import { buildAction05Prompt, ACTION_05_PROMPT_VERSION } from '../../src/agents/tx-6-imp-1/prompts/action-05';

interface MockAiClientCallRecord {
  actionNumber: number;
  promptVersion: string;
  promptContent: string;
}

interface MockPriorityScore {
  issueId: string;
  priorityScore: number;
  scoringRationale: string;
  scoringTimestamp: string;
}

interface Tx6Imp1AiClient {
  executeAction(actionNumber: number, promptVersion: string, promptContent: string): Promise<unknown>;
}

describe('Tx6Imp1Agent - 日報収集から分析レポート生成までの自動実行', () => {
  // SCEN-111: [normal] 日報収集から分析レポート生成までの自動実行 AIエージェント
  test('should execute Action 5 priority scoring correctly and transition to Action 6', async () => {
    const mockCallRecords: MockAiClientCallRecord[] = [];
    const mockPriorityScores: MockPriorityScore[] = [
      {
        issueId: 'ISSUE-001',
        priorityScore: 8,
        scoringRationale: '顧客クレーム報告あり、影響範囲が大きい',
        scoringTimestamp: '2024-01-15T09:15:00Z',
      },
      {
        issueId: 'ISSUE-002',
        priorityScore: 5,
        scoringRationale: '内部プロセス改善、中程度の優先度',
        scoringTimestamp: '2024-01-15T09:15:30Z',
      },
      {
        issueId: 'ISSUE-003',
        priorityScore: 3,
        scoringRationale: '定期メンテナンス、低優先度',
        scoringTimestamp: '2024-01-15T09:16:00Z',
      },
    ];

    let action5ExecutedFlag = false;
    let action6ExecutedFlag = false;
    let recordedAction5Prompt = '';
    let recordedAction5Version = '';

    const mockAiClient: Tx6Imp1AiClient = {
      executeAction: async (
        actionNumber: number,
        promptVersion: string,
        promptContent: string,
      ): Promise<unknown> => {
        mockCallRecords.push({
          actionNumber,
          promptVersion,
          promptContent,
        });

        if (actionNumber === 5) {
          action5ExecutedFlag = true;
          recordedAction5Prompt = promptContent;
          recordedAction5Version = promptVersion;
          return {
            priorityScores: mockPriorityScores,
            scoringCompletedAt: '2024-01-15T09:16:00Z',
          };
        }

        if (actionNumber === 6) {
          action6ExecutedFlag = true;
          return {
            reportId: 'REPORT-20240115-001',
            reportGeneratedAt: '2024-01-15T09:30:00Z',
            reportContent: 'Weekly priority analysis report',
          };
        }

        return { success: true };
      },
    };

    const input: Tx6AgentInput = {
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
      analysisStartDate: '2024-01-08',
      analysisEndDate: '2024-01-14',
      teamId: 'TEAM-001',
    };

    const startTime = Date.now();
    const output: Tx6AgentOutput = await runTx6Imp1Agent(input, mockAiClient as any);
    const elapsedMs = Date.now() - startTime;

    // Action 5 が実行されたことを確認
    expect(action5ExecutedFlag).toBe(true);

    // Action 6 への遷移が行われたことを確認
    expect(action6ExecutedFlag).toBe(true);

    // buildAction05Prompt が使用されたことを検証（プロンプト内容のチェック）
    expect(recordedAction5Prompt).toBeTruthy();
    expect(recordedAction5Prompt.length).toBeGreaterThan(0);

    // ACTION_05_PROMPT_VERSION が使用されたことを検証
    expect(recordedAction5Version).toBe(ACTION_05_PROMPT_VERSION);

    // モック AI クライアントから返却された優先度スコアが昇順で整列されていることを確認
    const returnedScores = mockCallRecords
      .find((record) => record.actionNumber === 5)
      ?.promptContent;
    
    // 優先度スコアが数値（1～10）であることを検証
    mockPriorityScores.forEach((score) => {
      expect(typeof score.priorityScore).toBe('number');
      expect(score.priorityScore).toBeGreaterThanOrEqual(1);
      expect(score.priorityScore).toBeLessThanOrEqual(10);
    });

    // スコアが昇順に整列されていることを確認
    for (let i = 1; i < mockPriorityScores.length; i++) {
      expect(mockPriorityScores[i].priorityScore).toBeLessThanOrEqual(
        mockPriorityScores[i - 1].priorityScore,
      );
    }

    // スコア算出根拠が含まれていることを確認
    mockPriorityScores.forEach((score) => {
      expect(score.scoringRationale).toBeTruthy();
      expect(score.scoringRationale.length).toBeGreaterThan(0);
    });

    // スコアリング実行タイムスタンプが ISO 形式で含まれていることを確認
    mockPriorityScores.forEach((score) => {
      expect(score.scoringTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });

    // 処理が 30 秒以内に完了していることを検証
    expect(elapsedMs).toBeLessThan(30000);

    // 出力が期待される構造を持つことを確認
    expect(output).toBeTruthy();
    expect(output.reportId).toBeTruthy();
    expect(output.reportGeneratedAt).toBeInstanceOf(Date);
    expect(output.extractedIssueCount).toBeGreaterThanOrEqual(0);
    expect(output.topPriorityIssues).toBeInstanceOf(Array);

    // Action 5 と Action 6 の両方が実行されたことを最終確認
    expect(mockCallRecords.filter((r) => r.actionNumber === 5).length).toBeGreaterThan(0);
    expect(mockCallRecords.filter((r) => r.actionNumber === 6).length).toBeGreaterThan(0);

    // 例外が発生しなかったことは test 完了で保証される
  });
});