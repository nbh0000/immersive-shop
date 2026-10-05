from pathlib import Path
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
QA_DIR = ROOT / "qa"
QA_DIR.mkdir(exist_ok=True)


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        desktop = browser.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        desktop.goto("http://127.0.0.1:5180", wait_until="networkidle")
        desktop.screenshot(path=str(QA_DIR / "desktop-top.png"), full_page=False)

        assert desktop.title() == "Drift Objects — Immersive Shop"
        assert desktop.locator(".product-stage__item").count() == 5
        assert desktop.locator(".world-track--base .world-tile").count() == 5
        world_transform_at_top = desktop.locator(".world-track--base .world-track").evaluate("node => getComputedStyle(node).transform")
        tile_animation = desktop.locator(".world-track--reveal .world-tile").first.evaluate("node => getComputedStyle(node).animationName")
        assert tile_animation == "world-tile-drift", tile_animation

        desktop.mouse.move(720, 450)
        desktop.wait_for_timeout(300)
        reveal_mask = desktop.locator(".world-track--reveal").evaluate("node => getComputedStyle(node).maskImage || getComputedStyle(node).webkitMaskImage")
        assert "radial-gradient" in reveal_mask
        desktop.screenshot(path=str(QA_DIR / "desktop-pointer-reveal.png"), full_page=False)

        for x, y in [(500, 330), (610, 410), (730, 470), (850, 420), (980, 340), (1110, 470)]:
            desktop.mouse.move(x, y)
            desktop.wait_for_timeout(90)
        trail_mask = desktop.locator(".scene-sticky").evaluate("node => node.style.getPropertyValue('--pointer-trail-mask')")
        assert trail_mask.count("radial-gradient") >= 4, trail_mask
        pointer_world_transform = desktop.locator(".world-track--reveal .world-track").evaluate("node => getComputedStyle(node).transform")
        assert pointer_world_transform != world_transform_at_top
        desktop.screenshot(path=str(QA_DIR / "pointer-trail.png"), full_page=False)
        desktop.wait_for_timeout(2600)
        trail_faded = desktop.locator(".scene-sticky").evaluate("node => ({ active: node.classList.contains('has-pointer'), mask: node.style.getPropertyValue('--pointer-trail-mask') })")
        assert not trail_faded["active"]
        assert "transparent 0%" in trail_faded["mask"]

        desktop.evaluate("window.scrollTo(0, document.querySelector('.immersive-scene').offsetHeight - window.innerHeight - 30)")
        desktop.wait_for_timeout(500)
        world_transform_at_bottom = desktop.locator(".world-track--base .world-track").evaluate("node => getComputedStyle(node).transform")
        assert world_transform_at_top != world_transform_at_bottom
        active_product = desktop.locator(".scene-progress .is-active").inner_text()
        assert active_product == "05", active_product
        desktop.screenshot(path=str(QA_DIR / "desktop-product-05.png"), full_page=False)

        desktop.evaluate("window.scrollTo(0, document.querySelector('.material-story').offsetTop + window.innerHeight * 0.45)")
        desktop.wait_for_timeout(450)
        desktop.screenshot(path=str(QA_DIR / "material-story-plaster.png"), full_page=False)
        desktop.evaluate("window.scrollTo(0, document.querySelector('.material-story').offsetTop + window.innerHeight * 1.35)")
        desktop.wait_for_timeout(450)
        desktop.screenshot(path=str(QA_DIR / "material-story-fiber.png"), full_page=False)

        mobile = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
        mobile.goto("http://127.0.0.1:5180", wait_until="networkidle")
        mobile.screenshot(path=str(QA_DIR / "mobile-top.png"), full_page=False)
        assert mobile.locator(".product-media").count() == 10
        overflow = mobile.evaluate("document.documentElement.scrollWidth > window.innerWidth")
        assert not overflow, "horizontal overflow detected"

        print({"desktop_reveal": reveal_mask, "panorama_panels": 5, "tile_drift": tile_animation, "pointer_parallax": pointer_world_transform != world_transform_at_top, "background_moved": world_transform_at_top != world_transform_at_bottom, "pointer_trail_layers": trail_mask.count("radial-gradient"), "pointer_trail_faded": not trail_faded["active"], "active_product_after_scroll": active_product, "mobile_horizontal_overflow": overflow})
        browser.close()


if __name__ == "__main__":
    main()
