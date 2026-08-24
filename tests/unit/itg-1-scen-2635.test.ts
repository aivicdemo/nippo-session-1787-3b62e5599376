import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type {
  Tx10AgentInput,
  Tx10AgentOutput,
  DeploymentParticipant,
  InitialReportAnalysisResult,
  FeedbackItem,
} from '../../src/agents/tx-10-imp-1/orchestrator';

describe('tx-10-imp-1: 朝会報告アプリ初期導入・ユーザー教育', () => {
  // SCEN-2635: [normal] 段階的サポートの提供判定 - 同じエンジニアの同じ不合格理由に対して2回実行した場合、同じ段階的サポート内容が提供される
  test('should provide identical fallback support content for the same engineer with identical failure reason on retry', async () => {
    // Arrange: テストデータ準備
    const engineerAId = 'ENG-A-001';
    const engineerAEmail = 'engineer.a@example.com';
    const failureReasonKey = 'API_RESPONSE_TIMEOUT';
    const expectedFallbackSupportContent =
      'キャッシュから前回の分析結果を表示';

    const deploymentInitiationTimestamp = new Date('2024-06-15T08:00:00Z');
    const reportingDeadlineTime = '09:00';
    const preparationDaysRequired = 5;

    const participants: DeploymentParticipant[] = [
      {
        userId: 'PM-001',
        role: 'ProjectManager',
        email: 'pm@example.com',
      },
      {
        userId: 'MGR-001',
        role: 'Manager',
        email: 'manager@example.com',
      },
      {
        userId: engineerAId,
        role: 'Engineer',
        email: engineerAEmail,
      },
      {
        userId: 'ENG-B-001',
        role: 'Engineer',
        email: 'engineer.b@example.com',
      },
      {
        userId: 'ENG-C-001',
        role: 'Engineer',
        email: 'engineer.c@example.com',
      },
      {
        userId: 'ENG-D-001',
        role: 'Engineer',
        email: 'engineer.d@example.com',
      },
      {
        userId: 'ENG-E-001',
        role: 'Engineer',
        email: 'engineer.e@example.com',
      },
      {
        userId: 'ENG-F-001',
        role: 'Engineer',
        email: 'engineer.f@example.com',
      },
      {
        userId: 'ENG-G-001',
        role: 'Engineer',
        email: 'engineer.g@example.com',
      },
      {
        userId: 'ENG-H-001',
        role: 'Engineer',
        email: 'engineer.h@example.com',
      },
      {
        userId: 'ENG-I-001',
        role: 'Engineer',
        email: 'engineer.i@example.com',
      },
      {
        userId: 'ENG-J-001',
        role: 'Engineer',
        email: 'engineer.j@example.com',
      },
    ];

    // TextAnalysisServiceAdapter スタブ作成
    // 不合格理由『APIレスポンスタイムアウト』に対して、
    // 段階的サポート内容『キャッシュから前回の分析結果を表示』を返す
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockRejectedValue(
        new Error(failureReasonKey)
      ),
      assessImpactScore: jest.fn().mockRejectedValue(
        new Error(failureReasonKey)
      ),
      classifyIssueSeverity: jest.fn().mockRejectedValue(
        new Error(failureReasonKey)
      ),
      // 段階的サポート情報を返すメソッド
      getFallbackSupportContent: jest.fn().mockReturnValue({
        failureReason: failureReasonKey,
        supportContent: expectedFallbackSupportContent,
        supportLevel: 1, // 段階1のサポート
      }),
    };

    const input1: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList: participants,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    // Act: 1回目の実行（エンジニアAが初回テスト報告で不合格）
    const output1: Tx10AgentOutput = await runTx10Imp1Agent(
      input1,
      mockTextAnalysisServiceAdapter as any
    );

    // Assert: 1回目の結果を検証
    expect(output1).toBeDefined();
    expect(output1.initialReportAnalysis).toBeDefined();
    expect(output1.initialReportAnalysis.feedbackItems).toBeDefined();
    expect(Array.isArray(output1.initialReportAnalysis.feedbackItems)).toBe(
      true
    );

    // 1回目の失敗時に提供されたサポート内容を抽出
    const firstFailureFeedback = output1.initialReportAnalysis.feedbackItems.find(
      (feedback: FeedbackItem) => feedback.engineerId === engineerAId
    );

    expect(firstFailureFeedback).toBeDefined();
    expect(firstFailureFeedback?.supportContent).toBe(
      expectedFallbackSupportContent
    );

    const firstSupportContent = firstFailureFeedback?.supportContent;

    // Act: 2回目の実行（同じエンジニアAが同じ不合格理由で2回目の日報を送信）
    const input2: Tx10AgentInput = {
      deploymentInitiationTimestamp: new Date('2024-06-16T08:00:00Z'),
      participantList: participants,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    const output2: Tx10AgentOutput = await runTx10Imp1Agent(
      input2,
      mockTextAnalysisServiceAdapter as any
    );

    // Assert: 2回目の結果を検証
    expect(output2).toBeDefined();
    expect(output2.initialReportAnalysis).toBeDefined();
    expect(output2.initialReportAnalysis.feedbackItems).toBeDefined();

    // 2回目の失敗時に提供されたサポート内容を抽出
    const secondFailureFeedback = output2.initialReportAnalysis.feedbackItems.find(
      (feedback: FeedbackItem) => feedback.engineerId === engineerAId
    );

    expect(secondFailureFeedback).toBeDefined();
    expect(secondFailureFeedback?.supportContent).toBe(
      expectedFallbackSupportContent
    );

    const secondSupportContent = secondFailureFeedback?.supportContent;

    // Assert: 1回目と2回目の段階的サポート内容が完全に一致することを検証
    expect(firstSupportContent).toEqual(secondSupportContent);
    expect(firstSupportContent).toBe(expectedFallbackSupportContent);
    expect(secondSupportContent).toBe(expectedFallbackSupportContent);

    // スタブの呼び出しが期待通りに行われたことを検証
    expect(
      mockTextAnalysisServiceAdapter.getFallbackSupportContent
    ).toHaveBeenCalled();
  });
});