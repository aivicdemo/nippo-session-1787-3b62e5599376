import { generateAndSendConfirmationEmail } from '../../src/logic/notification-delivery';
import { type ConfirmationEmailInput, type ConfirmationEmailOutput } from '../../src/logic/notification-delivery';

describe('朝会報告集約・課題抽出・優先度判定・確認メール自動生成配信機能', () => {
  // SCEN-448
  test('課題の影響度スコアが0未満のとき処理を中止しエラーを返す', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockResolvedValue(-5),
      classifyIssueSeverity: jest.fn(),
    };

    const testInput: ConfirmationEmailInput = {
      reportDeadlineDateTime: new Date('2024-01-15T09:00:00Z'),
      aggregatedReports: [
        {
          reportId: 'report-001',
          reporterUserId: 'user-001',
          reporterName: 'エンジニアA',
          yesterdayAccomplishment: 'API実装完了',
          todayPlan: 'テスト実行予定',
          challenges: 'サーバーダウン',
          submissionDateTime: new Date('2024-01-15T08:30:00Z'),
        },
      ],
      managerUserId: 'manager-001',
      teamId: 'team-001',
      analysisDate: new Date('2024-01-15T00:00:00Z'),
    };

    const result = await generateAndSendConfirmationEmail(
      testInput,
      mockTextAnalysisServiceAdapter
    );

    expect(result).toEqual({
      errorCode: 'INVALID_IMPACT_SCORE',
      errorMessage: '影響度スコアが有効な範囲（0-100）外です',
      success: false,
    });

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(1);
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});