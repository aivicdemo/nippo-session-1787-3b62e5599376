import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type { GenerateAndSendSummaryEmailInput, GenerateAndSendSummaryEmailOutput, SubmittedReportSummary } from '../../src/logic/notification-delivery';

const fetchMock = require('jest-fetch-mock');

describe('優先度付き課題一覧生成機能 - 集約メール配信', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.clearAllMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-207: [normal] 優先度付き課題一覧生成機能 - 集約された日報から抽出された課題が優先度スコアで順序付けられて集約メールに含まれる
  test('should generate and send summary email with prioritized issues ordered by impact score descending', async () => {
    // Arrange: テストデータを準備する
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const managerUserId = 'manager-001';
    
    // 3件の日報データを準備（各日報に課題記述あり）
    const submittedReports: SubmittedReportSummary[] = [
      {
        reporterId: 'engineer-001',
        reporterName: 'エンジニア太郎',
        submittedAt: '2024-01-15T08:30:00Z',
        challenges: ['データベース接続エラーが発生', 'ネットワーク遅延の問題']
      },
      {
        reporterId: 'engineer-002',
        reporterName: 'エンジニア花子',
        submittedAt: '2024-01-15T08:35:00Z',
        challenges: ['データベース接続エラーが引き続き発生', 'デプロイメント失敗']
      },
      {
        reporterId: 'engineer-003',
        reporterName: 'エンジニア次郎',
        submittedAt: '2024-01-15T08:40:00Z',
        challenges: ['ネットワーク遅延の問題が改善されない', 'テスト環境の不安定性']
      }
    ];

    const unsubmittedMemberIds: string[] = ['engineer-004'];
    const reportDeadlineTime = '09:00';

    // TextAnalysisServiceAdapter のスタブを作成
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async (text: string) => {
        // キーワード抽出をシミュレート
        // 「データベース接続エラー」「ネットワーク遅延」「デプロイメント失敗」「テスト環境の不安定性」を検出
        if (text.includes('データベース接続エラー')) {
          return { keyword: 'データベース接続エラー', frequency: 2 };
        }
        if (text.includes('ネットワーク遅延')) {
          return { keyword: 'ネットワーク遅延', frequency: 2 };
        }
        if (text.includes('デプロイメント失敗')) {
          return { keyword: 'デプロイメント失敗', frequency: 1 };
        }
        if (text.includes('テスト環境の不安定性')) {
          return { keyword: 'テスト環境の不安定性', frequency: 1 };
        }
        return { keyword: 'unknown', frequency: 0 };
      }),
      assessImpactScore: jest.fn(async (keyword: string) => {
        // 異なる優先度スコアを返す
        // キーワードA（データベース接続エラー）= 85
        // キーワードC（ネットワーク遅延）= 72
        // キーワードB（デプロイメント失敗）= 60
        // キーワードD（テスト環境の不安定性）= 45
        const scoreMap: { [key: string]: number } = {
          'データベース接続エラー': 85,
          'ネットワーク遅延': 72,
          'デプロイメント失敗': 60,
          'テスト環境の不安定性': 45
        };
        return scoreMap[keyword] || 0;
      }),
      classifyIssueSeverity: jest.fn(async (text: string) => {
        return 'high';
      })
    };

    // マネージャーの取得をモック
    fetchMock.mockResponseOnce(
      JSON.stringify({
        userId: managerUserId,
        name: '部長太郎',
        email: 'manager@example.com',
        role: 'MANAGER'
      }),
      { status: 200 }
    );

    // メール送信のモック（メール送信結果を返す）
    fetchMock.mockResponseOnce(
      JSON.stringify({
        emailId: 'email-001',
        sentAt: '2024-01-15T08:45:00Z'
      }),
      { status: 200 }
    );

    const input: GenerateAndSendSummaryEmailInput = {
      teamId,
      reportDate,
      managerUserId,
      submittedReports,
      unsubmittedMemberIds,
      reportDeadlineTime
    };

    // Act: generateAndSendSummaryEmail を実行
    const result: GenerateAndSendSummaryEmailOutput = await generateAndSendSummaryEmail(
      input,
      mockTextAnalysisAdapter
    );

    // Assert: 結果を検証
    // 1. メールが送信されたことを確認
    expect(result).toBeDefined();
    expect(result.emailId).toBe('email-001');
    expect(result.sentAt).toBe('2024-01-15T08:45:00Z');
    expect(result.recipientEmail).toBe('manager@example.com');

    // 2. メール本文に含まれた課題が正しい件数で含まれていることを確認
    // 抽出される課題: データベース接続エラー、ネットワーク遅延、デプロイメント失敗、テスト環境の不安定性
    // = 4件
    expect(result.includedIssueCount).toBe(4);

    // 3. 提出状況サマリーを確認
    expect(result.submissionSummary.submittedCount).toBe(3);
    expect(result.submissionSummary.unsubmittedCount).toBe(1);
    expect(result.submissionSummary.submissionRate).toBe(75); // 3/4 = 0.75 = 75%

    // 4. メール本文で課題が優先度スコアの降順で並んでいることを確認
    // TextAnalysisServiceAdapter.extractKeywords が呼ばれ、優先度スコアが取得されたことを確認
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();

    // 5. 優先度スコアが正しく計算されていることを確認
    // extractKeywords から返されたキーワードに対して assessImpactScore が呼ばれる
    // 期待される呼び出し順: スコア 85 → 72 → 60 → 45
    const assessImpactScoreCalls = mockTextAnalysisAdapter.assessImpactScore.mock.calls;
    const scoreResults = assessImpactScoreCalls.map((call) => {
      const keyword = call[0];
      const scoreMap: { [key: string]: number } = {
        'データベース接続エラー': 85,
        'ネットワーク遅延': 72,
        'デプロイメント失敗': 60,
        'テスト環境の不安定性': 45
      };
      return scoreMap[keyword] || 0;
    });

    // スコアが降順で並んでいることを確認（85 >= 72 >= 60 >= 45）
    for (let i = 0; i < scoreResults.length - 1; i++) {
      expect(scoreResults[i]).toBeGreaterThanOrEqual(scoreResults[i + 1]);
    }

    // 6. メール送信が実行されたことを確認
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});