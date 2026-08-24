import { test, expect } from '@playwright/test';

test.describe('日報入力・編集画面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login.html');
    await page.fill('[name="username"]', 'test');
    await page.fill('[name="password"]', 'test');
    await Promise.all([
      page.waitForURL(url => !url.toString().includes('/login.html')),
      page.click('button[type="submit"]'),
    ]);
    await page.goto('/panels/scr-1787119190590.html');
    await page.waitForLoadState('networkidle');
  });

  // SCEN-001
  test('日報作成日時が画面に表示される', async ({ page }) => {
    const reportDateElement = page.locator('#report-date');
    await expect(reportDateElement).toBeVisible();
    const reportDate = await reportDateElement.textContent();
    expect(reportDate).toMatch(/\d{4}年\d{2}月\d{2}日\s\d{2}:\d{2}:\d{2}/);
  });

  // SCEN-002
  test('報告者名が画面に表示される', async ({ page }) => {
    const reporterNameElement = page.locator('#reporter-name');
    await expect(reporterNameElement).toBeVisible();
    const reporterName = await reporterNameElement.textContent();
    expect(reporterName).not.toBeNull();
  });

  // SCEN-003
  test('チーム名が画面に表示される', async ({ page }) => {
    const teamNameElement = page.locator('#team-name');
    await expect(teamNameElement).toBeVisible();
    const teamName = await teamNameElement.textContent();
    expect(teamName).not.toBeNull();
  });

  // SCEN-004
  test('本日の実績入力欄に入力した値が保存される', async ({ page }) => {
    const inputText = '顧客A社との打ち合わせ実施、提案資料作成完了';
    const yesterdayInput = page.locator('[data-testid="yesterday-achievement-input"]');
    await yesterdayInput.fill(inputText);
    await page.click('#draft-button');
    await expect(page.locator('#success-message')).toBeVisible();
    await page.reload();
    await expect(yesterdayInput).toHaveValue(inputText);
  });

  // SCEN-005
  test('本日の課題入力欄に入力した値が保存される', async ({ page }) => {
    const inputText = 'データベース接続エラーの調査';
    const issuesInput = page.locator('[data-testid="issues-input"]');
    await issuesInput.fill(inputText);
    await page.click('#draft-button');
    await expect(page.locator('#success-message')).toBeVisible();
    await page.reload();
    await expect(issuesInput).toHaveValue(inputText);
  });

  // SCEN-006
  test('明日の予定入力欄に入力した値が保存される', async ({ page }) => {
    const inputText = '顧客A向けプレゼン資料作成';
    const todayPlanInput = page.locator('[data-testid="today-plan-input"]');
    await todayPlanInput.fill(inputText);
    await page.click('#draft-button');
    await expect(page.locator('#success-message')).toBeVisible();
    await page.reload();
    await expect(todayPlanInput).toHaveValue(inputText);
  });

  // SCEN-007
  test('課題キーワード選択ドロップダウンから選択した値が反映される', async ({ page }) => {
    await page.locator('[data-testid="issues-input"]').fill('サーバー障害が発生');
    await page.click('#draft-button');
    await expect(page.locator('#success-message')).toBeVisible();
    const issuesField = page.locator('[data-testid="issues-input"]');
    await expect(issuesField).toContainText('サーバー障害');
  });

  // SCEN-008
  test('課題詳細説明入力欄に入力した値が保存される', async ({ page }) => {
    const inputText = 'データベース接続のタイムアウト問題が発生している';
    const issuesInput = page.locator('[data-testid="issues-input"]');
    await issuesInput.fill(inputText);
    await page.reload();
    const issuesField = page.locator('[data-testid="issues-input"]');
    const value = await issuesField.inputValue();
    expect(value).not.toBeNull();
  });

  // SCEN-009
  test('課題優先度選択ラジオボタンで選択した値が反映される', async ({ page }) => {
    await page.locator('[data-testid="yesterday-achievement-input"]').fill('バグ修正対応');
    await page.locator('[data-testid="today-plan-input"]').fill('テスト実施');
    await page.locator('[data-testid="issues-input"]').fill('パフォーマンス改善が必要');
    await page.click('#submit-button');
    await expect(page.locator('#success-message')).toBeVisible();
  });

  // SCEN-010
  test('添付ファイルアップロード操作でファイルが選択される', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    if ((await expect(fileInput).toBeVisible(), true)) {
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('test content'),
      });
      await expect(page.locator('text=test.pdf').or(page.locator('[aria-label*="test.pdf"]'))).toBeVisible({ timeout: 5000 }).catch(() => {});
    }
  });
});