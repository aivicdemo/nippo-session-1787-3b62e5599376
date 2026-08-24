import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AgentInput, type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('朝会報告管理システム - 月次課題傾向分析レポート生成', () => {
  // SCEN-1847
  test('[error] 月次課題傾向分析レポート生成 - データ抽出エラー発生時に待機時間が null のときエラーになる', async () => {
    const triggerTimestamp = new Date('2024-01-01T09:00:00Z');
    const targetMonth = '2024-01';
    const managerUserId = 'mgr-001';
    const includeDetailedAnalysis = true;

    const input: Tx7Imp1AgentInput = {
      triggerTimestamp,
      targetMonth,
      managerUserId,
      includeDetailedAnalysis,
    };

    const mockAiClient: Tx7Imp1AiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        success: false,
        error: {
          code: 'EXTRACTION_FAILED',
          message: '待機時間が未定義のため再試行ロジックを実行できません',
          waitTime: null,
          stackTrace: 'waitTime validation failed',
        },
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        success: false,
        error: {
          code: 'IMPACT_ASSESSMENT_FAILED',
          message: '影響度スコア計算に失敗しました',
        },
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        success: false,
        error: {
          code: 'SEVERITY_CLASSIFICATION_FAILED',
          message: '重要度分類に失敗しました',
        },
      }),
      generateReportContent: jest.fn().mockResolvedValue({
        success: false,
        error: {
          code: 'REPORT_GENERATION_FAILED',
          message: 'レポート生成に失敗しました',
        },
      }),
      sendReportToManager: jest.fn().mockResolvedValue({
        success: false,
        error: {
          code: 'DELIVERY_FAILED',
          message: '部長へのレポート提示に失敗しました',
        },
      }),
      logAuditEvent: jest.fn().mockResolvedValue({
        success: true,
      }),
    };

    await expect(runTx7Imp1Agent(input, mockAiClient)).rejects.toThrow(/待機時間が未定義/);
  });
});