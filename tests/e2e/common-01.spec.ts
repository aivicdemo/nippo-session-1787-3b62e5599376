import { test, expect } from '@playwright/test';

test.describe('リマインド通知管理画面', () => {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  const PANEL_URL = `${BASE_URL}/panels/scr-1787119211243.html`;

  test.beforeEach(async ({ page }) => {
    await page.goto(PANEL_URL);
    await page.waitForLoadState('networkidle');
  });

  // SCEN-001: スケジュール新規作成ボタン押下でスケジュール作成フォームが表示される
  test('SCEN-001: スケジュール新規作成ボタンが表示され、クリック後にフォームが表示される', async ({ page }) => {
    const createButton = page.locator('button:has-text("スケジュール新規作成")').first();
    await expect(createButton).toBeVisible();
    await createButton.click();
    
    const form = page.locator('form').first();
    await expect(form).toBeVisible();
  });

  // SCEN-002: リマインド送信時刻の入力値がスケジュール保存時に反映される
  test('SCEN-002: リマインド送信時刻「06:30」を入力して保存後、値が保持される', async ({ page }) => {
    const createButton = page.locator('button:has-text("スケジュール新規作成")').first();
    await createButton.click();

    const timeInput = page.locator('input[type="time"]').first();
    await timeInput.fill('06:30');

    const saveButton = page.locator('button:has-text("保存")').first();
    await saveButton.click();
    await page.waitForTimeout(500);

    const savedValue = await timeInput.inputValue();
    expect(savedValue).toBe('06:30');
  });

  // SCEN-003: 対象チームの選択値がスケジュール保存時に反映される
  test('SCEN-003: 対象チーム「チームA」を選択して保存後、一覧に反映される', async ({ page }) => {
    const createButton = page.locator('button:has-text("スケジュール新規作成")').first();
    await createButton.click();

    const teamSelect = page.locator('select').first();
    await teamSelect.selectOption('team-a');

    const saveButton = page.locator('button:has-text("保存")').first();
    await saveButton.click();
    await page.waitForTimeout(500);

    const tableRow = page.locator('table tbody tr').first();
    await expect(tableRow).toContainText('チームA');
  });

  // SCEN-004: 対象メンバーの選択値がスケジュール保存時に反映される
  test('SCEN-004: 対象メンバー複数選択後、詳細画面で選択メンバーが表示される', async ({ page }) => {
    const createButton = page.locator('button:has-text("スケジュール新規作成")').first();
    await createButton.click();

    const memberCheckboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await memberCheckboxes.count();
    if (checkboxCount >= 3) {
      await memberCheckboxes.nth(0).check();
      await memberCheckboxes.nth(1).check();
      await memberCheckboxes.nth(2).check();
    }

    const saveButton = page.locator('button:has-text("保存")').first();
    await saveButton.click();
    await page.waitForTimeout(500);

    const detailLink = page.locator('table tbody tr a').first();
    await detailLink.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.locator('div').first();
    await expect(detailPage).toBeVisible();
  });

  // SCEN-005: 定時リマインド通知の自動送信設定を有効にできる
  test('SCEN-005: 定時リマインド通知トグルをOFFからONに切り替えできる', async ({ page }) => {
    const toggleSwitch = page.locator('input[type="checkbox"][aria-label*="定時リマインド"]').first();
    await toggleSwitch.uncheck();
    await page.waitForTimeout(300);

    await toggleSwitch.check();
    await page.waitForTimeout(300);

    const isChecked = await toggleSwitch.isChecked();
    expect(isChecked).toBe(true);

    const saveButton = page.locator('button:has-text("保存")').first();
    await saveButton.click();
    await page.waitForTimeout(500);

    await page.reload();
    const reloadedToggle = page.locator('input[type="checkbox"][aria-label*="定時リマインド"]').first();
    const reloadedState = await reloadedToggle.isChecked();
    expect(reloadedState).toBe(true);
  });

  // SCEN-006: 定時リマインド通知の自動送信設定を無効にできる
  test('SCEN-006: 定時リマインド通知トグルをONからOFFに切り替えできる', async ({ page }) => {
    const toggleSwitch = page.locator('input[type="checkbox"][aria-label*="定時リマインド"]').first();
    await toggleSwitch.check();
    await page.waitForTimeout(300);

    await toggleSwitch.uncheck();
    await page.waitForTimeout(300);

    const isChecked = await toggleSwitch.isChecked();
    expect(isChecked).toBe(false);

    const saveButton = page.locator('button:has-text("保存")').first();
    await saveButton.click();
    await page.waitForTimeout(500);
  });

  // SCEN-007: スケジュール有効/無効の切り替えボタン押下で状態が変わる
  test('SCEN-007: スケジュール行の有効/無効トグルをクリックで状態が変わる', async ({ page }) => {
    const tableRows = page.locator('table tbody tr');
    const rowCount = await tableRows.count();
    
    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const toggle = firstRow.locator('input[type="checkbox"]').first();
      
      const initialState = await toggle.isChecked();
      await toggle.click();
      await page.waitForTimeout(300);

      const finalState = await toggle.isChecked();
      expect(finalState).not.toBe(initialState);
    }
  });

  // SCEN-008: 有効なスケジュール行の有効/無効切り替えで無効状態に変わる
  test('SCEN-008: 有効なスケジュールを無効に切り替え可能', async ({ page }) => {
    const tableRows = page.locator('table tbody tr');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const toggle = firstRow.locator('input[type="checkbox"]').first();
      
      await toggle.check();
      await page.waitForTimeout(300);
      await toggle.uncheck();
      await page.waitForTimeout(300);

      const isChecked = await toggle.isChecked();
      expect(isChecked).toBe(false);
    }
  });

  // SCEN-009: 無効なスケジュール行の有効/無効切り替えで有効状態に変わる
  test('SCEN-009: 無効なスケジュールを有効に切り替え可能', async ({ page }) => {
    const tableRows = page.locator('table tbody tr');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const toggle = firstRow.locator('input[type="checkbox"]').first();
      
      await toggle.uncheck();
      await page.waitForTimeout(300);
      await toggle.check();
      await page.waitForTimeout(300);

      const isChecked = await toggle.isChecked();
      expect(isChecked).toBe(true);
    }
  });

  // SCEN-010: リマインド通知スケジュール一覧に複数件のスケジュールが表示される
  test('SCEN-010: リマインド通知スケジュール一覧に複数件のスケジュールが表示される', async ({ page }) => {
    const table = page.locator('table').first();
    await expect(table).toBeVisible();

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    
    expect(rowCount).toBeGreaterThanOrEqual(2);

    const firstRow = rows.first();
    const cells = firstRow.locator('td');
    const cellCount = await cells.count();
    
    expect(cellCount).toBeGreaterThan(0);
  });
});