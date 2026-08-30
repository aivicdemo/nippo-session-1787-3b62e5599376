import { describe, test, expect } from '@jest/globals';
import { getSubmissionStatus } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム - 提出状況照会', () => {
  // SCEN-044: 指定日付のチーム全体の報告提出状況を集計し、提出済み・未提出メンバーと提出時刻を返す - 指定された日付が無効または範囲が逆順の場合
  test('日付範囲が逆順の場合、InvalidDateRangeErrorをスロー', () => {
    const teamId = 'team-001';
    const requesterId = 'user-123';
    const laterDate = '2024-01-15';
    const earlierDate = '2024-01-10';
    const evenEarlierDate = '2024-01-05';

    // 1回目の呼び出し: laterDateでの呼び出し
    expect(() => getSubmissionStatus({
      teamId,
      reportDate: laterDate,
      requesterId,
    })).not.toThrow();

    // 2回目の呼び出し: earlierDateでの呼び出し
    expect(() => getSubmissionStatus({
      teamId,
      reportDate: earlierDate,
      requesterId,
    })).not.toThrow();

    // 3回目の呼び出し: evenEarlierDateでの呼び出し - 日付範囲が逆順となるケース
    expect(() => getSubmissionStatus({
      teamId,
      reportDate: evenEarlierDate,
      requesterId,
    })).toThrow(/日付範囲/);
  });
});