import { describe, test, expect } from '@jest/globals';
import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2039: [error] 対策案・実行計画の必須項目検証 - 終了日時が開始日時より前のとき検証エラーになる
  test('should reject submission when end datetime is before start datetime', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'データベース最適化を完了',
      todayPlan: 'テスト環境構築',
      challenges: 'ネットワーク遅延の問題が継続',
      reportDate: '2024-01-15',
      countermeasurePlan: {
        content: 'ネットワーク回線の冗長化',
        startDateTime: new Date('2024-01-15T09:00:00Z'),
        endDateTime: new Date('2024-01-15T08:00:00Z'),
        assignee: 'manager-001',
      },
    };

    expect(() => submitDailyReport(input)).toThrow(/終了日時は開始日時以降/);
  });
});