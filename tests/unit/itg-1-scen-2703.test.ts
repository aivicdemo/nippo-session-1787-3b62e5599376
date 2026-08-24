import { fetchYesterdayReport } from '../../src/logic/report-submission';

describe('fetchYesterdayReport', () => {
  // SCEN-2703: [edge] 前日報告内容の取得・表示機能 - 年度またぎの日付（例：3月31日から4月1日）に前日報告を取得すると、期間の区切りが正確である
  test('should retrieve yesterday report correctly across year boundaries (March 31 to April 1)', async () => {
    const engineerId = 'engineer-a-001';
    const requestingUserId = 'engineer-a-001';
    
    // Setup: Create mock database with a report from March 30, 2024 23:59:59
    const march30Report: DailyReport = {
      reportId: 'report-march-30-001',
      engineerId,
      reportDate: new Date('2024-03-30'),
      yesterdayAccomplishment: 'やったこと',
      todayPlan: '今日の予定',
      challenges: '課題内容',
      submittedAt: new Date('2024-03-30T23:59:59Z'),
    };

    // Step 1: Mock current time to March 31, 2024 09:00:00
    const march31Date = new Date('2024-03-31T09:00:00Z');
    
    // Simulate database fetch for March 31 request
    const march31FetchInput: FetchYesterdayReportInput = {
      engineerId,
      targetDate: march31Date,
      requestingUserId,
    };

    // Execute: Get yesterday report at March 31, 09:00:00
    const march31Result = await fetchYesterdayReport(march31FetchInput);

    // Verify: The report retrieved should be from March 30
    expect(march31Result).toBeDefined();
    expect(march31Result?.reportId).toBe('report-march-30-001');
    expect(march31Result?.submittedAt.toISOString()).toBe('2024-03-30T23:59:59Z');
    expect(march31Result?.yesterdayAccomplishment).toBe('やったこと');

    // Step 2: Mock current time to April 1, 2024 09:00:00
    const april1Date = new Date('2024-04-01T09:00:00Z');

    // Create mock report for March 31 (to be retrieved on April 1)
    const march31Report: DailyReport = {
      reportId: 'report-march-31-001',
      engineerId,
      reportDate: new Date('2024-03-31'),
      yesterdayAccomplishment: '3月31日のやったこと',
      todayPlan: '4月1日の予定',
      challenges: '4月1日の課題',
      submittedAt: new Date('2024-03-31T09:00:00Z'),
    };

    const april1FetchInput: FetchYesterdayReportInput = {
      engineerId,
      targetDate: april1Date,
      requestingUserId,
    };

    // Execute: Get yesterday report at April 1, 09:00:00
    const april1Result = await fetchYesterdayReport(april1FetchInput);

    // Verify: The report retrieved should be from March 31 (previous calendar day)
    expect(april1Result).toBeDefined();
    expect(april1Result?.reportId).toBe('report-march-31-001');
    expect(april1Result?.submittedAt.toISOString()).toBe('2024-03-31T09:00:00Z');
    expect(april1Result?.yesterdayAccomplishment).toBe('3月31日のやったこと');

    // Verify: March 30 report should NOT be included on April 1
    expect(april1Result?.reportId).not.toBe('report-march-30-001');

    // Step 3: Mock current time to April 1, 2024 00:00:00 (timezone boundary)
    const april1MidnightDate = new Date('2024-04-01T00:00:00Z');

    const april1MidnightFetchInput: FetchYesterdayReportInput = {
      engineerId,
      targetDate: april1MidnightDate,
      requestingUserId,
    };

    // Execute: Get yesterday report at April 1, 00:00:00
    const april1MidnightResult = await fetchYesterdayReport(april1MidnightFetchInput);

    // Verify: Only March 31 report should be returned (not March 30)
    expect(april1MidnightResult).toBeDefined();
    expect(april1MidnightResult?.reportId).toBe('report-march-31-001');
    expect(april1MidnightResult?.reportDate.toISOString().split('T')[0]).toBe('2024-03-31');
    expect(april1MidnightResult?.reportId).not.toBe('report-march-30-001');

    // Verify: The boundary condition is precise - calendar day boundary, not 24 hours
    const targetDateStr = april1MidnightDate.toISOString().split('T')[0]; // "2024-04-01"
    const previousDayStr = new Date(april1MidnightDate.getTime() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]; // "2024-03-31"
    
    expect(previousDayStr).toBe('2024-03-31');
    expect(april1MidnightResult?.reportDate.toISOString().split('T')[0]).toBe(previousDayStr);
  });
});