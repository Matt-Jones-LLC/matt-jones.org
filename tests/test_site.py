from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.ids = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.add(attrs["id"])
        for attribute in ("href", "src"):
            if attribute in attrs:
                self.links.append(attrs[attribute])


def test_published_pages_have_resolvable_local_links():
    for file in SITE.rglob("*.html"):
        page = Page()
        page.feed(file.read_text())
        for link in page.links:
            url = urlsplit(link)
            if url.scheme or url.netloc:
                continue
            if url.path:
                path = unquote(url.path)
                base = SITE if path.startswith("/") else file.parent
                target = (base / path.lstrip("/")).resolve()
                assert target.is_relative_to(SITE), (file, link)
                assert target.exists(), (file, link)
            elif url.fragment:
                assert url.fragment in page.ids, (file, link)


HELD_BACK = ("coolmatt.games", "coolmattgames.io", "flashisdead.com")


def test_home_page_identity_and_sole_leadership():
    html = (SITE / "index.html").read_text()
    for text in ("Matt Jones, LLC", "Matt Jones", "Founder &amp; CEO"):
        assert text in html
    assert "Aaron Oviedo" not in html


def test_held_back_sites_are_not_linked_or_named_by_address():
    # The arcade, the lab and Flash Is Dead are not public yet. Their addresses forward here,
    # so no published page may link to them or print their addresses.
    for file in SITE.rglob("*.html"):
        html = file.read_text()
        for address in HELD_BACK:
            assert address not in html, (file, address)


def test_current_work_is_described_and_marked_in_development():
    html = (SITE / "index.html").read_text()
    for marker in ('id="work"', 'id="flash-is-dead"', 'id="games"', 'id="mcp"', 'id="stack"'):
        assert marker in html
    assert html.count('class="status">In development<') == 3
    for text in ("Amazon S3", "CloudFront", "Model Context Protocol", "opt-in"):
        assert text in html
    assert "<embed" not in html and "<object" not in html and ".swf" not in html


def test_page_uses_only_its_own_stylesheet_and_no_held_back_art():
    html = (SITE / "index.html").read_text()
    assert '<link rel="stylesheet" href="/assets/main.css">' in html
    assert "<img" not in html
    assert not (SITE / "assets" / "cast").exists()
    assert not (SITE / "assets" / "gifs").exists()


def test_private_files_are_outside_published_directory():
    forbidden = {".env", "AGENTS.md", "CLAUDE.md", "uv.lock", "pyproject.toml", "README.md"}
    assert not any(file.name in forbidden for file in SITE.rglob("*"))


def test_not_found_page_links_home_and_forwards_nowhere():
    html = (SITE / "404.html").read_text()
    assert "/assets/main.css" in html
    assert 'href="/"' in html
    assert 'content="noindex"' in html
    assert "location.replace" not in html


def test_matt_avatar_favicon_is_linked_from_the_home_page():
    html = (SITE / "index.html").read_text()
    assert 'favicon.ico' in html and (SITE / "favicon.ico").exists()
