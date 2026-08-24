import { describe, it, expect, beforeEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';
import type { MonthlyReportDataset, ExtractionValidationResult } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次報告データ抽出機能', () => {
  // SCEN-2328: [error] 課題解決速度分析機能 - 過去 30 日以上のデータが蓄積されていないとき処理を中止しエラーを返す
  it('should return insufficient data error when accumulated data period is less than 30 days', () => {
    // テスト日付を固定（例：2024年1月30日）
    const testExecutionDate = new Date('2024-01-30T10:00:00Z');
    
    // 現在から遡って29日分のテストデータ期間を構成
    // 2024-01-02 から 2024-01-30 まで（29日）
    const dataStartDate = new Date('2024-01-02T00:00:00Z');
    const dataEndDate = new Date('2024-01-30T23:59:59Z');
    
    // テスト用の日報データセット（29日分）
    const dailyReportRecords = [
      {
        reportId: 'report_001',
        reportDate: new Date('2024-01-02T09:00:00Z'),
        teamId: 'team_001',
        userId: 'user_001',
        yesterdayAccomplishment: '機能A実装完了',
        todayPlan: '機能B実装開始',
        issues: 'パフォーマンス問題発生',
        issueKeywords: ['パフォーマンス', '最適化'],
        resolutionStatus: 'open' as const,
        submittedAt: new Date('2024-01-02T08:30:00Z'),
      },
      {
        reportId: 'report_002',
        reportDate: new Date('2024-01-03T09:00:00Z'),
        teamId: 'team_001',
        userId: 'user_002',
        yesterdayAccomplishment: '環境構築完了',
        todayPlan: 'テスト開始',
        issues: 'デプロイメント遅延',
        issueKeywords: ['デプロイ', '遅延'],
        resolutionStatus: 'in_progress' as const,
        submittedAt: new Date('2024-01-03T08:45:00Z'),
      },
    ];

    // 入力パラメータ：29日分のデータのみ
    const input = {
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: 'user_manager_001',
      teamIdFilter: ['team_001'],
    };

    // 関数を実行
    let thrownError: any = null;
    let result: MonthlyReportDataset | null = null;

    try {
      result = extractMonthlyReportData(
        input,
        {
          startDate: dataStartDate,
          endDate: dataEndDate,
          reportRecords: dailyReportRecords,
          executionDate: testExecutionDate,
        }
      );
    } catch (error) {
      thrownError = error;
    }

    // エラーが発生することを確認
    expect(thrownError).toBeDefined();
    expect(thrownError).toHaveProperty('code');
    expect(thrownError.code).toBe('INSUFFICIENT_DATA_PERIOD');
    
    // エラーメッセージを確認
    expect(thrownError).toHaveProperty('message');
    expect(thrownError.message).toMatch(/過去30日以上のデータが蓄積されていません/);
    
    // HTTPステータスコードを確認
    expect(thrownError).toHaveProperty('statusCode');
    expect(thrownError.statusCode).toBe(400);
    
    // 内部ログ情報を確認
    expect(thrownError).toHaveProperty('details');
    expect(thrownError.details).toHaveProperty('accumulatedDataPeriodDays');
    expect(thrownError.details.accumulatedDataPeriodDays).toBe(29);
    
    expect(thrownError.details).toHaveProperty('requiredMinimumDays');
    expect(thrownError.details.requiredMinimumDays).toBe(30);
    
    expect(thrownError.details).toHaveProperty('executionAttemptTime');
    expect(thrownError.details.executionAttemptTime).toEqual(testExecutionDate.toISOString());
    
    // 結果が返されていないことを確認
    expect(result).toBeNull();
  });
});