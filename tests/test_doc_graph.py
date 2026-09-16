"""Tests for the semantic concept graph built from a harvested page tree.

The page tree is nested (one directory per URL segment). A non-recursive walk
read only the pages sitting at the site root — 18 of 388 for a real corpus —
so ``query_doc_graph`` reported zero matches for documented topics. These
tests pin the recursive walk and the collision-free node ids that make it
safe.
"""

from __future__ import annotations

from pathlib import Path

from gitbook_downloader.search.graph import build_graph_from_pages


def _write_page(pages_dir: Path, relpath: str, title: str, body: str) -> None:
    page = pages_dir / relpath
    page.parent.mkdir(parents=True, exist_ok=True)
    page.write_text(f"---\ntitle: \"{title}\"\n---\n\n# {title}\n\n{body}", encoding="utf-8")


class TestGraphPageWalk:
    def test_nested_pages_are_included(self, tmp_path: Path):
        pages = tmp_path / "pages"
        _write_page(pages, "index.md", "Index", "Top level page.")
        _write_page(pages, "developers/design/auth.md", "Auth", "## OAuth Model\n\nToken refresh.")

        graph = build_graph_from_pages("docs.example.com", pages)

        labels = {node.label for node in graph.nodes.values()}
        assert "Auth" in labels, "a page nested under a directory must be indexed"
        assert "OAuth Model" in labels

    def test_duplicate_file_stems_do_not_merge_pages(self, tmp_path: Path):
        """Stems repeat across directories (index.md, release.md …). Ids keyed
        on the bare stem merged unrelated pages into one node, so one page's
        content shadowed the other's."""
        pages = tmp_path / "pages"
        _write_page(pages, "guides/index.md", "Guides Index", "Guides body.")
        _write_page(pages, "api/index.md", "API Index", "API body.")

        graph = build_graph_from_pages("docs.example.com", pages)

        page_nodes = [n for n in graph.nodes.values() if n.node_type == "page"]
        assert len(page_nodes) == 2, "two index.md files must stay two nodes"
        assert {n.label for n in page_nodes} == {"Guides Index", "API Index"}

    def test_link_resolves_to_the_nested_target_page_node(self, tmp_path: Path):
        pages = tmp_path / "pages"
        _write_page(pages, "developers/design/auth.md", "Auth", "See [Install](../setup/install.md).")
        _write_page(pages, "developers/setup/install.md", "Install", "Install steps.")

        graph = build_graph_from_pages("docs.example.com", pages)

        links = [edge for edge in graph.edges if edge.relation == "links_to"]
        assert links, "a relative link to a nested page must be captured"
        assert links[0].target_id in graph.nodes, (
            "the link must resolve to a real node, not a dangling id"
        )
        assert graph.nodes[links[0].target_id].label == "Install"

    def test_missing_page_tree_yields_empty_graph(self, tmp_path: Path):
        graph = build_graph_from_pages("docs.example.com", tmp_path / "nope")

        assert graph.nodes == {}
        assert graph.edges == []
