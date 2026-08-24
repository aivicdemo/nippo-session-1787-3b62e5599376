import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type { GenerateAndSendSummaryEmailInput, GenerateAndSendSummaryEmailOutput } from '../../src/logic/notification-delivery';

describe('部長向けダッシュボードリアルタイム表示機能', () => {
  // SCEN-224: [error] 日報集約メール送信機能 - 優先度付き課題一覧が null のとき処理が進まない
  test('extractKeywordsがnullを返した場合、メール送信が中断され例外が発生する', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue(null),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      managerUserId: 'manager-001',
      submittedReports: [
        {
          reporterId: 'engineer-001',
          reporterName: 'エンジニア太郎',
          submittedAt: '2024-01-15T08:45:00Z',
          challenges: ['ビルドエラー', 'テストコード不足'],
        },
        {
          reporterId: 'engineer-002',
          reporterName: 'エンジニア花子',
          submittedAt: '2024-01-15T08:50:00Z',
          challenges: ['ネットワーク遅延', 'リソース不足'],
        },
        {
          reporterId: 'engineer-003',
          reporterName: 'エンジニア次郎',
          submittedAt: '2024-01-15T08:55:00Z',
          challenges: ['デプロイ失敗'],
        },
        {
          reporterId: 'engineer-004',
          reporterName: 'エンジニア由美',
          submittedAt: '2024-01-15T09:00:00Z',
          challenges: ['セキュリティ脆弱性'],
        },
        {
          reporterId: 'engineer-005',
          reporterName: 'エンジニア健太',
          submittedAt: '2024-01-15T09:05:00Z',
          challenges: ['パフォーマンス低下'],
        },
        {
          reporterId: 'engineer-006',
          reporterName: 'エンジニア美咲',
          submittedAt: '2024-01-15T09:10:00Z',
          challenges: ['ドキュメント未整備'],
        },
        {
          reporterId: 'engineer-007',
          reporterName: 'エンジニア拓也',
          submittedAt: '2024-01-15T09:15:00Z',
          challenges: ['コードレビュー遅延'],
        },
        {
          reporterId: 'engineer-008',
          reporterName: 'エンジニア麻衣',
          submittedAt: '2024-01-15T09:20:00Z',
          challenges: ['スケジュール圧迫'],
        },
        {
          reporterId: 'engineer-009',
          reporterName: 'エンジニア隆司',
          submittedAt: '2024-01-15T09:25:00Z',
          challenges: ['依存関係の競合'],
        },
        {
          reporterId: 'engineer-010',
          reporterName: 'エンジニア由紀子',
          submittedAt: '2024-01-15T09:30:00Z',
          challenges: ['テスト環境の構築'],
        },
      ],
      unsubmittedMemberIds: [],
      reportDeadlineTime: '09:00',
    };

    await expect(
      generateAndSendSummaryEmail(input, mockTextAnalysisServiceAdapter)
    ).rejects.toThrow(/課題分析|キーワード|null/i);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
  });
});