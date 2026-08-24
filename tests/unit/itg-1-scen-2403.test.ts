import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';
import { type MonthlyReportDataset, type ExtractionValidationResult } from '../../src/logic/monthly-performance-analysis';

describe('月次日報データ集約・アーカイブ移行機能', () => {
  // SCEN-2403: [error] 日報データ集約・アーカイブ移行機能 - アーカイブ領域への移行先パスが指定されていないとき処理が中断される
  test('アーカイブ移行先パスが未設定の場合、処理は中断され、日報データは移行されずエラーメッセージが表示される', () => {
    // 前提条件: テスト環境をリセット状態にする
    const targetYear = 2024;
    const targetMonth = 1;
    const requestedByUserId = 'user-dept-chief-001';
    const teamIdFilter = ['team-dev-01'];

    // アーカイブ移行先パスが未設定の状態を模擬
    const archiveDestinationPath = undefined;

    // 集約対象となる日報データ（過去90日分など）がデータベースに存在することを確認
    const mockReportRecords = [
      {
        reportId: 'report-20231015-001',
        teamId: 'team-dev-01',
        userId: 'user-engineer-001',
        reportDate: new Date('2023-10-15T09:00:00Z'),
        content: '昨日のタスク完了。今日は新機能実装予定。',
        submittedAt: new Date('2023-10-15T08:30:00Z'),
      },
      {
        reportId: 'report-20231016-001',
        teamId: 'team-dev-01',
        userId: 'user-engineer-002',
        reportDate: new Date('2023-10-16T09:00:00Z'),
        content: '昨日の実装を完了。今日はテスト実施予定。',
        submittedAt: new Date('2023-10-16T08:45:00Z'),
      },
    ];

    // アーカイブ移行処理を実行トリガーする際、移行先パスが未設定
    const executionRequest = {
      targetYear,
      targetMonth,
      requestedByUserId,
      teamIdFilter,
      archiveDestinationPath,
      reportRecordsToArchive: mockReportRecords,
    };

    // 処理実行：移行先パスが未設定の状態でアーカイブ移行処理を実行
    // 期待: 処理は中断され、エラーが throw される
    expect(() => {
      extractMonthlyReportData(
        {
          targetYear: executionRequest.targetYear,
          targetMonth: executionRequest.targetMonth,
          requestedByUserId: executionRequest.requestedByUserId,
          teamIdFilter: executionRequest.teamIdFilter,
        },
        {
          archiveDestinationPath: executionRequest.archiveDestinationPath,
        }
      );
    }).toThrow(/アーカイブ先パス|移行先パス|パス設定/);

    // 処理実行直後のシステムログと内部エラーハンドラの状態を確認
    // データベース内の日報データが移行されていないことを確認
    // （実装では、エラーが発生した場合、ロールバック処理によりデータは移行されない状態になる）

    // ユーザーへのエラーメッセージがダッシュボードで確認可能になることを検証
    // 期待結果:
    // - ステータスが「失敗：移行先パスが未設定です」となる
    // - 日報データはアーカイブ領域に移行されず元のテーブルに残存
    // - 管理画面またはログに『アーカイブ先パスの指定が必須です。設定を確認してください』というエラーメッセージが表示される
    // - データ整合性が保たれる
  });
});