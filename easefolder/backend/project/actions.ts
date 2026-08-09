import {
  createFileNode,
  createFolderNode,
  createNodeInTree,
  deleteNode,
  moveNode,
  normalizeProjectTree,
  renameNode,
  type ProjectNode,
} from "@/lib/project-tree";
import {
  cloneProjectTree,
  ensurePathSegmentIsValid,
  findNodeLocationByPath,
} from "./tree";
import {
  ProjectValidationError,
  resolveRelativePath,
  validateProjectTree,
} from "./validator";
import type { ProjectAction } from "@/backend/ai/schemas";

function getSiblingNodes(
  tree: ProjectNode[],
  parent: ReturnType<typeof findNodeLocationByPath>,
): ProjectNode[] {
  if (parent.isRoot) {
    return tree;
  }

  if (!parent.node) {
    return [];
  }

  if (parent.node.type !== "folder") {
    return [];
  }

  return parent.node.children ?? [];
}

function ensureUniqueSiblingName(
  siblings: ProjectNode[],
  nextName: string,
  currentNodeId?: string,
) {
  const duplicate = siblings.find(
    (node) => node.name === nextName && node.id !== currentNodeId,
  );

  if (duplicate) {
    throw new ProjectValidationError(`Duplicate entry: ${nextName}`);
  }
}

function getNodeOrThrow(tree: ProjectNode[], path: string, allowRoot = false) {
  const location = findNodeLocationByPath(tree, path, { allowRoot });

  if (allowRoot && location.isRoot) {
    return location;
  }

  if (!location.node) {
    throw new ProjectValidationError(`Path not found: ${path}`);
  }

  return location;
}

function applyCreateFile(tree: ProjectNode[], path: string): ProjectNode[] {
  const { segments } = resolveRelativePath(path);
  const fileName = ensurePathSegmentIsValid(segments.at(-1) ?? "");
  const parentPath = segments.slice(0, -1).join("/");
  const parentLocation = parentPath
    ? getNodeOrThrow(tree, parentPath)
    : {
        node: null,
        parent: null,
        siblings: tree,
        index: -1,
        isRoot: true,
        segments: [],
      };

  if (parentLocation.node && parentLocation.node.type !== "folder") {
    throw new ProjectValidationError(`Cannot create inside file path: ${parentPath}`);
  }

  const siblings = getSiblingNodes(tree, parentLocation);
  ensureUniqueSiblingName(siblings, fileName);

  return createNodeInTree(
    tree,
    parentLocation.isRoot ? null : parentLocation.node?.id ?? null,
    createFileNode(fileName),
  );
}

function applyCreateFolder(tree: ProjectNode[], path: string): ProjectNode[] {
  const { segments } = resolveRelativePath(path);
  const folderName = ensurePathSegmentIsValid(segments.at(-1) ?? "");
  const parentPath = segments.slice(0, -1).join("/");
  const parentLocation = parentPath
    ? getNodeOrThrow(tree, parentPath)
    : {
        node: null,
        parent: null,
        siblings: tree,
        index: -1,
        isRoot: true,
        segments: [],
      };

  if (parentLocation.node && parentLocation.node.type !== "folder") {
    throw new ProjectValidationError(`Cannot create inside file path: ${parentPath}`);
  }

  const siblings = getSiblingNodes(tree, parentLocation);
  ensureUniqueSiblingName(siblings, folderName);

  return createNodeInTree(
    tree,
    parentLocation.isRoot ? null : parentLocation.node?.id ?? null,
    createFolderNode(folderName, []),
  );
}

function applyRename(
  tree: ProjectNode[],
  path: string,
  newName: string,
): ProjectNode[] {
  const location = getNodeOrThrow(tree, path);
  const nextName = ensurePathSegmentIsValid(newName);
  const siblings = getSiblingNodes(tree, location);

  ensureUniqueSiblingName(siblings, nextName, location.node?.id);

  return renameNode(tree, location.node.id, nextName);
}

function applyDelete(tree: ProjectNode[], path: string): ProjectNode[] {
  const location = getNodeOrThrow(tree, path);

  if (location.isRoot) {
    throw new ProjectValidationError("Deleting the project root is not allowed.");
  }

  return deleteNode(tree, location.node.id);
}

function applyMove(
  tree: ProjectNode[],
  path: string,
  destination: string,
): ProjectNode[] {
  const sourceLocation = getNodeOrThrow(tree, path);

  if (sourceLocation.isRoot) {
    throw new ProjectValidationError("Moving the project root is not allowed.");
  }

  const destinationLocation = resolveRelativePath(destination, { allowRoot: true }).isRoot
    ? {
        node: null,
        parent: null,
        siblings: tree,
        index: -1,
        isRoot: true,
        segments: [],
      }
    : getNodeOrThrow(tree, destination);

  if (destinationLocation.node && destinationLocation.node.type !== "folder") {
    throw new ProjectValidationError(`Destination must be a folder: ${destination}`);
  }

  const sourceNodeName = sourceLocation.node.name;
  const destinationSiblings = getSiblingNodes(tree, destinationLocation);
  ensureUniqueSiblingName(destinationSiblings, sourceNodeName, sourceLocation.node.id);

  return moveNode(
    tree,
    sourceLocation.node.id,
    destinationLocation.isRoot ? null : destinationLocation.node?.id ?? null,
  );
}

export function executeProjectActions(
  tree: ProjectNode[],
  actions: ProjectAction[],
): ProjectNode[] {
  let workingTree = cloneProjectTree(tree);

  for (const action of actions) {
    if (action.type === "create_file") {
      workingTree = applyCreateFile(workingTree, action.path);
    } else if (action.type === "create_folder") {
      workingTree = applyCreateFolder(workingTree, action.path);
    } else if (action.type === "rename") {
      workingTree = applyRename(workingTree, action.path, action.newName);
    } else if (action.type === "delete") {
      workingTree = applyDelete(workingTree, action.path);
    } else if (action.type === "move") {
      workingTree = applyMove(workingTree, action.path, action.destination);
    } else {
      throw new ProjectValidationError(`Unsupported project action: ${(action as { type: string }).type}`);
    }

    validateProjectTree(workingTree);
  }

  return normalizeProjectTree(workingTree);
}
