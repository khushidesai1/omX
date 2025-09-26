import base64
import mimetypes
import re
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(page_title="omX", page_icon="🚀", layout="wide")

ROOT_DIR = Path(__file__).parent
DIST_DIR = ROOT_DIR / "frontend" / "dist"
ASSETS_DIR = DIST_DIR / "assets"


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _asset_to_data_uri(asset_path: Path) -> str:
    if not asset_path.exists():
        return ""
    mime, _ = mimetypes.guess_type(asset_path.name)
    mime = mime or "application/octet-stream"
    b64 = base64.b64encode(asset_path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{b64}"


def _inline_asset_urls(content: str) -> str:
    if not ASSETS_DIR.exists():
        return content

    asset_pattern = re.compile(r'(["\'])/(assets/[^"\']+)(["\'])')

    def _inline_match(match: re.Match[str]) -> str:
        quote = match.group(1)
        rel_path = match.group(2)
        asset_path = DIST_DIR / rel_path
        if asset_path.suffix in {".js", ".css", ""}:
            return f"{quote}/{rel_path}{quote}"
        data_uri = _asset_to_data_uri(asset_path)
        return f"{quote}{data_uri or '/' + rel_path}{quote}"

    content = asset_pattern.sub(_inline_match, content)

    def _css_replace(match: re.Match[str]) -> str:
        quote = match.group(1) or ""
        rel_path = match.group(2)
        asset_path = DIST_DIR / rel_path
        if asset_path.suffix in {".js", ".css", ""}:
            return match.group(0)
        data_uri = _asset_to_data_uri(asset_path)
        if not data_uri:
            return match.group(0)
        return f"url({quote}{data_uri}{quote})"

    css_pattern = re.compile(r"url\((['\"]?)/?(assets/[^'\"\)]+)['\"]?\)")
    return css_pattern.sub(_css_replace, content)


def build_frontend_html() -> str:
    if not DIST_DIR.exists():
        return ""

    index_path = DIST_DIR / "index.html"
    if not index_path.exists():
        return ""

    index_html = _read_text(index_path)

    # Replace CSS links with inline styles
    def _inline_css(match: re.Match[str]) -> str:
        rel_path = match.group(1)
        css_path = DIST_DIR / rel_path
        if not css_path.exists():
            return ""
        css = _inline_asset_urls(_read_text(css_path))
        return f"<style>{css}</style>"

    index_html = re.sub(r"<link[^>]+href=\"/(assets/[^\"']+)\"[^>]*/?>", _inline_css, index_html)

    # Inline favicon if present
    favicon_path = DIST_DIR / "vite.svg"
    if favicon_path.exists():
        favicon_data = _asset_to_data_uri(favicon_path)
        index_html = index_html.replace('href="/vite.svg"', f'href="{favicon_data}"')

    # Replace JS modules with inline scripts
    def _inline_js(match: re.Match[str]) -> str:
        rel_path = match.group(1)
        js_path = DIST_DIR / rel_path
        if not js_path.exists():
            return ""
        js = _inline_asset_urls(_read_text(js_path))
        return f"<script type=\"module\">{js}</script>"

    index_html = re.sub(r"<script[^>]+src=\"/(assets/[^\"']+)\"[^>]*></script>", _inline_js, index_html)

    # Extract body markup from Vite index (div#root and beyond)
    body_match = re.search(r"<body[^>]*>([\s\S]*?)</body>", index_html)
    body_inner = body_match.group(1) if body_match else "<div id=\"root\"></div>"

    head_match = re.search(r"<head[^>]*>([\s\S]*?)</head>", index_html)
    head_inner = head_match.group(1) if head_match else ""

    html = f"""<!DOCTYPE html>
<html lang=\"en\">
  <head>
    {head_inner}
  </head>
  <body>
    {body_inner}
  </body>
</html>
"""
    return html


st.write("")  # force Streamlit to initialize layout before rendering component

if not DIST_DIR.exists():
    st.warning(
        "Frontend build not found. Run `npm install` and `npm run build` inside the `frontend/` directory "
        "before launching the Streamlit app."
    )
else:
    html_bundle = build_frontend_html()
    if not html_bundle:
        st.error("Unable to load frontend bundle from `frontend/dist`. Ensure the build completed successfully.")
    else:
        components.html(html_bundle, height=900, scrolling=True)
