import {
  createFileNode,
  createFolderNode,
  createNodeInTree,
  deleteNode,
  findNodeLocation,
  getNodePath,
  moveNode,
  normalizeProjectTree,
  renameNode,
  serializeProjectTree,
  type ProjectNode,
} from "@/lib/project-tree";
import { resolveRelativePath, validateNodeName } from "./validator";

export type { ProjectNode };

export {
  createFileNode,
  createFolderNode,
  createNodeInTree,
  deleteNode,
  findNodeLocation,
  getNodePath,
  moveNode,
  normalizeProjectTree,
  renameNode,
  serializeProjectTree,
};

export function cloneProjectTree(tree: ProjectNode[]): ProjectNode[] {
  return normalizeProjectTree(tree);
}

export function getRootProjectPath(projectName: string): string {
  return projectName.trim();
}

export function findNodeLocationByPath(
  nodes: ProjectNode[],
  path: string,
  options?: { allowRoot?: boolean },
): {
  node: ProjectNode | null;
  parent: ProjectNode | null;
  siblings: ProjectNode[];
  index: number;
  isRoot: boolean;
  segments: string[];
} {
  const resolvedPath = resolveRelativePath(path, options);

  if (resolvedPath.isRoot) {
    return {
      node: null,
      parent: null,
      siblings: nodes,
      index: -1,
      isRoot: true,
      segments: [],
    };
  }

  const search = (
    currentNodes: ProjectNode[],
    segments: string[],
    parent: ProjectNode | null,
  ): {
    node: ProjectNode | null;
    parent: ProjectNode | null;
    siblings: ProjectNode[];
    index: number;
    isRoot: boolean;
    segments: string[];
  } | null => {
    const [currentSegment, ...restSegments] = segments;

    for (let index = 0; index < currentNodes.length; index += 1) {
      const node = currentNodes[index];

      if (node.name !== currentSegment) {
        continue;
      }

      if (restSegments.length === 0) {
        return {
          node,
          parent,
          siblings: currentNodes,
          index,
          isRoot: false,
          segments,
        };
      }

      if (node.type !== "folder") {
        return null;
      }

      const nestedResult = search(node.children ?? [], restSegments, node);

      if (nestedResult) {
        return nestedResult;
      }
    }

    return null;
  };

  const found = search(nodes, resolvedPath.segments, null);

  if (!found) {
    return {
      node: null,
      parent: null,
      siblings: nodes,
      index: -1,
      isRoot: false,
      segments: resolvedPath.segments,
    };
  }

  return found;
}

export function ensurePathSegmentIsValid(pathSegment: string): string {
  return validateNodeName(pathSegment);
}
