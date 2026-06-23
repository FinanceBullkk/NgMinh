import { expect, test } from "@playwright/test";
import {
  createAdminTestClient,
  createTestUser,
  type TestClient,
  type TestUser,
} from "@/tests/setup/supabase-test-clients";

test.describe("manager happy path", () => {
  // Mobile-first flow: at < lg the profile shows the sticky "+ Log today" button and the
  // bottom nav. (Desktop ≥ lg swaps in the sidebar + a "Log for {name}" header button.)
  test.use({ viewport: { width: 390, height: 844 } });

  let admin: TestClient;
  let user: TestUser;

  test.beforeAll(async () => {
    admin = createAdminTestClient();
    user = await createTestUser(admin, "e2e");
  });

  test.afterAll(async () => {
    if (user) await admin.auth.admin.deleteUser(user.id);
  });

  test("login, add employee and evidence, revise take, then see feed", async ({ page }) => {
    const employeeName = `Minh E2E ${Date.now()}`;
    const observation = "Delivered the release notes before the deadline";
    const currentTake = "Reliable on scoped delivery work";

    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("http://127.0.0.1:3100/");
    // Roster ready (auto-wait on a stable element instead of networkidle).
    await expect(page.getByRole("heading", { name: "Roster" })).toBeVisible();

    await page.getByRole("button", { name: "+ Employee", exact: true }).click();
    const employeeDialog = page.getByRole("dialog");
    await employeeDialog.getByLabel("Name *").fill(employeeName);
    await employeeDialog.getByLabel("Role").fill("Engineer");
    await employeeDialog.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("link", { name: employeeName })).toBeVisible();

    await page.getByRole("link", { name: employeeName }).click();
    // Wait for the profile URL before opening quick-add — the profile's preselected
    // "+ Log today" button is the only one with that label (the nav FAB is icon-only;
    // the roster daily-reminder uses "+ Log"). A heading-wait is not enough since the
    // employee card name is also a heading.
    await page.waitForURL(/\/employees\/[0-9a-f-]+$/);
    await page.getByRole("button", { name: "+ Log today" }).click();
    const entryDialog = page.getByRole("dialog");
    await entryDialog.getByPlaceholder(/Concrete observations/).fill(observation);
    await entryDialog.getByRole("button", { name: "Positive" }).click();
    // exact: the quick-add now also has a "Save & add another" button.
    await entryDialog.getByRole("button", { name: "Save", exact: true }).click();

    const timelineEntry = page.getByRole("listitem").filter({ hasText: observation });
    await expect(timelineEntry).toBeVisible();
    // Append-only: the only per-entry action is delete (no edit/overwrite affordance).
    await expect(timelineEntry.getByRole("button", { name: "Delete entry" })).toHaveCount(1);
    await expect(timelineEntry.getByRole("textbox")).toHaveCount(0);

    const take = page.getByLabel("Current take");
    await take.fill(currentTake);
    await take.blur();
    await expect(page.getByText("Saved", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Feed", exact: true }).click();
    await expect(page).toHaveURL(/\/feed$/);
    await expect(page.getByText(observation, { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: employeeName })).toBeVisible();
  });
});
