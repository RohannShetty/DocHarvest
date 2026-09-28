"""Semantic documentation concept graph for non-linear agent navigation.

Extracts nodes (pages, sections, headings, code symbols, endpoints) and edges
(contains, links_to, references) from harvested documentation, enabling AI agents
to discover conceptual relationships with minimal token overhead.
"""

from __future__ import annotations

import posixpath
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Set


@dataclass
class GraphNode:
    id: str
    label: str
    node_type: str  # "page", "heading", "code_symbol", "endpoint", "concept"
    file_path: Optional[str] = None
    snippet: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class GraphEdge:
    source_id: str
    target_id: str
    relation: str  # "contains", "links_to", "references", "prerequisite_of"
    weight: float = 1.0


class DocGraph:
    """In-memory semantic graph built from harvested documentation corpora."""

    def __init__(self, domain: str):
        self.domain = domain
        self.nodes: Dict[str, GraphNode] = {}
        self.edges: List[GraphEdge] = []
        self._adjacency: Dict[str, List[GraphEdge]] = {}

    def add_node(self, node: GraphNode) -> None:
        if node.id not in self.nodes:
            self.nodes[node.id] = node
            self._adjacency[node.id] = []

    def add_edge(self, edge: GraphEdge) -> None:
        self.edges.append(edge)
        if edge.source_id not in self._adjacency:
            self._adjacency[edge.source_id] = []
        self._adjacency[edge.source_id].append(edge)

    def get_neighbors(self, node_id: str, depth: int = 1) -> List[Dict[str, Any]]:
        """Retrieve neighboring nodes up to specified hop depth."""
        visited: Set[str] = {node_id}
        current_layer = [node_id]
        results = []

        for current_hop in range(1, depth + 1):
            next_layer = []
            for current_node_id in current_layer:
                edges = self._adjacency.get(current_node_id, [])
                for edge in edges:
                    target_id = edge.target_id
                    if target_id not in visited and target_id in self.nodes:
                        visited.add(target_id)
                        next_layer.append(target_id)
                        target_node = self.nodes[target_id]
                        results.append({
                            "id": target_node.id,
                            "label": target_node.label,
                            "type": target_node.node_type,
                            "relation": edge.relation,
                            "hop": current_hop,
                            "file": target_node.file_path,
                            "snippet": target_node.snippet,
                        })
            current_layer = next_layer
        return results

    def query(self, query_text: str, limit: int = 10) -> Dict[str, Any]:
        """Search nodes matching query and return local subgraph context."""
        terms = [t.lower() for t in query_text.strip().split() if len(t) > 2]
        if not terms:
            terms = [query_text.lower().strip()]

        matched_nodes = []
        for node in self.nodes.values():
            score = 0
            label_lower = node.label.lower()
            snippet_lower = (node.snippet or "").lower()

            for term in terms:
                if term in label_lower:
                    score += 5
                if term in snippet_lower:
                    score += 1

            if score > 0:
                matched_nodes.append((score, node))

        matched_nodes.sort(key=lambda x: x[0], reverse=True)
        top_matches = matched_nodes[:limit]

        graph_results = []
        for score, node in top_matches:
            neighbors = self.get_neighbors(node.id, depth=1)
            graph_results.append({
                "id": node.id,
                "label": node.label,
                "type": node.node_type,
                "score": score,
                "file": node.file_path,
                "snippet": node.snippet,
                "connected_entities": neighbors[:5],
            })

        return {
            "domain": self.domain,
            "query": query_text,
            "matches_count": len(graph_results),
            "results": graph_results,
        }

    def get_related_concepts(self, concept: str) -> Dict[str, Any]:
        """Find concepts related to given keyword and return summary subgraph."""
        query_res = self.query(concept, limit=5)
        related_entities = []
        for match in query_res.get("results", []):
            for conn in match.get("connected_entities", []):
                related_entities.append(conn)

        return {
            "domain": self.domain,
            "concept": concept,
            "primary_matches": query_res.get("results", []),
            "related_graph_nodes": related_entities,
        }


