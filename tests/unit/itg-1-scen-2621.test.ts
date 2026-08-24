import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput, type DeploymentParticipant, type InitialReportAnalysisResult } from '../../src/agents/tx-10-imp-1/types';

describe('Tx10 初期導入・ユーザー教育エージェント', () => {
  // SCEN-2621: [edge] 初回テスト運用判定機能 - 提出率計算で端数が生じたとき適切に丸められる
  test('提出率計算において端数が発生した場合、小数第2位以下が四捨五入により適切に処理される', async () => {
    // テストデータの準備：複数の端数パターンを網羅したテストケースを構築
    const testCases: Array<{
      submittedCount: number;
      totalCount: number;
      expectedSubmissionRate: number;
      description: string;
    }> = [
      { submittedCount: 3, totalCount: 10, expectedSubmissionRate: 30.0, description: '3÷10=30.0%' },
      { submittedCount: 7, totalCount: 10, expectedSubmissionRate: 70.0, description: '7÷10=70.0%' },
      { submittedCount: 2, totalCount: 10, expectedSubmissionRate: 20.0, description: '2÷10=20.0%' },
      { submittedCount: 1, totalCount: 10, expectedSubmissionRate: 10.0, description: '1÷10=10.0%' },
      { submittedCount: 1, totalCount: 3, expectedSubmissionRate: 33.33, description: '1÷3≈33.33% (端数あり)' },
      { submittedCount: 2, totalCount: 3, expectedSubmissionRate: 66.67, description: '2÷3≈66.67% (端数あり)' },
      { submittedCount: 1, totalCount: 6, expectedSubmissionRate: 16.67, description: '1÷6≈16.67% (端数あり)' },
      { submittedCount: 5, totalCount: 6, expectedSubmissionRate: 83.33, description: '5÷6≈83.33% (端数あり)' },
    ];

    // 各テストケースについて提出率計算ロジックを実行・検証
    for (const testCase of testCases) {
      // テスト用の参加者リストを構築：部員数 = totalCount
      const participants: DeploymentParticipant[] = Array.from(
        { length: testCase.totalCount },
        (_, index) => ({
          userId: `user_${index + 1}`,
          role: index === 0 ? 'ProjectManager' : 'Engineer',
          email: `user${index + 1}@example.com`,
        })
      );

      // 初期テスト報告データを生成：指定数の提出済みレコード
      const initialReportData: Array<{ userId: string; status: 'submitted' | 'not_submitted' }> = participants.map(
        (participant, index) => ({
          userId: participant.userId,
          status: index < testCase.submittedCount ? 'submitted' : 'not_submitted',
        })
      );

      // Tx10エージェント入力データの構築
      const input: Tx10AgentInput = {
        deploymentInitiationTimestamp: new Date('2024-01-15T08:00:00Z'),
        participantList: participants,
        preparationDaysRequired: 5,
        reportingDeadlineTime: '09:00',
      };

      // AIクライアント用スタブを定義：提出率計算の結果を返す
      const mockAiClient = {
        extractKeywords: jest.fn().mockResolvedValue({
          keywords: [],
          confidence: 0.8,
        }),
        assessImpactScore: jest.fn().mockResolvedValue({
          score: 50,
        }),
        classifyIssueSeverity: jest.fn().mockResolvedValue({
          severity: 'medium',
        }),
        evaluateReportQuality: jest.fn().mockResolvedValue({
          qualityScore: 85,
        }),
        validateDataUniformity: jest.fn().mockResolvedValue({
          uniformityScore: 88,
        }),
        assessOnboardingReadiness: jest.fn().mockResolvedValue({
          readinessLevel: 'ready_for_production',
          confidence: 0.92,
        }),
      };

      // runTx10Imp1Agentを呼び出し、初期テスト報告データの品質評価を実行
      const output: Tx10AgentOutput = await runTx10Imp1Agent(input, mockAiClient);

      // 戻り値から初期テスト報告分析結果を取得
      const analysisResult: InitialReportAnalysisResult = output.initialReportAnalysis;

      // 提出率計算結果を検証：期待値との誤差が0.01以下（四捨五入による許容誤差）
      const actualSubmissionRate = analysisResult.submissionRate;
      const roundingTolerance = 0.01;
      expect(Math.abs(actualSubmissionRate - testCase.expectedSubmissionRate)).toBeLessThanOrEqual(
        roundingTolerance
      );

      // 計算結果がNaNやInfinityを含まないことを確認
      expect(Number.isNaN(actualSubmissionRate)).toBe(false);
      expect(Number.isFinite(actualSubmissionRate)).toBe(true);

      // 提出率が0以上100以下の有効範囲内であることを検証
      expect(actualSubmissionRate).toBeGreaterThanOrEqual(0);
      expect(actualSubmissionRate).toBeLessThanOrEqual(100);

      // ダッシュボード表示時の小数点以下の位数を確認：最大小数第2位
      const rateString = actualSubmissionRate.toString();
      const decimalParts = rateString.split('.');
      if (decimalParts.length > 1) {
        expect(decimalParts[1].length).toBeLessThanOrEqual(2);
      }

      // 品質スコアと形式統一度スコアも併せて検証：これらも丸め処理を適用
      expect(analysisResult.dataQualityScore).toBeGreaterThanOrEqual(0);
      expect(analysisResult.dataQualityScore).toBeLessThanOrEqual(100);
      expect(analysisResult.formatUniformityScore).toBeGreaterThanOrEqual(0);
      expect(analysisResult.formatUniformityScore).toBeLessThanOrEqual(100);

      // NaN/Infinity のチェック
      expect(Number.isNaN(analysisResult.dataQualityScore)).toBe(false);
      expect(Number.isFinite(analysisResult.dataQualityScore)).toBe(true);
      expect(Number.isNaN(analysisResult.formatUniformityScore)).toBe(false);
      expect(Number.isFinite(analysisResult.formatUniformityScore)).toBe(true);
    }
  });
});