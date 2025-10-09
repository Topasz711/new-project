import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate to the local index.html file
        import os
        file_path = "file://" + os.path.abspath("index.html")
        await page.goto(file_path)

        # Click the start button
        await page.click("#start-btn")

        # Click the "Mini-Game" link in the sidebar
        await page.click("a[data-target='miniGameContent']")

        # Wait for the game board to be visible
        await expect(page.locator("#game-board")).to_be_visible()

        # Take a screenshot
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())