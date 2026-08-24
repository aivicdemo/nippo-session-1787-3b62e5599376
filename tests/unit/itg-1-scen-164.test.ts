import { encryptDailyReportData } from '../../src/logic/data-security';

describe('Daily Report Data Encryption', () => {
  test('SCEN-164: Encrypts daily report data and stores with access control list for manager decryption', () => {
    // Input: Engineer's daily report with three required fields
    const reporterId = 'engineer-001';
    const reportDate = new Date('2024-01-15');
    const yesterdayAccomplishment = 'Completed database migration and verified data integrity';
    const todayPlan = 'Review pull requests and conduct code review session';
    const challenges = 'Deployment script has timeout issues in production environment';
    const encryptionKeyId = 'key-2024-01-15-v1';
    const executorUserId = 'admin-001';

    const encryptDailyReportDataInput = {
      reporterId,
      reportDate,
      yesterdayAccomplishment,
      todayPlan,
      challenges,
      encryptionKeyId,
      executorUserId,
    };

    // Execute encryption
    const result = encryptDailyReportData(encryptDailyReportDataInput);

    // Verify output structure and field presence
    expect(result).toBeDefined();
    expect(result.encryptedReportId).toBeDefined();
    expect(typeof result.encryptedReportId).toBe('string');
    expect(result.encryptedReportId.length).toBeGreaterThan(0);

    // Verify reporter ID and report date are preserved in plaintext for searchability
    expect(result.reporterId).toBe(reporterId);
    expect(result.reportDate).toEqual(reportDate);

    // Verify encrypted content is non-empty and differs from plaintext
    expect(result.encryptedContent).toBeDefined();
    expect(typeof result.encryptedContent).toBe('string');
    expect(result.encryptedContent.length).toBeGreaterThan(0);
    expect(result.encryptedContent).not.toContain(yesterdayAccomplishment);
    expect(result.encryptedContent).not.toContain(todayPlan);
    expect(result.encryptedContent).not.toContain(challenges);

    // Verify encryption key ID is recorded
    expect(result.encryptionKeyId).toBe(encryptionKeyId);

    // Verify encrypted timestamp is recorded
    expect(result.encryptedAt).toBeDefined();
    expect(result.encryptedAt instanceof Date).toBe(true);

    // Verify access control list contains manager role with decryption permission
    expect(result.accessControlList).toBeDefined();
    expect(Array.isArray(result.accessControlList)).toBe(true);
    expect(result.accessControlList.length).toBeGreaterThan(0);

    const managerAccessEntry = result.accessControlList.find(
      (entry) => entry.userRole === 'manager'
    );
    expect(managerAccessEntry).toBeDefined();
    expect(managerAccessEntry?.canDecrypt).toBe(true);

    // Verify engineer role has no decryption permission
    const engineerAccessEntry = result.accessControlList.find(
      (entry) => entry.userRole === 'engineer'
    );
    if (engineerAccessEntry) {
      expect(engineerAccessEntry.canDecrypt).toBe(false);
    }

    // Verify admin role (executor) has decryption permission
    const adminAccessEntry = result.accessControlList.find(
      (entry) => entry.userRole === 'admin'
    );
    if (adminAccessEntry) {
      expect(adminAccessEntry.canDecrypt).toBe(true);
    }
  });
});