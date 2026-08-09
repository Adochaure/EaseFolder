"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  FilePlus,
  FileText,
  Folder,
  FolderPlus,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createFileNode,
  createFolderNode,
  createNodeInTree,
  deleteNode,
  findNodeLocation,
  moveNode,
  renameNode,
  type ProjectNode,
} from "@/lib/project-tree";

const ROOT_NODE_ID = "__easefolder_root__";

type ExplorerActionMenuState = {
  x: number;
  y: number;
  parentId: string | null;
  nodeId: string | null;
  nodeType: "root" | "file" | "folder";
  kind: "context" | "quick-create";
};

type CreateDialogState = {
  mode: "file" | "folder";
  parentId: string | null;
  label: string;
  value: string;
};

type RenameState = {
  nodeId: string;
  value: string;
  originalValue: string;
};

type DeleteState = {
  nodeId: string;
  name: string;
  type: "file" | "folder";
};

type VisibleRow = {
  id: string;
  parentId: string | null;
  name: string;
  type: "root" | "file" | "folder";
  depth: number;
  isExpanded: boolean;
  path: string;
  node: ProjectNode | null;
};

interface ProjectExplorerProps {
  projectName: string;
  tree: ProjectNode[];
  onChange: (nextTree: ProjectNode[]) => void;
  className?: string;
}

function flattenVisibleRows(
  nodes: ProjectNode[],
  projectName: string,
  rootExpanded: boolean,
  expandedFolderIds: Set<string>,
): VisibleRow[] {
  const rows: VisibleRow[] = [
    {
      id: ROOT_NODE_ID,
      parentId: null,
      name: projectName,
      type: "root",
      depth: 0,
      isExpanded: rootExpanded,
      path: projectName,
      node: null,
    },
  ];

  if (!rootExpanded) {
    return rows;
  }

  const appendRows = (
    currentNodes: ProjectNode[],
    parentId: string | null,
    depth: number,
    parentPath: string,
  ) => {
    currentNodes.forEach((node) => {
      const nextPath = `${parentPath}/${node.name}`;
      const isExpanded = node.type === "folder" && expandedFolderIds.has(node.id);

      rows.push({
        id: node.id,
        parentId,
        name: node.name,
        type: node.type,
        depth,
        isExpanded,
        path: nextPath,
        node,
      });

      if (node.type === "folder" && node.children?.length && isExpanded) {
        appendRows(node.children, node.id, depth + 1, nextPath);
      }
    });
  };

  appendRows(nodes, null, 1, projectName);

  return rows;
}

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const tempInput = document.createElement("textarea");
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand("copy");
  document.body.removeChild(tempInput);
}

