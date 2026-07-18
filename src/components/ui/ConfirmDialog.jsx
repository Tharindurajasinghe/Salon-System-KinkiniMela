"use client";

import Modal from "./Modal";
import Button from "./Button";

/**
 * Reusable confirm prompt (used before destructive removes).
 * <ConfirmDialog open title message onConfirm onCancel loading />
 */
export default function ConfirmDialog({
  open, title = "Are you sure?", message, confirmLabel = "Remove",
  onConfirm, onCancel, loading,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Removing..." : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-600">{message}</p>
    </Modal>
  );
}
