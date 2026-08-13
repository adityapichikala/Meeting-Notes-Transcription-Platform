"use client";

import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getMeetingActionItems,
  createActionItem,
  updateActionItem,
  deleteActionItem,
} from "@/lib/api/client";
import { ActionItem } from "@/types";

interface ActionItemsTabProps {
  meetingId: string;
}

export const ActionItemsTab: React.FC<ActionItemsTabProps> = ({ meetingId }) => {
  const queryClient = useQueryClient();
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const queryKey = ["action_items", meetingId];

  const { data: items = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => getMeetingActionItems(meetingId),
  });

  // Optimistic toggle
  const { mutate: doToggle } = useMutation({
    mutationFn: (item: ActionItem) =>
      updateActionItem(item.id, {
        is_completed: !item.is_completed,
        version: item.version,
      }),
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ActionItem[]>(queryKey);
      queryClient.setQueryData<ActionItem[]>(queryKey, (old = []) =>
        old.map((a) =>
          a.id === item.id ? { ...a, is_completed: !a.is_completed } : a
        )
      );
      return { previous };
    },
    onError: (_err, _item, ctx) => {
      queryClient.setQueryData(queryKey, ctx?.previous);
      toast.error("Failed to update item");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  // Create
  const { mutate: doCreate, isPending: isCreating } = useMutation({
    mutationFn: () => createActionItem(meetingId, { text: newText.trim() }),
    onSuccess: () => {
      setNewText("");
      queryClient.invalidateQueries({ queryKey });
      toast.success("Action item added");
    },
    onError: (err: Error) => toast.error("Failed to add item", { description: err.message }),
  });

  // Inline edit save
  const { mutate: doEdit } = useMutation({
    mutationFn: (item: ActionItem) =>
      updateActionItem(item.id, { text: editText.trim(), version: item.version }),
    onSuccess: () => {
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => toast.error("Failed to update item", { description: err.message }),
  });

  // Delete
  const { mutate: doDelete } = useMutation({
    mutationFn: (id: string) => deleteActionItem(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ActionItem[]>(queryKey);
      queryClient.setQueryData<ActionItem[]>(queryKey, (old = []) =>
        old.filter((a) => a.id !== id)
      );
      return { previous };
    },
    onSuccess: () => {
      setDeleteConfirmId(null);
      toast.success("Action item deleted");
    },
    onError: (_err, _id, ctx) => {
      queryClient.setQueryData(queryKey, ctx?.previous);
      toast.error("Failed to delete item");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const startEdit = (item: ActionItem) => {
    setEditingId(item.id);
    setEditText(item.text);
  };

  const pending = items.filter((i) => !i.is_completed);
  const done = items.filter((i) => i.is_completed);

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-slate-800/60 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add new */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (newText.trim()) doCreate();
        }}
        className="flex gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Add action item…"
          className="flex-1 bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!newText.trim() || isCreating}
          className="px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
      </form>

      {/* Pending */}
      {pending.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-label uppercase tracking-wider text-slate-500 px-1">
            Pending · {pending.length}
          </p>
          {pending.map((item) => (
            <ActionRow
              key={item.id}
              item={item}
              isEditing={editingId === item.id}
              editText={editText}
              deleteConfirm={deleteConfirmId === item.id}
              onToggle={() => doToggle(item)}
              onStartEdit={() => startEdit(item)}
              onEditChange={setEditText}
              onEditSave={() => doEdit(item)}
              onEditCancel={() => setEditingId(null)}
              onDeleteRequest={() => setDeleteConfirmId(item.id)}
              onDeleteConfirm={() => doDelete(item.id)}
              onDeleteCancel={() => setDeleteConfirmId(null)}
            />
          ))}
        </div>
      )}

      {/* Completed */}
      {done.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-label uppercase tracking-wider text-slate-500 px-1">
            Completed · {done.length}
          </p>
          {done.map((item) => (
            <ActionRow
              key={item.id}
              item={item}
              isEditing={editingId === item.id}
              editText={editText}
              deleteConfirm={deleteConfirmId === item.id}
              onToggle={() => doToggle(item)}
              onStartEdit={() => startEdit(item)}
              onEditChange={setEditText}
              onEditSave={() => doEdit(item)}
              onEditCancel={() => setEditingId(null)}
              onDeleteRequest={() => setDeleteConfirmId(item.id)}
              onDeleteConfirm={() => doDelete(item.id)}
              onDeleteCancel={() => setDeleteConfirmId(null)}
            />
          ))}
        </div>
      )}

      {items.length === 0 && (
        <p className="text-sm text-slate-500 italic text-center py-4">
          No action items yet.
        </p>
      )}
    </div>
  );
};

// ── Reusable row ──────────────────────────────────────────────────────────────

interface ActionRowProps {
  item: ActionItem;
  isEditing: boolean;
  editText: string;
  deleteConfirm: boolean;
  onToggle: () => void;
  onStartEdit: () => void;
  onEditChange: (v: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

const ActionRow: React.FC<ActionRowProps> = ({
  item,
  isEditing,
  editText,
  deleteConfirm,
  onToggle,
  onStartEdit,
  onEditChange,
  onEditSave,
  onEditCancel,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}) => {
  if (deleteConfirm) {
    return (
      <div className="p-3 glass-card rounded-lg border border-rose-500/30 flex items-center gap-3">
        <span className="material-symbols-outlined text-rose-400 text-[18px]">warning</span>
        <p className="text-sm text-slate-300 flex-1">Delete this item?</p>
        <button
          onClick={onDeleteConfirm}
          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-medium"
        >
          Delete
        </button>
        <button
          onClick={onDeleteCancel}
          className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs font-medium"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="p-2 glass-card rounded-lg border border-purple-500/30 flex items-center gap-2">
        <input
          autoFocus
          type="text"
          value={editText}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onEditSave();
            if (e.key === "Escape") onEditCancel();
          }}
          className="flex-1 bg-transparent text-sm text-slate-200 focus:outline-none px-1"
        />
        <button
          onClick={onEditSave}
          className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs"
        >
          Save
        </button>
        <button
          onClick={onEditCancel}
          className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-xs"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="group p-3 glass-card rounded-lg flex items-center gap-3 border border-transparent hover:border-slate-700/50 transition-colors">
      <button
        onClick={onToggle}
        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
          item.is_completed
            ? "bg-purple-600 border-purple-600"
            : "border-slate-600 hover:border-purple-500"
        }`}
      >
        {item.is_completed && (
          <span className="material-symbols-outlined text-white text-[12px]">check</span>
        )}
      </button>

      <span
        className={`text-sm flex-1 min-w-0 truncate ${
          item.is_completed ? "text-slate-500 line-through" : "text-slate-200"
        }`}
      >
        {item.text}
      </span>

      {item.due_date && (
        <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded flex-shrink-0">
          {new Date(item.due_date).toLocaleDateString()}
        </span>
      )}

      {/* Edit/Delete — visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={onStartEdit}
          className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-300 rounded transition-colors"
          title="Edit"
        >
          <span className="material-symbols-outlined text-[14px]">edit</span>
        </button>
        <button
          onClick={onDeleteRequest}
          className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-rose-400 rounded transition-colors"
          title="Delete"
        >
          <span className="material-symbols-outlined text-[14px]">delete</span>
        </button>
      </div>
    </div>
  );
};
