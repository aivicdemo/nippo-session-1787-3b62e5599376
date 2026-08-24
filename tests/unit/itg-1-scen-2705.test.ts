import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { fetchYesterdayReport } from '../../src/logic/report-submission';

describe('fetchYesterdayReport - 前日報告内容の取得・表示機能', () => {
  // SCEN-2705: 同一エンジニアが同日に複数回報告を保存した場合、最後の報告レコードが返される
  test('should return the latest daily report when engineer submits multiple times on same day', async () => {
    const engineer_id = 'ENG-001';
    const requesting_user_id = 'MANAGER-001';
    const target_date = new Date('2026-08-20'); // 翌日（朝会で前日を表示）

    // 同日の複数回提出シナリオ
    const submission_date = new Date('2026-08-19');

    // 1回目の報告: 09:00に保存
    const first_submission_timestamp = new Date('2026-08-19T09:00:00Z');
    const first_report = {
      reportId: 'RPT-001',
      engineerId: engineer_id,
      reportDate: submission_date,
      yesterdayAccomplishment: '機能A開発',
      todayPlan: 'テストB実施',
      challenges: '環境構築遅延',
      submittedAt: first_submission_timestamp,
    };

    // 2回目の報告: 10:30に保存
    const second_submission_timestamp = new Date('2026-08-19T10:30:00Z');
    const second_report = {
      reportId: 'RPT-002',
      engineerId: engineer_id,
      reportDate: submission_date,
      yesterdayAccomplishment: '機能A開発完了',
      todayPlan: 'テストB・C実施',
      challenges: '環境構築遅延、レビュー待ち',
      submittedAt: second_submission_timestamp,
    };

    // 3回目の報告: 14:00に保存（最新）
    const third_submission_timestamp = new Date('2026-08-19T14:00:00Z');
    const latest_report = {
      reportId: 'RPT-003',
      engineerId: engineer_id,
      reportDate: submission_date,
      yesterdayAccomplishment: '機能A開発完了、テストB実施',
      todayPlan: 'テストC実施、デプロイ準備',
      challenges: 'レビュー待ち',
      submittedAt: third_submission_timestamp,
    };

    // 前日報告取得API呼び出し
    // 実装では、DBから該当エンジニアの前日分報告を取得し、最新タイムスタンプのものを返す
    const result = await fetchYesterdayReport({
      engineerId: engineer_id,
      targetDate: target_date,
      requestingUserId: requesting_user_id,
    });

    // 期待結果: 3回目（最新）の報告内容が返されること
    expect(result).toEqual({
      reportId: 'RPT-003',
      engineerId: engineer_id,
      reportDate: submission_date,
      yesterdayAccomplishment: '機能A開発完了、テストB実施',
      todayPlan: 'テストC実施、デプロイ準備',
      challenges: 'レビュー待ち',
      submittedAt: third_submission_timestamp,
    });

    // タイムスタンプが3回目のもの（14:00）であることを確認
    expect(result.submittedAt.getTime()).toBe(third_submission_timestamp.getTime());

    // 1回目と2回目のreportIdが返されていないことを確認
    expect(result.reportId).not.toBe('RPT-001');
    expect(result.reportId).not.toBe('RPT-002');
  });
});