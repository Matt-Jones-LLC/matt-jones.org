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
                target = (file.parent / unquote(url.path)).resolve()
                assert target.is_relative_to(SITE), (file, link)
                assert target.exists(), (file, link)
            elif url.fragment:
                assert url.fragment in page.ids, (file, link)


def test_company_identity_and_approved_leadership():
    html = (SITE / "index.html").read_text()
    for text in ("Matt Jones, LLC", "Matt Jones", "Founder & CEO", "Aaron Oviedo", "Founding Advisor"):
        assert text in html
    assert "https://coolmatt.games" in html
    assert "IN DEVELOPMENT" in html


def test_private_files_are_outside_published_directory():
    forbidden = {".env", "AGENTS.md", "CLAUDE.md", "uv.lock", "pyproject.toml", "README.md"}
    assert not any(file.name in forbidden for file in SITE.rglob("*"))
