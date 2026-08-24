import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア機能', () => {
  // SCEN-2446
  test('優先度判定ロジックのバージョンがnullのとき、監査ログ記録が失敗する', () => {
    const reportId = 'report-2024-01';
    const approvalStatus = 'approved' as const;
    const approverUserId = 'user-director-001';
    const priorityLogicVersion = null;

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: '納期短縮対応', frequency: 1 }
        ]
      }),
      assessImpactScore: jest.fn().mockResolvedValue({ impactScore: 85 }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'high' }),
      getPriorityLogicVersion: jest.fn().mockReturnValue(priorityLogicVersion)
    };

    expect(() =>
      validateMonthlyReportApproval(
        {
          reportId,
          approvalStatus,
          approverUserId
        },
        mockTextAnalysisAdapter
      )
    ).toThrow(/バージョン情報が不正です/);
  });
});