import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type {
  AggregateReportSubmissionStatusInput,
  ReportSubmissionStatusSummary,
} from '../../src/logic/submission-status-tracking';

describe('報告提出状況追跡機能 - 月末から月初をまたぐ日報提出期限の状況が正確に判定される', () => {
  let originalNow: () => number;

  beforeEach(() => {
    originalNow = Date.now;
  });

  afterEach(() => {
    Date.now = originalNow;
  });

  // SCEN-1102
  test('月末から月初をまたぐ日報提出期限の状況が正確に判定される', async () => {
    // ============================================================
    // Setup: System time を 2026-08-31 23:55:00 (UTC) に設定
    // ============================================================
    const endOfAugustTime = new Date('2026-08-31T23:55:00Z').getTime();
    Date.now = jest.fn(() => endOfAugustTime);

    const teamId = 'team-001';
    const reportDateAugust31 = '2026-08-31';
    const requestUserId = 'admin-user-001';

    // ユーザーA が 8月31日の報告を期限内に提出した状態をシミュレート
    // (実際の実装では、事前にデータベースに reportSubmissionStatus レコードが存在)
    const userAId = 'user-a-001';
    const userBId = 'user-b-001';
    const userCId = 'user-c-001';

    // 8月31日の報告状況を集計するリクエスト (月末時点)
    const inputAugust31: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate: reportDateAugust31,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // 月末の提出状況集計を実行
    // 前提条件: ユーザーA は提出済み、ユーザーB とユーザーC は未提出
    const resultAugust31 = await aggregateReportSubmissionStatus(inputAugust31);

    // 月末時点での検証
    expect(resultAugust31.teamId).toBe(teamId);
    expect(resultAugust31.reportDate).toBe(reportDateAugust31);
    expect(resultAugust31.totalMembers).toBe(3); // A, B, C の 3 名
    expect(resultAugust31.submittedCount).toBe(1); // ユーザーA のみ提出済み
    expect(resultAugust31.unsubmittedCount).toBe(2); // ユーザーB, C は未提出
    expect(resultAugust31.delayedSubmissionCount).toBe(0); // 期限超過はなし
    expect(resultAugust31.submissionRate).toBe(33.3); // 1/3 = 33.3%

    // 未提出メンバーの詳細を検証
    expect(resultAugust31.unsubmittedMembers).toHaveLength(2);
    const unsubmittedUserIds = resultAugust31.unsubmittedMembers.map(m => m.userId);
    expect(unsubmittedUserIds).toContain(userBId);
    expect(unsubmittedUserIds).toContain(userCId);

    // 各メンバーの remainingMinutes を検証
    // (期限前なので正の値が期待される)
    const userBUnsubmitted = resultAugust31.unsubmittedMembers.find(m => m.userId === userBId);
    expect(userBUnsubmitted).toBeDefined();
    expect(userBUnsubmitted!.remainingMinutes).toBeGreaterThan(0);

    // aggregatedAt がISO 8601形式で記録されていることを確認
    expect(resultAugust31.aggregatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    // ============================================================
    // System time を 2026-09-01 09:00:00 (UTC) に進める (月初、朝会時刻)
    // ============================================================
    const beginningOfSeptemberTime = new Date('2026-09-01T09:00:00Z').getTime();
    Date.now = jest.fn(() => beginningOfSeptemberTime);

    const reportDateSeptember1 = '2026-09-01';

    // 月初の提出状況集計リクエスト
    const inputSeptember1: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate: reportDateSeptember1,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // 月初の提出状況を集計
    // 前提: ユーザーA, B は 9月1日の報告をまだ提出していない
    //      (9月1日分は別の報告対象日)
    const resultSeptember1 = await aggregateReportSubmissionStatus(inputSeptember1);

    // 月初時点での検証
    expect(resultSeptember1.teamId).toBe(teamId);
    expect(resultSeptember1.reportDate).toBe(reportDateSeptember1);
    expect(resultSeptember1.totalMembers).toBe(3);
    expect(resultSeptember1.submittedCount).toBe(0); // 9月1日時点では誰も提出していない
    expect(resultSeptember1.unsubmittedCount).toBe(3); // 全員未提出
    expect(resultSeptember1.delayedSubmissionCount).toBe(0); // まだ期限を超過していない
    expect(resultSeptember1.submissionRate).toBe(0.0); // 0/3 = 0%

    // 9月1日の未提出メンバーリスト
    expect(resultSeptember1.unsubmittedMembers).toHaveLength(3);
    const september1UnsubmittedIds = resultSeptember1.unsubmittedMembers.map(m => m.userId);
    expect(september1UnsubmittedIds).toContain(userAId);
    expect(september1UnsubmittedIds).toContain(userBId);
    expect(september1UnsubmittedIds).toContain(userCId);

    // ============================================================
    // 8月31日と9月1日のレコードが正確に分離・記録されているか確認
    // ============================================================

    // 8月31日の結果が変わっていないことを確認
    // (月初に進んでも、過去の日報状況は変わらない)
    const resultAugust31Again = await aggregateReportSubmissionStatus({
      teamId,
      reportDate: reportDateAugust31,
      requestUserId,
      includeDelayedSubmissions: true,
    });

    expect(resultAugust31Again.submittedCount).toBe(1); // ユーザーA は相変わらず提出済み
    expect(resultAugust31Again.unsubmittedCount).toBe(2);
    expect(resultAugust31Again.submissionRate).toBe(33.3);

    // 日付が正確に分離されているか確認
    // 8月31日と9月1日のレコードの reportDate が異なることを確認
    expect(resultAugust31Again.reportDate).toBe('2026-08-31');
    expect(resultSeptember1.reportDate).toBe('2026-09-01');

    // aggregatedAt のタイムスタンプが現在の system time を反映していることを確認
    const aggregatedAtSept1 = new Date(resultSeptember1.aggregatedAt).getTime();
    // aggregatedAt は集計実行時刻なので、呼び出し時刻 ± 5秒の範囲内にあるはず
    expect(Math.abs(aggregatedAtSept1 - beginningOfSeptemberTime)).toBeLessThan(5000);

    // ============================================================
    // ユーザーC が 8月31日の報告を期限内に送信していない場合の状況を確認
    // ============================================================

    // 8月31日の未提出メンバーリストにユーザーC が含まれていることを確認
    const userCUnsubmittedAugust = resultAugust31.unsubmittedMembers.find(
      m => m.userId === userCId
    );
    expect(userCUnsubmittedAugust).toBeDefined();
    expect(userCUnsubmittedAugust!.email).toBeDefined();
    expect(userCUnsubmittedAugust!.remainingMinutes).toBeGreaterThan(0);

    // 月初の時点でも、8月31日の未提出状況は変わらない
    // (8月31日のレコードは独立している)
    const resultAugust31Final = await aggregateReportSubmissionStatus({
      teamId,
      reportDate: reportDateAugust31,
      requestUserId,
      includeDelayedSubmissions: true,
    });

    const userCUnsubmittedFinal = resultAugust31Final.unsubmittedMembers.find(
      m => m.userId === userCId
    );
    expect(userCUnsubmittedFinal).toBeDefined();

    // ============================================================
    // 最終確認: 日付別の集計結果の一貫性を検証
    // ============================================================

    // 8月31日: 提出済み（A）、未提出（B, C）
    expect(resultAugust31.submittedCount).toBe(1);
    expect(resultAugust31.unsubmittedCount).toBe(2);

    // 9月1日: 提出済み（なし）、未提出（A, B, C）
    expect(resultSeptember1.submittedCount).toBe(0);
    expect(resultSeptember1.unsubmittedCount).toBe(3);

    // 各日付で正確に分類・管理されていることが確認できた
    expect(resultAugust31.reportDate).not.toBe(resultSeptember1.reportDate);
  });
});