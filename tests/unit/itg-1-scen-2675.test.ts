import { describe, test, expect } from '@jest/globals';
import { fetchYesterdayReport } from '../../src/logic/report-submission';

describe('fetchYesterdayReport', () => {
  test('SCEN-2675: [normal] 前日報告内容の取得・表示機能 - ログイン済みエンジニアの前日報告が複数件存在する場合、すべての報告内容が正常に取得される', async () => {
    const engineerId = 'engineer-001';
    const requestingUserId = 'engineer-001';
    const targetDate = new Date('2024-01-15');

    const yesterdayAccomplishment1 = '機能X実装';
    const yesterdayAccomplishment2 = 'バグ修正';
    const yesterdayAccomplishment3 = 'レビュー対応';

    const todayPlan1 = '機能Y実装を開始';
    const todayPlan2 = '統合テスト実施';
    const todayPlan3 = 'ドキュメント作成';

    const challenges1 = 'API仕様の曖昧さ';
    const challenges2 = 'テストカバレッジ不足';
    const challenges3 = 'スケジュール遅延';

    const reportId1 = 'report-20240114-001';
    const reportId2 = 'report-20240114-002';
    const reportId3 = 'report-20240114-003';

    const submittedAt1 = new Date('2024-01-14T08:30:00Z');
    const submittedAt2 = new Date('2024-01-14T08:45:00Z');
    const submittedAt3 = new Date('2024-01-14T09:00:00Z');

    const reportDate = new Date('2024-01-14');

    const result = await fetchYesterdayReport({
      engineerId,
      targetDate,
      requestingUserId,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);

    const report1 = result[0];
    expect(report1.reportId).toBe(reportId1);
    expect(report1.engineerId).toBe(engineerId);
    expect(report1.reportDate).toEqual(reportDate);
    expect(report1.yesterdayAccomplishment).toBe(yesterdayAccomplishment1);
    expect(report1.todayPlan).toBe(todayPlan1);
    expect(report1.challenges).toBe(challenges1);
    expect(report1.submittedAt).toEqual(submittedAt1);

    const report2 = result[1];
    expect(report2.reportId).toBe(reportId2);
    expect(report2.engineerId).toBe(engineerId);
    expect(report2.reportDate).toEqual(reportDate);
    expect(report2.yesterdayAccomplishment).toBe(yesterdayAccomplishment2);
    expect(report2.todayPlan).toBe(todayPlan2);
    expect(report2.challenges).toBe(challenges2);
    expect(report2.submittedAt).toEqual(submittedAt2);

    const report3 = result[2];
    expect(report3.reportId).toBe(reportId3);
    expect(report3.engineerId).toBe(engineerId);
    expect(report3.reportDate).toEqual(reportDate);
    expect(report3.yesterdayAccomplishment).toBe(yesterdayAccomplishment3);
    expect(report3.todayPlan).toBe(todayPlan3);
    expect(report3.challenges).toBe(challenges3);
    expect(report3.submittedAt).toEqual(submittedAt3);
  });
});