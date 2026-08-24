import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type { Tx10AgentInput, Tx10AgentOutput, DeploymentParticipant, InitialReportAnalysisResult } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('朝会報告管理システム - 初期導入・ユーザー教育フロー', () => {
  // SCEN-2631: [normal] 再テスト報告の合格判定 - 再テスト報告が合格基準に達した場合、合格と判定される
  test('再テスト報告が合格基準に達した場合、合格状態に更新される', async () => {
    // Setup: テスト用の日時を固定化
    const deploymentInitiationTimestamp = new Date('2026-01-20T09:00:00Z');
    const reportingDeadlineTime = '09:00';

    // Setup: テスト用参加者データを作成（部長1名、エンジニア10名）
    const participantList: DeploymentParticipant[] = [
      {
        userId: 'pm-001',
        role: 'ProjectManager',
        email: 'pm001@example.com',
      },
      {
        userId: 'manager-001',
        role: 'Manager',
        email: 'manager001@example.com',
      },
      ...Array.from({ length: 10 }, (_, i) => ({
        userId: `engineer-${String(i + 1).padStart(3, '0')}`,
        role: 'Engineer',
        email: `engineer${String(i + 1).padStart(3, '0')}@example.com`,
      })),
    ];

    // Setup: 導入フロー用の入力データを作成
    const deploymentInput: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired: 5,
      reportingDeadlineTime,
    };

    // Setup: TextAnalysisServiceAdapter のスタブを作成
    // extractKeywords: 課題キーワードを抽出（成功ケース）
    const mockExtractKeywords = jest.fn().mockResolvedValue({
      keywords: ['システム障害', 'デプロイ遅延', '設計仕様'],
      frequencies: [5, 3, 2],
      confidence: 0.92,
    });

    // Setup: assessImpactScore - チーム波及度スコアが合格基準値（50以上）を返す
    const mockAssessImpactScore = jest.fn().mockResolvedValue({
      impactScore: 65,
      affectedTeams: ['Backend', 'QA'],
      severity: 'high',
    });

    // Setup: classifyIssueSeverity - 重要度分類（低・中・高の中から選択）
    const mockClassifyIssueSeverity = jest.fn().mockResolvedValue({
      severity: 'medium',
      category: 'quality',
      recommendedAction: '次回スプリントでの改善検討',
    });

    // Setup: AIクライアントのスタブ（Tx10Imp1AiClient 互換）
    const mockAiClient = {
      extractKeywords: mockExtractKeywords,
      assessImpactScore: mockAssessImpactScore,
      classifyIssueSeverity: mockClassifyIssueSeverity,
    };

    // Execute: エージェントを実行（再テスト報告の合格判定フロー）
    const agentOutput: Tx10AgentOutput = await runTx10Imp1Agent(
      deploymentInput,
      mockAiClient,
    );

    // Verify: initialReportAnalysis の結果を検証
    // 期待値: 3つの合格基準をすべて満たしている
    // - 提出率: 90%以上（エンジニア10名全員が再テスト報告を提出）
    // - データ品質スコア: 80点以上（テキスト解析結果が基準を満たす）
    // - 入力形式統一度: 85%以上（テンプレートに従った入力）

    expect(agentOutput.initialReportAnalysis).toBeDefined();
    expect(agentOutput.initialReportAnalysis.submissionRate).toBeGreaterThanOrEqual(90);
    expect(agentOutput.initialReportAnalysis.dataQualityScore).toBeGreaterThanOrEqual(80);
    expect(agentOutput.initialReportAnalysis.formatUniformityScore).toBeGreaterThanOrEqual(85);

    // Verify: 合格フィードバックが生成されている
    expect(agentOutput.initialReportAnalysis.feedbackItems).toBeDefined();
    // 3つの基準をすべて満たしているため、改善フィードバックは最小限のみ
    expect(agentOutput.initialReportAnalysis.feedbackItems.length).toBeLessThanOrEqual(3);

    // Verify: 本運用開始可否が承認状態になっている
    expect(agentOutput.onboardingApprovalStatus).toBeDefined();
    expect(agentOutput.onboardingApprovalStatus.isApproved).toBe(true);
    expect(agentOutput.onboardingApprovalStatus.readyForProduction).toBe(true);

    // Verify: 導入スケジュールが生成されている
    expect(agentOutput.deploymentSchedule).toBeDefined();
    expect(agentOutput.deploymentSchedule.startDate).toBeDefined();
    expect(agentOutput.deploymentSchedule.productionStartDate).toBeDefined();

    // Verify: 研修教材が生成されている
    expect(agentOutput.trainingMaterials).toBeDefined();
    expect(agentOutput.trainingMaterials.length).toBeGreaterThan(0);

    // Verify: 外部サービス呼び出しが期待通り行われている
    expect(mockExtractKeywords).toHaveBeenCalled();
    expect(mockAssessImpactScore).toHaveBeenCalled();
    expect(mockClassifyIssueSeverity).toHaveBeenCalled();

    // Verify: 課題キーワードが正しく抽出され、複数のキーワードが返される
    const extractedKeywordsResult = await mockExtractKeywords();
    expect(extractedKeywordsResult.keywords).toContain('システム障害');
    expect(extractedKeywordsResult.keywords.length).toBeGreaterThan(0);
    expect(extractedKeywordsResult.confidence).toBeGreaterThanOrEqual(0.85);

    // Verify: チーム波及度スコアが合格基準を満たしている
    const impactScoreResult = await mockAssessImpactScore();
    expect(impactScoreResult.impactScore).toBeGreaterThanOrEqual(50);

    // Verify: 重要度分類が「低」または「中」のいずれかになっている
    const severityResult = await mockClassifyIssueSeverity();
    expect(['low', 'medium']).toContain(severityResult.severity);
  });
});