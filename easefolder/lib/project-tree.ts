export type ProjectNodeType = "file" | "folder";

export type ProjectNode = {
  id: string;
  name: string;
  type: ProjectNodeType;
  children?: ProjectNode[];
};

export type ProjectNodeInput = {
  id?: string;
  name: string;
  type: ProjectNodeType;
  children?: ProjectNodeInput[];
};

function createNodeId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `node-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

export function createFileNode(name: string): ProjectNode {
  return {
    id: createNodeId(),
    name,
    type: "file",
  };
}

export function createFolderNode(
  name: string,
  children: ProjectNode[] = [],
): ProjectNode {
  return {
    id: createNodeId(),
    name,
    type: "folder",
    children,
  };
}

function normalizeProjectNode(node: ProjectNodeInput): ProjectNode {
  const normalizedType = node.type === "folder" ? "folder" : "file";

  return {
    id: node.id?.trim() || createNodeId(),
    name: node.name.trim(),
    type: normalizedType,
    children:
      normalizedType === "folder"
        ? (node.children ?? []).map((child) => normalizeProjectNode(child))
        : undefined,
  };
}

export function normalizeProjectTree(
  nodes: ProjectNodeInput[],
): ProjectNode[] {
  return nodes.map((node) => normalizeProjectNode(node));
}

type NodeLocation = {
  node: ProjectNode;
  siblings: ProjectNode[];
  index: number;
  parentId: string | null;
};

export function findNodeLocation(
  nodes: ProjectNode[],
  nodeId: string,
  parentId: string | null = null,
): NodeLocation | null {
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];

    if (node.id === nodeId) {
      return {
        node,
        siblings: nodes,
        index,
        parentId,
      };
    }

    if (node.type === "folder" && node.children) {
      const location = findNodeLocation(node.children, nodeId, node.id);

      if (location) {
        return location;
      }
    }
  }

  return null;
}

function updateNodeTree(
  nodes: ProjectNode[],
  nodeId: string,
  updater: (node: ProjectNode) => ProjectNode,
): ProjectNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return updater(node);
    }

    if (node.type === "folder" && node.children) {
      return {
        ...node,
        children: updateNodeTree(node.children, nodeId, updater),
      };
    }

    return node;
  });
}

function removeNodeFromTree(
  nodes: ProjectNode[],
  nodeId: string,
): { nodes: ProjectNode[]; removedNode: ProjectNode | null } {
  let removedNode: ProjectNode | null = null;

  const nextNodes = nodes.flatMap((node) => {
    if (node.id === nodeId) {
      removedNode = node;
      return [];
    }

    if (node.type === "folder" && node.children) {
      const childResult = removeNodeFromTree(node.children, nodeId);

      if (childResult.removedNode) {
        removedNode = childResult.removedNode;

        return [
          {
            ...node,
            children: childResult.nodes,
          },
        ];
      }
    }

    return [node];
  });

  return {
    nodes: nextNodes,
    removedNode,
  };
}

function insertNodeIntoTree(
  nodes: ProjectNode[],
  parentId: string | null,
  nodeToInsert: ProjectNode,
): ProjectNode[] {
  if (parentId === null) {
    return [...nodes, nodeToInsert];
  }

  return nodes.map((node) => {
    if (node.id === parentId && node.type === "folder") {
      return {
        ...node,
        children: [...(node.children ?? []), nodeToInsert],
      };
    }

    if (node.type === "folder" && node.children) {
      return {
        ...node,
        children: insertNodeIntoTree(node.children, parentId, nodeToInsert),
      };
    }

    return node;
  });
}

function nodeContainsId(node: ProjectNode, nodeId: string): boolean {
  if (node.id === nodeId) {
    return true;
  }

  if (node.type !== "folder" || !node.children) {
    return false;
  }

  return node.children.some((child) => nodeContainsId(child, nodeId));
}

export function renameNode(
  nodes: ProjectNode[],
  nodeId: string,
  nextName: string,
): ProjectNode[] {
  const trimmedName = nextName.trim();

  if (!trimmedName) {
    return nodes;
  }

  return updateNodeTree(nodes, nodeId, (node) => ({
    ...node,
    name: trimmedName,
  }));
}

export function deleteNode(
  nodes: ProjectNode[],
  nodeId: string,
): ProjectNode[] {
  return removeNodeFromTree(nodes, nodeId).nodes;
}

export function createNodeInTree(
  nodes: ProjectNode[],
  parentId: string | null,
  nodeToInsert: ProjectNode,
): ProjectNode[] {
  return insertNodeIntoTree(nodes, parentId, nodeToInsert);
}

export function moveNode(
  nodes: ProjectNode[],
  sourceNodeId: string,
  targetParentId: string | null,
): ProjectNode[] {
  if (sourceNodeId === targetParentId) {
    return nodes;
  }

  const removalResult = removeNodeFromTree(nodes, sourceNodeId);

  if (!removalResult.removedNode) {
    return nodes;
  }

  if (
    targetParentId !== null &&
    nodeContainsId(removalResult.removedNode, targetParentId)
  ) {
    return nodes;
  }

  return insertNodeIntoTree(
    removalResult.nodes,
    targetParentId,
    removalResult.removedNode,
  );
}

function buildPathSegments(
  nodes: ProjectNode[],
  nodeId: string,
  currentSegments: string[] = [],
): string[] | null {
  for (const node of nodes) {
    const nextSegments = [...currentSegments, node.name];

    if (node.id === nodeId) {
      return nextSegments;
    }

    if (node.type === "folder" && node.children) {
      const nestedSegments = buildPathSegments(node.children, nodeId, nextSegments);

      if (nestedSegments) {
        return nestedSegments;
      }
    }
  }

  return null;
}

export function getNodePath(
  nodes: ProjectNode[],
  nodeId: string,
  projectName: string,
): string | null {
  const pathSegments = buildPathSegments(nodes, nodeId);

  if (!pathSegments) {
    return null;
  }

  return `${projectName}/${pathSegments.join("/")}`;
}

function serializeNodes(nodes: ProjectNode[], depth = 0): string[] {
  const lines: string[] = [];

  nodes.forEach((node) => {
    const prefix = `${"  ".repeat(depth)}${node.type === "folder" ? "📁" : "📄"}`;
    lines.push(`${prefix} ${node.name}`);

    if (node.type === "folder" && node.children?.length) {
      lines.push(...serializeNodes(node.children, depth + 1));
    }
  });

  return lines;
}

export function serializeProjectTree(
  nodes: ProjectNode[],
  projectName: string,
): string {
  return [`📁 ${projectName}`, ...serializeNodes(nodes, 1)].join("\n");
}

export function isFolderNode(node: ProjectNode | null | undefined): node is ProjectNode {
  return Boolean(node && node.type === "folder");
}
