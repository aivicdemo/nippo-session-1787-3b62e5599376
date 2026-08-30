import { submitReport } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム', () => {
  // SCEN-284: エンジニアが日報を送信し、入力検証、送信時刻記録、期限判定、提出状況更新を実行する
  test('validateReportSubmissionDeadlineが設計された計算式の代表値を返す', () => {
    const reportDate = new Date('2024-01-15T00:00:00Z');
    const currentBaseTime = new Date('2024-01-15T08:00:00Z');

    // 代表値1: 期限内の送信ケース（08:55に送信、期限09:00）
    const submissionTimestamp1 = new Date('2024-01-15T08:55:00Z');
    const reportDeadlineTime1 = '09:00';
    const engineerId1 = 'ENG001';

    const result1 = submitReport({
      submissionTimestamp: submissionTimestamp1,
      reportDeadlineTime: reportDeadlineTime1,
      engineerId: engineerId1,
      reportDate: reportDate,
      currentTime: currentBaseTime,
    });

    expect(result1.isLate).toBe(false);
    expect(result1.minutesOverDeadline).toBe(0);
    expect(result1.shouldNotifyManager).toBe(false);
    expect(result1.notificationMessage).toBe('');

    // 代表値2: 期限超過5分ちょうどのケース（09:05に送信、期限09:00）
    const submissionTimestamp2 = new Date('2024-01-15T09:05:00Z');
    const reportDeadlineTime2 = '09:00';
    const engineerId2 = 'ENG002';

    const result2 = submitReport({
      submissionTimestamp: submissionTimestamp2,
      reportDeadlineTime: reportDeadlineTime2,
      engineerId: engineerId2,
      reportDate: reportDate,
      currentTime: currentBaseTime,
    });

    expect(result2.isLate).toBe(true);
    expect(result2.minutesOverDeadline).toBe(5);
    expect(result2.shouldNotifyManager).toBe(true);
    expect(result2.notificationMessage).toContain('ENG002');
    expect(result2.notificationMessage).toContain('5分遅延');

    // 代表値3: 期限超過15分のケース（09:15に送信、期限09:00）
    const submissionTimestamp3 = new Date('2024-01-15T09:15:00Z');
    const reportDeadlineTime3 = '09:00';
    const engineerId3 = 'ENG003';

    const result3 = submitReport({
      submissionTimestamp: submissionTimestamp3,
      reportDeadlineTime: reportDeadlineTime3,
      engineerId: engineerId3,
      reportDate: reportDate,
      currentTime: currentBaseTime,
    });

    expect(result3.isLate).toBe(true);
    expect(result3.minutesOverDeadline).toBe(15);
    expect(result3.shouldNotifyManager).toBe(true);
    expect(result3.notificationMessage).toContain('ENG003');
    expect(result3.notificationMessage).toContain('15分遅延');

    // 境界制約1: reportDeadlineTimeが'25:00'（HH:mm形式違反）
    expect(() =>
      submitReport({
        submissionTimestamp: submissionTimestamp1,
        reportDeadlineTime: '25:00',
        engineerId: engineerId1,
        reportDate: reportDate,
        currentTime: currentBaseTime,
      })
    ).toThrow(/報告期限の時刻形式が不正です。HH:mm 形式で設定してください/);

    // 境界制約2: submissionTimestampが現在時刻より60分先未来
    const futureTimestamp = new Date('2024-01-15T09:00:00Z');
    const pastTime = new Date('2024-01-15T08:00:00Z');

    expect(() =>
      submitReport({
        submissionTimestamp: futureTimestamp,
        reportDeadlineTime: reportDeadlineTime1,
        engineerId: engineerId1,
        reportDate: reportDate,
        currentTime: pastTime,
      })
    ).toThrow(/送信時刻が不正です。現在時刻以前である必要があります/);

    // 境界制約3: engineerIdが空文字列
    expect(() =>
      submitReport({
        submissionTimestamp: submissionTimestamp1,
        reportDeadlineTime: reportDeadlineTime1,
        engineerId: '',
        reportDate: reportDate,
        currentTime: currentBaseTime,
      })
    ).toThrow(/エンジニア ID が指定されていません/);
  });
});