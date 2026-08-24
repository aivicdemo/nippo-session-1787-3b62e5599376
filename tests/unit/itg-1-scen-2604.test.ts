import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('tx-10-imp-1: 初回報告データ品質評価機能', () => {
  // SCEN-2604
  test('[error] データ品質スコアが79点で基準未達となり改善フェーズへの戻り指示が返る', async () => {
    const mockAiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['ネットワーク遅延', '問題'],
        frequency: { 'ネットワーク遅延': 2, '問題': 1 },
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        score: 79,
        confidence: 0.85,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'medium',
      }),
    };

    const initialReportData = {
      userId: 'user-001',
      yesterday: 'バグ修正完了',
      today: 'テスト実施予定',
      issues: 'ネットワーク遅延問題が継続中',
      submissionTimestamp: new Date('2024-01-15T08:45:00Z'),
    };

    const result = await runTx10Imp1Agent(initialReportData, mockAiClient);

    expect(result).toEqual({
      status: 'PENDING_REVISION',
      dataQualityScore: 79,
      baselineThreshold: 80,
      isBelowThreshold: true,
      feedbackMessage: 'データ品質スコア：79点（基準未達）。以下の項目を修正してください：課題内容の詳細化を推奨します。',
      requiredImprovements: ['課題内容の詳細化'],
      confirmationEmailSent: false,
      revisionFormDisplayed: true,
    });

    expect(mockAiClient.extractKeywords).toHaveBeenCalledWith(initialReportData.issues);
    expect(mockAiClient.assessImpactScore).toHaveBeenCalled();
  });
});