export function ProjectExplorer({
  projectName,
  tree,
  onChange,
  className,
}: ProjectExplorerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedId, setSelectedId] = useState<string>(ROOT_NODE_ID);
  const [rootExpanded, setRootExpanded] = useState(true);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [contextMenu, setContextMenu] = useState<ExplorerActionMenuState | null>(
    null,
  );
  const [createDialog, setCreateDialog] = useState<CreateDialogState | null>(null);
  const [renameState, setRenameState] = useState<RenameState | null>(null);
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const visibleRows = useMemo(
    () =>
      flattenVisibleRows(tree, projectName, rootExpanded, expandedFolderIds),
    [expandedFolderIds, projectName, rootExpanded, tree],
  );

  const selectedRow = useMemo(
    () => visibleRows.find((row) => row.id === selectedId) ?? visibleRows[0],
    [selectedId, visibleRows],
  );

  const selectedLocation =
    selectedId === ROOT_NODE_ID ? null : findNodeLocation(tree, selectedId);

  const selectedNode = selectedLocation?.node ?? null;

  const selectedContainerId = useMemo(() => {
    if (selectedId === ROOT_NODE_ID) {
      return null;
    }

    if (selectedNode && selectedNode.type === "folder") {
      return selectedNode.id;
    }

    return selectedLocation?.parentId ?? null;
  }, [selectedId, selectedLocation?.parentId, selectedNode]);

  useEffect(() => {
    if (!visibleRows.some((row) => row.id === selectedId)) {
      setSelectedId(ROOT_NODE_ID);
    }
  }, [selectedId, visibleRows]);

  const closeTransientUi = () => {
    setContextMenu(null);
    setCreateDialog(null);
    setDeleteState(null);
  };

  const updateTree = (nextTree: ProjectNode[]) => {
    onChange(nextTree);
  };

  const focusExplorer = () => {
    containerRef.current?.focus();
  };

  const selectNode = (nodeId: string) => {
    setSelectedId(nodeId);
    focusExplorer();
  };

  const toggleRoot = () => {
    setRootExpanded((current) => !current);
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolderIds((current) => {
      const next = new Set(current);

      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }

      return next;
    });
  };

  const openRename = (nodeId: string) => {
    const location = nodeId === ROOT_NODE_ID ? null : findNodeLocation(tree, nodeId);

    if (!location) {
      return;
    }

    if (location.node.type === "folder" || location.node.type === "file") {
      setRenameState({
        nodeId,
        value: location.node.name,
        originalValue: location.node.name,
      });
      setContextMenu(null);
      setCreateDialog(null);
      focusExplorer();
    }
  };

  const openCreateDialog = (
    mode: "file" | "folder",
    parentId: string | null,
  ) => {
    setCreateDialog({
      mode,
      parentId,
      label: mode === "file" ? "New File" : "New Folder",
      value: "",
    });
    setContextMenu(null);
    focusExplorer();
  };

  const createNode = () => {
    if (!createDialog) {
      return;
    }

    const trimmedName = createDialog.value.trim();

    if (!trimmedName || /[\\/]/.test(trimmedName)) {
      return;
    }

    const nextNode =
      createDialog.mode === "file"
        ? createFileNode(trimmedName)
        : createFolderNode(trimmedName, []);

    const nextTree = createNodeInTree(tree, createDialog.parentId, nextNode);

    updateTree(nextTree);

    if (createDialog.mode === "folder") {
      setExpandedFolderIds((current) => {
        const next = new Set(current);

        if (createDialog.parentId) {
          next.add(createDialog.parentId);
        } else {
          setRootExpanded(true);
        }

        next.add(nextNode.id);
        return next;
      });
    } else if (createDialog.parentId) {
      setExpandedFolderIds((current) => {
        const next = new Set(current);
        next.add(createDialog.parentId as string);
        return next;
      });
    } else {
      setRootExpanded(true);
    }

    setSelectedId(nextNode.id);
    setCreateDialog(null);
  };

  const confirmDelete = () => {
    if (!deleteState || deleteState.nodeId === ROOT_NODE_ID) {
      setDeleteState(null);
      return;
    }

    const nextTree = deleteNode(tree, deleteState.nodeId);
    updateTree(nextTree);
    setDeleteState(null);
    setSelectedId(ROOT_NODE_ID);
  };

  const commitRename = () => {
    if (!renameState) {
      return;
    }

    const nextValue = renameState.value.trim();

    if (!nextValue || /[\\/]/.test(nextValue)) {
      setRenameState(null);
      return;
    }

    if (renameState.nodeId === ROOT_NODE_ID) {
      setRenameState(null);
      return;
    }

    const nextTree = renameNode(tree, renameState.nodeId, nextValue);
    updateTree(nextTree);
    setRenameState(null);
  };

  const cancelRename = () => {
    setRenameState(null);
  };

  const openNodeContextMenu = (
    event: React.MouseEvent,
    row: VisibleRow,
  ) => {
    event.preventDefault();
    selectNode(row.id);

    const parentId =
      row.type === "root"
        ? null
        : row.type === "folder"
          ? row.id
          : row.parentId;

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      parentId,
      nodeId: row.id,
      nodeType: row.type,
      kind: "context",
    });
  };

  const copySelectedPath = async (row: VisibleRow) => {
    const path = row.path;

    try {
      await copyToClipboard(path);
    } catch {
      window.alert(`Copy this path: ${path}`);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (renameState) {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelRename();
      }

      if (event.key === "Enter") {
        event.preventDefault();
        commitRename();
      }

      return;
    }

    if (contextMenu || createDialog || deleteState) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeTransientUi();
      }

      return;
    }

    const currentIndex = visibleRows.findIndex((row) => row.id === selectedId);

    if (event.key === "Escape") {
      event.preventDefault();
      closeTransientUi();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextRow = visibleRows[Math.min(currentIndex + 1, visibleRows.length - 1)];
      if (nextRow) {
        setSelectedId(nextRow.id);
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const previousRow = visibleRows[Math.max(currentIndex - 1, 0)];
      if (previousRow) {
        setSelectedId(previousRow.id);
      }
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      const currentRow = visibleRows[currentIndex];

      if (currentRow?.type === "root") {
        if (!rootExpanded) {
          setRootExpanded(true);
          return;
        }

        const firstChild = visibleRows.find((row) => row.depth === 1);
        if (firstChild) {
          setSelectedId(firstChild.id);
        }
        return;
      }

      if (currentRow?.type === "folder") {
        if (!currentRow.isExpanded) {
          toggleFolder(currentRow.id);
          return;
        }

        const firstChildIndex = visibleRows.findIndex(
          (row) => row.parentId === currentRow.id,
        );

        if (firstChildIndex >= 0) {
          setSelectedId(visibleRows[firstChildIndex].id);
        }
      }
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      const currentRow = visibleRows[currentIndex];

      if (currentRow?.type === "folder" && currentRow.isExpanded) {
        toggleFolder(currentRow.id);
        return;
      }

      if (currentRow?.type !== "root" && currentRow?.parentId) {
        setSelectedId(currentRow.parentId);
        return;
      }

      if (currentRow?.type === "root" && rootExpanded) {
        setRootExpanded(false);
      }
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const currentRow = visibleRows[currentIndex];

      if (!currentRow) {
        return;
      }

      if (currentRow.type === "root") {
        toggleRoot();
        return;
      }

      if (currentRow.type === "folder") {
        toggleFolder(currentRow.id);
      }
      return;
    }

    if (event.key === "F2") {
      event.preventDefault();
      if (selectedId !== ROOT_NODE_ID) {
        openRename(selectedId);
      }
      return;
    }

    if (event.key === "Delete") {
      event.preventDefault();
      if (selectedId !== ROOT_NODE_ID) {
        const selectedRowToDelete = visibleRows.find((row) => row.id === selectedId);

        if (selectedRowToDelete) {
          setDeleteState({
            nodeId: selectedRowToDelete.id,
            name: selectedRowToDelete.name,
            type: selectedRowToDelete.type === "folder" ? "folder" : "file",
          });
        }
      }
    }
  };

  const beginDrag = (event: React.DragEvent, row: VisibleRow) => {
    if (row.id === ROOT_NODE_ID) {
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", row.id);
    setDraggedNodeId(row.id);
  };

  const handleDropTarget = (
    event: React.DragEvent,
    targetRow: VisibleRow,
  ) => {
    event.preventDefault();

    if (!draggedNodeId) {
      return;
    }

    const targetParentId =
      targetRow.type === "root"
        ? null
        : targetRow.type === "folder"
          ? targetRow.id
          : targetRow.parentId;

    if (targetRow.type === "file") {
      return;
    }

    const nextTree = moveNode(tree, draggedNodeId, targetParentId);
    updateTree(nextTree);

    if (targetRow.type === "folder") {
      setExpandedFolderIds((current) => {
        const next = new Set(current);
        next.add(targetRow.id);
        return next;
      });
    } else {
      setRootExpanded(true);
    }

    setDraggedNodeId(null);
    setDropTargetId(null);
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onBlur={() => setDropTargetId(null)}
      className={cn(
        "flex h-full min-h-0 flex-col rounded-[1.5rem] border border-white/8 bg-white/4 p-4 text-white outline-none transition duration-200",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/45">
            Files
          </p>
        </div>

        <button
          type="button"
          onClick={(event) => {
            const buttonRect = event.currentTarget.getBoundingClientRect();
            setContextMenu(null);
            setCreateDialog(null);
            setDeleteState(null);
            setRenameState(null);
            setDropTargetId(null);
            setDraggedNodeId(null);
            setContextMenu({
              x: buttonRect.left,
              y: buttonRect.bottom + 8,
              parentId: selectedContainerId,
              nodeId: selectedId,
              nodeType:
                selectedId === ROOT_NODE_ID
                  ? "root"
                  : selectedNode?.type === "folder"
                    ? "folder"
                    : "file",
              kind: "quick-create",
            });
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
          aria-label="Create new item"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="scrollbar-none flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {visibleRows.map((row) => {
          const isSelected = row.id === selectedId;
          const isRoot = row.type === "root";
          const isFolder = row.type === "folder" || row.type === "root";
          const isDraggingOver = dropTargetId === row.id;
          const shouldRename = renameState?.nodeId === row.id;

          return (
            <div
              key={row.id}
              draggable={!isRoot}
              onDragStart={(event) => beginDrag(event, row)}
              onDragEnd={() => {
                setDraggedNodeId(null);
                setDropTargetId(null);
              }}
              onDragOver={(event) => {
                if (!isFolder) {
                  return;
                }

                event.preventDefault();
                setDropTargetId(row.id);
              }}
              onDragLeave={() => {
                setDropTargetId((current) => (current === row.id ? null : current));
              }}
              onDrop={(event) => handleDropTarget(event, row)}
              onContextMenu={(event) => openNodeContextMenu(event, row)}
              className={cn(
                "rounded-2xl border px-3 py-2 transition duration-200",
                isSelected
                  ? "border-white/15 bg-white/12"
                  : "border-transparent bg-black/10 hover:border-white/10 hover:bg-white/6",
                isDraggingOver && "border-white/20 bg-white/10",
              )}
            >
              <div
                role="button"
                tabIndex={-1}
                onClick={() => selectNode(row.id)}
                className="flex w-full items-center gap-2 text-left"
              >
                <span
                  className="flex shrink-0 items-center"
                  style={{ marginLeft: row.depth * 12 }}
                >
                  {row.type === "folder" || row.type === "root" ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (row.type === "root") {
                          toggleRoot();
                        } else {
                          toggleFolder(row.id);
                        }
                      }}
                      className="mr-1 flex h-5 w-5 items-center justify-center rounded text-white/50 transition hover:text-white"
                      aria-label={
                        row.isExpanded ? "Collapse folder" : "Expand folder"
                      }
                    >
                      {row.isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  ) : (
                    <span className="mr-1 h-5 w-5" />
                  )}

                  {row.type === "root" || row.type === "folder" ? (
                    <Folder className="h-4 w-4 shrink-0 text-white/70" />
                  ) : (
                    <FileText className="h-4 w-4 shrink-0 text-white/70" />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  {shouldRename && renameState ? (
                    <input
                      autoFocus
                      value={renameState.value}
                      onChange={(event) =>
                        setRenameState({
                          ...renameState,
                          value: event.target.value,
                        })
                      }
                      onBlur={() => commitRename()}
                      onKeyDown={(event) => {
                        event.stopPropagation();

                        if (event.key === "Escape") {
                          event.preventDefault();
                          cancelRename();
                        }

                        if (event.key === "Enter") {
                          event.preventDefault();
                          commitRename();
                        }
                      }}
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-sm text-white outline-none"
                    />
                  ) : (
                    <span className="block truncate text-sm leading-6">
                      {row.name}
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {contextMenu ? (
        <div className="fixed inset-0 z-50" onMouseDown={() => setContextMenu(null)}>
          <div
            className="fixed z-50 w-56 rounded-2xl border border-white/10 bg-[#121212] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 240),
              top: Math.min(contextMenu.y, window.innerHeight - 280),
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {contextMenu.kind === "quick-create" ? (
              <>
                <MenuItem
                  icon={FilePlus}
                  label="New File"
                  onClick={() => openCreateDialog("file", contextMenu.parentId)}
                />
                <MenuItem
                  icon={FolderPlus}
                  label="New Folder"
                  onClick={() => openCreateDialog("folder", contextMenu.parentId)}
                />
              </>
            ) : contextMenu.nodeType === "root" ? (
              <>
                <MenuItem
                  icon={FilePlus}
                  label="New File"
                  onClick={() => openCreateDialog("file", contextMenu.parentId)}
                />
                <MenuItem
                  icon={FolderPlus}
                  label="New Folder"
                  onClick={() => openCreateDialog("folder", contextMenu.parentId)}
                />
                <MenuDivider />
                <MenuItem
                  icon={Copy}
                  label="Copy Path"
                  onClick={() => copySelectedPath(selectedRow)}
                />
              </>
            ) : contextMenu.nodeType === "folder" ? (
              <>
                <MenuItem
                  icon={FilePlus}
                  label="New File"
                  onClick={() => openCreateDialog("file", contextMenu.parentId)}
                />
                <MenuItem
                  icon={FolderPlus}
                  label="New Folder"
                  onClick={() => openCreateDialog("folder", contextMenu.parentId)}
                />
                <MenuDivider />
                <MenuItem
                  icon={Pencil}
                  label="Rename"
                  onClick={() => openRename(contextMenu.nodeId ?? ROOT_NODE_ID)}
                />
                <MenuItem
                  icon={Trash2}
                  label="Delete"
                  onClick={() => {
                    if (contextMenu.nodeId && contextMenu.nodeId !== ROOT_NODE_ID) {
                      const row = visibleRows.find((item) => item.id === contextMenu.nodeId);

                      if (row) {
                        setDeleteState({
                          nodeId: row.id,
                          name: row.name,
                          type: row.type === "folder" ? "folder" : "file",
                        });
                      }
                    }
                  }}
                />
                <MenuDivider />
                <MenuItem
                  icon={Copy}
                  label="Copy Path"
                  onClick={() => {
                    const row = visibleRows.find((item) => item.id === contextMenu.nodeId);

                    if (row) {
                      copySelectedPath(row);
                    }
                  }}
                />
              </>
            ) : (
              <>
                <MenuItem
                  icon={Pencil}
                  label="Rename"
                  onClick={() => openRename(contextMenu.nodeId ?? ROOT_NODE_ID)}
                />
                <MenuItem
                  icon={Trash2}
                  label="Delete"
                  onClick={() => {
                    if (contextMenu.nodeId && contextMenu.nodeId !== ROOT_NODE_ID) {
                      const row = visibleRows.find((item) => item.id === contextMenu.nodeId);

                      if (row) {
                        setDeleteState({
                          nodeId: row.id,
                          name: row.name,
                          type: row.type === "folder" ? "folder" : "file",
                        });
                      }
                    }
                  }}
                />
                <MenuDivider />
                <MenuItem
                  icon={Copy}
                  label="Copy Path"
                  onClick={() => {
                    const row = visibleRows.find((item) => item.id === contextMenu.nodeId);

                    if (row) {
                      copySelectedPath(row);
                    }
                  }}
                />
              </>
            )}
          </div>
        </div>
      ) : null}

      {createDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4" onMouseDown={() => setCreateDialog(null)}>
          <div
            className="w-full max-w-sm rounded-[1.5rem] border border-white/10 bg-[#121212] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">{createDialog.label}</p>
            <input
              autoFocus
              value={createDialog.value}
              onChange={(event) =>
                setCreateDialog({ ...createDialog, value: event.target.value })
              }
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  setCreateDialog(null);
                }

                if (event.key === "Enter") {
                  event.preventDefault();
                  createNode();
                }
              }}
              placeholder={createDialog.mode === "file" ? "file.tsx" : "components"}
              className="mt-4 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateDialog(null)}
                className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/75 transition hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createNode}
                className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-[#1f2023] transition hover:bg-white/90"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4" onMouseDown={() => setDeleteState(null)}>
          <div
            className="w-full max-w-sm rounded-[1.5rem] border border-white/10 bg-[#121212] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h4 className="text-base font-semibold text-white">Delete "{deleteState.name}"?</h4>
            <p className="mt-3 text-sm leading-6 text-white/65">
              {deleteState.type === "folder"
                ? "This will remove the folder and everything inside it."
                : "This will remove the file from the project."
              }
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteState(null)}
                className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/75 transition hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-[#ef4444] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#dc2626]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuDivider() {
  return <div className="my-2 h-px bg-white/10" />;
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/8 hover:text-white"
    >
      <Icon className="h-4 w-4 text-white/60" />
      <span>{label}</span>
    </button>
  );
}