def build_graph_from_pages(domain: str, pages_dir: Path) -> DocGraph:
    """Construct a DocGraph by parsing markdown files in a harvested pages directory."""
    graph = DocGraph(domain)
    if not pages_dir.exists() or not pages_dir.is_dir():
        return graph

    # The page tree is nested (one directory per URL segment), so the walk MUST
    # be recursive: a top-level glob sees only the pages that sit at the site
    # root (18 of 388 for docs.openalgo.in), which made query_doc_graph report
    # zero matches for topics that the corpus covers many times over.
    md_files = sorted(pages_dir.rglob("*.md"))

    # Node ids are directory-relative paths, not bare file stems: stems repeat
    # across directories (index.md, release.md, shared.md …) and colliding ids
    # silently merge otherwise unrelated pages into a single node. These maps
    # also let markdown links resolve to those ids without a second file read.
    rel_by_path = {f: f.relative_to(pages_dir).with_suffix("").as_posix() for f in md_files}
    id_by_rel = {rel: f"page::{rel}" for rel in rel_by_path.values()}
    id_by_stem: Dict[str, str] = {}
    for rel, page_id in id_by_rel.items():
        id_by_stem.setdefault(Path(rel).stem, page_id)

    for md_file in md_files:
        try:
            content = md_file.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue

        rel = rel_by_path[md_file]
        page_id = id_by_rel[rel]
        page_title = md_file.stem.replace("_", " ").title()

        # Extract title from frontmatter or first heading if present
        title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
        if title_match:
            page_title = title_match.group(1).strip()

        graph.add_node(GraphNode(
            id=page_id,
            label=page_title,
            node_type="page",
            file_path=f"{rel}.md",
            snippet=content[:300].strip(),
        ))

        # Extract headings (level 2 and 3)
        heading_matches = re.finditer(r"^(#{2,3})\s+(.+)$", content, re.MULTILINE)
        for h_match in heading_matches:
            h_text = h_match.group(2).strip()
            h_id = f"heading::{rel}::{h_text.lower().replace(' ', '-')}"
            graph.add_node(GraphNode(
                id=h_id,
                label=h_text,
                node_type="heading",
                file_path=f"{rel}.md",
            ))
            graph.add_edge(GraphEdge(
                source_id=page_id,
                target_id=h_id,
                relation="contains",
            ))

        # Extract API endpoints (e.g. GET /api/v1/..., POST /auth/...)
        endpoint_matches = re.finditer(r"\b(GET|POST|PUT|DELETE|PATCH)\s+([/\w\-_{}]+)", content)
        for ep_match in endpoint_matches:
            method, ep_path = ep_match.group(1), ep_match.group(2)
            ep_label = f"{method} {ep_path}"
            ep_id = f"endpoint::{ep_label.replace(' ', '_')}"
            graph.add_node(GraphNode(
                id=ep_id,
                label=ep_label,
                node_type="endpoint",
                file_path=f"{rel}.md",
            ))
            graph.add_edge(GraphEdge(
                source_id=page_id,
                target_id=ep_id,
                relation="contains",
            ))

        # Extract markdown internal links [text](other.md)
        link_matches = re.finditer(r"\[([^\]]+)\]\(([^)]+\.md)\)", content)
        for link_match in link_matches:
            link_target = link_match.group(2)
            if "://" in link_target:
                continue
            # Resolve relative to the linking page's own directory, then fall
            # back to a stem match for site-root-relative links.
            joined = posixpath.join(posixpath.dirname(rel), link_target)
            key = posixpath.normpath(joined)
            if key.endswith(".md"):
                key = key[:-3]
            target_page_id = id_by_rel.get(key) or id_by_stem.get(Path(link_target).stem)
            if target_page_id is None:
                continue
            graph.add_edge(GraphEdge(
                source_id=page_id,
                target_id=target_page_id,
                relation="links_to",
            ))

    return graph
