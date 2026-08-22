import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('Tx1Imp1Agent - 日報集約から課題優先順位付けと未提出通知までの自律実行', () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = require('jest-fetch-mock');
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-023
  test('should complete end-to-end morning report aggregation with issue prioritization and unsubmitted notifications', async () => {
    const executionTimestamp = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineTime = '09:00';
    const morningMeetingStartTime = '09:30';
    const teamMemberIds = [
      'user001', 'user002', 'user003', 'user004', 'user005',
      'user006', 'user007', 'user008', 'user009', 'user010'
    ];
    const managerEmail = 'manager@example.com';

    const mockReportData = [
      {
        userId: 'user001',
        content: 'やったこと：プロジェクトA進捗確認。今日やること：設計書レビュー。課題：ネットワーク遅延により進捗遅延'
      },
      {
        userId: 'user002',
        content: 'やったこと：バグ修正3件完了。今日やること：テスト実施。課題：テスト環境でDB接続エラーが発生'
      },
      {
        userId: 'user003',
        content: 'やったこと：ドキュメント作成。今日やること：チーム会議準備。課題：リソース不足'
      },
      {
        userId: 'user004',
        content: 'やったこと：デプロイ準備。今日やること：本番環境確認。課題：セキュリティ脆弱性発見'
      },
      {
        userId: 'user005',
        content: 'やったこと：顧客対応。今日やること：要件ヒアリング。課題：スケジュール競合'
      },
      {
        userId: 'user006',
        content: 'やったこと：インフラ構築。今日やること：監視設定。課題：スケーリング対応'
      },
      {
        userId: 'user007',
        content: 'やったこと：パフォーマンスチューニング。今日やること：最適化検証。課題：メモリ不足'
      },
      {
        userId: 'user008',
        content: 'やったこと：セキュリティレビュー。今日やること：修正対応。課題：暗号化実装'
      },
      {
        userId: 'user009',
        content: 'やったこと：テスト自動化。今日やること：CI/CD統合。課題：テストフレームワーク互換性'
      },
      {
        userId: 'user010',
        content: 'やったこと：ミーティング参加。今日やること：スプリント計画。課題：優先度決定困難'
      }
    ];

    const mockPrioritizedIssues = [
      {
        issueId: 'issue001',
        title: 'セキュリティ脆弱性発見',
        priority: 1,
        severity: 'critical',
        affectedUserId: 'user004'
      },
      {
        issueId: 'issue002',
        title: 'DB接続エラー',
        priority: 2,
        severity: 'high',
        affectedUserId: 'user002'
      },
      {
        issueId: 'issue003',
        title: 'ネットワーク遅延',
        priority: 3,
        severity: 'high',
        affectedUserId: 'user001'
      },
      {
        issueId: 'issue004',
        title: 'リソース不足',
        priority: 4,
        severity: 'medium',
        affectedUserId: 'user003'
      },
      {
        issueId: 'issue005',
        title: 'スケーリング対応',
        priority: 5,
        severity: 'medium',
        affectedUserId: 'user006'
      }
    ];

    // Mock: fetch morning reports
    fetchMock.mockResponseOnce(
      JSON.stringify({
        reports: mockReportData,
        totalCount: 10,
        submittedCount: 10,
        unsubmittedCount: 0
      }),
      { status: 200 }
    );

    // Mock: extract and prioritize issues
    fetchMock.mockResponseOnce(
      JSON.stringify({
        extractedIssues: mockPrioritizedIssues.slice(0, 5),
        prioritizationStatus: 'completed'
      }),
      { status: 200 }
    );

    // Mock: send summary email
    fetchMock.mockResponseOnce(
      JSON.stringify({
        emailId: 'email_msg_001',
        recipient: managerEmail,
        subject: '朝会用日報集約・課題優先順位付けレポート',
        sentAt: '2024-01-15T09:10:00Z'
      }),
      { status: 200 }
    );

    const aiClientMock = {
      fetchMorningReports: jest.fn().mockResolvedValue({
        reports: mockReportData,
        totalCount: 10,
        submittedCount: 10,
        unsubmittedCount: 0
      }),
      extractAndPrioritizeIssues: jest.fn().mockResolvedValue({
        extractedIssues: mockPrioritizedIssues.slice(0, 5),
        prioritizationStatus: 'completed'
      }),
      sendSummaryEmail: jest.fn().mockResolvedValue({
        emailId: 'email_msg_001',
        recipient: managerEmail,
        subject: '朝会用日報集約・課題優先順位付けレポート',
        sentAt: '2024-01-15T09:10:00Z'
      }),
      notifyUnsubmittedMembers: jest.fn().mockResolvedValue({
        notificationsSent: 0,
        timestamp: '2024-01-15T09:05:00Z'
      })
    };

    const result = await runTx1Imp1Agent(
      {
        executionTimestamp,
        reportDeadlineTime,
        morningMeetingStartTime,
        teamMemberIds,
        managerEmail
      },
      aiClientMock
    );

    expect(result.executionStatus).toBe('success');
    expect(result.aggregatedReportCount).toBe(10);
    expect(result.unsubmittedMemberCount).toBe(0);
    expect(result.extractedIssueCount).toBe(5);
    expect(result.prioritizedIssueList).toHaveLength(5);
    expect(result.prioritizedIssueList[0].priority).toBe(1);
    expect(result.prioritizedIssueList[0].title).toBe('セキュリティ脆弱性発見');
    expect(result.prioritizedIssueList[1].priority).toBe(2);
    expect(result.prioritizedIssueList[4].priority).toBe(5);
    expect(result.summaryEmailSent).toBe(true);
    expect(result.completionTimestamp).toBeInstanceOf(Date);
    expect(result.completionTimestamp.getTime()).toBeGreaterThanOrEqual(
      executionTimestamp.getTime()
    );

    expect(aiClientMock.fetchMorningReports).toHaveBeenCalledWith({
      reportDeadlineTime,
      teamMemberIds,
      executionTimestamp
    });

    expect(aiClientMock.extractAndPrioritizeIssues).toHaveBeenCalledWith({
      reports: mockReportData,
      executionContext: expect.any(Object)
    });

    expect(aiClientMock.sendSummaryEmail).toHaveBeenCalledWith({
      recipient: managerEmail,
      prioritizedIssues: expect.arrayContaining([
        expect.objectContaining({ priority: 1 }),
        expect.objectContaining({ priority: 2 }),
        expect.objectContaining({ priority: 3 }),
        expect.objectContaining({ priority: 4 }),
        expect.objectContaining({ priority: 5 })
      ]),
      reportSummary: expect.any(Object)
    });
  });
});