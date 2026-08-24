import { describe, test, expect, beforeEach } from '@jest/globals';
import { encryptDailyReportData, type EncryptDailyReportDataInput, type EncryptedDailyReportData } from '../../src/logic/data-security';

describe('Daily Report Encryption - Multiple Independent Keys', () => {
  test('SCEN-201: Multiple daily reports are independently encrypted with different encryption keys', async () => {
    // Preparation: Initialize test data for three daily reports
    const reportDate = new Date('2024-01-15');

    const dailyReport1Input: EncryptDailyReportDataInput = {
      reporterId: 'engineer-a',
      reportDate: reportDate,
      yesterdayAccomplishment: 'バグ修正',
      todayPlan: 'テスト実施',
      challenges: 'パフォーマンス低下',
      encryptionKeyId: 'key-id-1',
      executorUserId: 'admin-user-1',
    };

    const dailyReport2Input: EncryptDailyReportDataInput = {
      reporterId: 'engineer-b',
      reportDate: reportDate,
      yesterdayAccomplishment: '要件定義',
      todayPlan: '実装開始',
      challenges: '仕様不明',
      encryptionKeyId: 'key-id-2',
      executorUserId: 'admin-user-1',
    };

    const dailyReport3Input: EncryptDailyReportDataInput = {
      reporterId: 'engineer-c',
      reportDate: reportDate,
      yesterdayAccomplishment: 'デプロイ完了',
      todayPlan: '監視',
      challenges: 'ログ容量',
      encryptionKeyId: 'key-id-3',
      executorUserId: 'admin-user-1',
    };

    // Execute: Encrypt three daily reports with different encryption keys
    const encryptedReport1: EncryptedDailyReportData = await encryptDailyReportData(dailyReport1Input);
    const encryptedReport2: EncryptedDailyReportData = await encryptDailyReportData(dailyReport2Input);
    const encryptedReport3: EncryptedDailyReportData = await encryptDailyReportData(dailyReport3Input);

    // Verify: Each report is encrypted with a different key
    expect(encryptedReport1.encryptionKeyId).toBe('key-id-1');
    expect(encryptedReport2.encryptionKeyId).toBe('key-id-2');
    expect(encryptedReport3.encryptionKeyId).toBe('key-id-3');

    // Verify: Encryption key IDs are distinct
    expect(encryptedReport1.encryptionKeyId).not.toBe(encryptedReport2.encryptionKeyId);
    expect(encryptedReport2.encryptionKeyId).not.toBe(encryptedReport3.encryptionKeyId);
    expect(encryptedReport1.encryptionKeyId).not.toBe(encryptedReport3.encryptionKeyId);

    // Verify: Encrypted content fields are present and not empty
    expect(encryptedReport1.encryptedContent).toBeDefined();
    expect(encryptedReport1.encryptedContent.length).toBeGreaterThan(0);
    expect(encryptedReport2.encryptedContent).toBeDefined();
    expect(encryptedReport2.encryptedContent.length).toBeGreaterThan(0);
    expect(encryptedReport3.encryptedContent).toBeDefined();
    expect(encryptedReport3.encryptedContent.length).toBeGreaterThan(0);

    // Verify: Encrypted contents are different from each other
    expect(encryptedReport1.encryptedContent).not.toBe(encryptedReport2.encryptedContent);
    expect(encryptedReport2.encryptedContent).not.toBe(encryptedReport3.encryptedContent);
    expect(encryptedReport1.encryptedContent).not.toBe(encryptedReport3.encryptedContent);

    // Verify: Metadata fields (reporterId, reportDate) are preserved in plaintext
    expect(encryptedReport1.reporterId).toBe('engineer-a');
    expect(encryptedReport1.reportDate).toEqual(reportDate);
    expect(encryptedReport2.reporterId).toBe('engineer-b');
    expect(encryptedReport2.reportDate).toEqual(reportDate);
    expect(encryptedReport3.reporterId).toBe('engineer-c');
    expect(encryptedReport3.reportDate).toEqual(reportDate);

    // Verify: AccessControlList is populated with appropriate entries
    expect(encryptedReport1.accessControlList).toBeDefined();
    expect(Array.isArray(encryptedReport1.accessControlList)).toBe(true);
    expect(encryptedReport1.accessControlList.length).toBeGreaterThan(0);
    expect(encryptedReport2.accessControlList).toBeDefined();
    expect(Array.isArray(encryptedReport2.accessControlList)).toBe(true);
    expect(encryptedReport2.accessControlList.length).toBeGreaterThan(0);
    expect(encryptedReport3.accessControlList).toBeDefined();
    expect(Array.isArray(encryptedReport3.accessControlList)).toBe(true);
    expect(encryptedReport3.accessControlList.length).toBeGreaterThan(0);

    // Verify: encryptedAt timestamps are present and valid
    expect(encryptedReport1.encryptedAt).toBeDefined();
    expect(typeof encryptedReport1.encryptedAt.getTime).toBe('function');
    expect(encryptedReport2.encryptedAt).toBeDefined();
    expect(typeof encryptedReport2.encryptedAt.getTime).toBe('function');
    expect(encryptedReport3.encryptedAt).toBeDefined();
    expect(typeof encryptedReport3.encryptedAt.getTime).toBe('function');

    // Verify: Each encrypted report has a unique encryptedReportId
    expect(encryptedReport1.encryptedReportId).toBeDefined();
    expect(encryptedReport1.encryptedReportId.length).toBeGreaterThan(0);
    expect(encryptedReport2.encryptedReportId).toBeDefined();
    expect(encryptedReport2.encryptedReportId.length).toBeGreaterThan(0);
    expect(encryptedReport3.encryptedReportId).toBeDefined();
    expect(encryptedReport3.encryptedReportId.length).toBeGreaterThan(0);
    expect(encryptedReport1.encryptedReportId).not.toBe(encryptedReport2.encryptedReportId);
    expect(encryptedReport2.encryptedReportId).not.toBe(encryptedReport3.encryptedReportId);
    expect(encryptedReport1.encryptedReportId).not.toBe(encryptedReport3.encryptedReportId);

    // Verify: Access control entries contain proper role information
    const report1AccessEntry = encryptedReport1.accessControlList[0];
    expect(report1AccessEntry.userId).toBeDefined();
    expect(report1AccessEntry.userRole).toBeDefined();
    expect(['manager', 'director', 'admin'].includes(report1AccessEntry.userRole)).toBe(true);
    expect(report1AccessEntry.canDecrypt).toBe(true);

    const report2AccessEntry = encryptedReport2.accessControlList[0];
    expect(report2AccessEntry.userId).toBeDefined();
    expect(report2AccessEntry.userRole).toBeDefined();
    expect(['manager', 'director', 'admin'].includes(report2AccessEntry.userRole)).toBe(true);
    expect(report2AccessEntry.canDecrypt).toBe(true);

    const report3AccessEntry = encryptedReport3.accessControlList[0];
    expect(report3AccessEntry.userId).toBeDefined();
    expect(report3AccessEntry.userRole).toBeDefined();
    expect(['manager', 'director', 'admin'].includes(report3AccessEntry.userRole)).toBe(true);
    expect(report3AccessEntry.canDecrypt).toBe(true);
  });
});