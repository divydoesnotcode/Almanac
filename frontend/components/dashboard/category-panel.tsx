"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

import { getApiErrorMessage } from "@/lib/api";
import { invalidateDashboardCache } from "@/lib/dashboard/use-dashboard";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type LedgerCategory,
} from "@/lib/ledger-api";

import { DeleteConfirmDialog, EditDeleteActions } from "./row-actions";
import { Corners, EmptyBlock, ErrorBlock, Panel, Skeleton } from "./ui";

function CategoryComposer({
  category = null,
  onSuccess,
  onCancel,
}: {
  category?: LedgerCategory | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [busy, setBusy] = useState(false);
  const [tone, setTone] = useState<"idle" | "error" | "ok">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setTone("error");
      setMessage("Enter a category name");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      if (category) {
        await updateCategory(category.id, { name: name.trim() });
      } else {
        await createCategory({ name: name.trim() });
      }
      invalidateDashboardCache();
      setTone("ok");
      setMessage(category ? "Category updated" : "Category created");
      if (!category) setName("");
      if (onSuccess) onSuccess();
    } catch (error) {
      setTone("error");
      setMessage(
        getApiErrorMessage(
          error,
          category ? "Unable to update category" : "Unable to create category"
        )
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="cfo-panel dash-panel">
      <Corners accent />
      <div className="cfo-panel-head">
        <strong>{category ? "Edit category" : "Add a category"}</strong>
        {onCancel ? (
          <button
            type="button"
            className="dash-icon-btn"
            aria-label="Close dialog"
            onClick={onCancel}
          >
            ✕
          </button>
        ) : (
          <span>CATEGORY</span>
        )}
      </div>
      <form className="cfo-form dash-ledger-form" onSubmit={onSubmit}>
        <label className="cfo-field">
          <span className="cfo-label">Name</span>
          <input
            className="cfo-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Subscriptions, Pet Care"
            required
          />
        </label>
        {message ? (
          <p
            className={`cfo-banner ${
              tone === "ok" ? "cfo-banner--ok" : "cfo-banner--warn"
            }`}
          >
            {message}
          </p>
        ) : null}
        <button type="submit" className="cfo-btn cfo-btn--ghost" disabled={busy}>
          {busy ? "Saving…" : category ? "Save changes" : "Create category"}
        </button>
      </form>
    </section>
  );
}

export function CategoriesPanel() {
  const [categories, setCategories] = useState<LedgerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<LedgerCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<LedgerCategory | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCategories();
      setCategories(data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load categories"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    listCategories()
      .then((data) => {
        if (cancelled) return;
        setCategories(data || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getApiErrorMessage(err, "Unable to load categories"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!dialogOpen && !deletingCategory) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (deletingCategory && !deleteBusy) {
        setDeletingCategory(null);
      } else if (dialogOpen) {
        setDialogOpen(false);
        setEditingCategory(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialogOpen, deletingCategory, deleteBusy]);

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    setDeleteBusy(true);
    try {
      await deleteCategory(deletingCategory.id);
      invalidateDashboardCache();
      setDeletingCategory(null);
      loadCategories();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to delete category"));
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <Panel
      title="Categories"
      meta={<span>{categories.length} TOTAL</span>}
      accent
      actions={
        <button
          type="button"
          className="cfo-btn cfo-btn--ghost"
          style={{ fontSize: "0.78rem", padding: "0.3rem 0.65rem" }}
          onClick={() => {
            setEditingCategory(null);
            setDialogOpen(true);
          }}
        >
          <Plus size={13} aria-hidden="true" /> Add Category
        </button>
      }
    >
      {error ? (
        <ErrorBlock message={error} onRetry={loadCategories} />
      ) : loading ? (
        <Skeleton lines={6} />
      ) : categories.length === 0 ? (
        <EmptyBlock
          title="No categories found"
          body="Add categories to organize your expenses and income."
        />
      ) : (
        <>
          <div className="dash-tx-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Origin</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <strong>{cat.name}</strong>
                    </td>
                    <td>
                      <span
                        className={`cfo-badge ${
                          cat.is_system ? "" : "cfo-badge--ok"
                        }`}
                      >
                        {cat.is_system ? "System" : "Custom"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <EditDeleteActions
                        editLabel="Edit category"
                        deleteLabel="Delete category"
                        onEdit={() => {
                          setEditingCategory(cat);
                          setDialogOpen(true);
                        }}
                        onDelete={() => setDeletingCategory(cat)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dash-tx-cards">
            {categories.map((cat) => (
              <article key={cat.id} className="cfo-card dash-tx-card">
                <div className="dash-tx-card-head">
                  <span className="dash-tx-card-date">
                    {cat.is_system ? "System Standard" : "Custom Category"}
                  </span>
                </div>
                <div className="dash-tx-card-body">
                  <strong className="dash-tx-card-desc">{cat.name}</strong>
                </div>
                <div className="dash-tx-card-footer">
                  <EditDeleteActions
                    className="dash-tx-card-actions"
                    editLabel="Edit category"
                    deleteLabel="Delete category"
                    onEdit={() => {
                      setEditingCategory(cat);
                      setDialogOpen(true);
                    }}
                    onDelete={() => setDeletingCategory(cat)}
                  />
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {/* Add / Edit Category Modal with 1-second buttery smooth transition */}
      <AnimatePresence>
        {dialogOpen && (
          <>
            <motion.div
              key="category-modal-backdrop"
              className="dash-modal-backdrop"
              onClick={() => {
                setDialogOpen(false);
                setEditingCategory(null);
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              aria-label="Close dialog backdrop"
            />
            <motion.div
              key="category-modal-dialog"
              className="dash-modal"
              role="dialog"
              aria-modal="true"
              aria-label={editingCategory ? "Edit category" : "Add a category"}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{
                duration: 1.0,
                ease: [0.16, 1, 0.3, 1], // 1-second buttery smooth Apple physics curve
              }}
            >
              <CategoryComposer
                key={editingCategory ? editingCategory.id : "new"}
                category={editingCategory}
                onSuccess={() => {
                  setDialogOpen(false);
                  setEditingCategory(null);
                  loadCategories();
                }}
                onCancel={() => {
                  setDialogOpen(false);
                  setEditingCategory(null);
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {deletingCategory ? (
        <DeleteConfirmDialog
          titleId="delete-cat-title"
          title="Delete category"
          busy={deleteBusy}
          onCancel={() => setDeletingCategory(null)}
          onConfirm={handleDeleteConfirm}
          description={
            <>
              Are you sure you want to delete the{" "}
              <strong>{deletingCategory.name}</strong> category? This action
              cannot be undone.
            </>
          }
        />
      ) : null}
    </Panel>
  );
}
