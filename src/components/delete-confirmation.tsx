"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DeleteConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  battleName: string
  npcCount: number
}

export default function DeleteConfirmation({
  isOpen,
  onClose,
  onConfirm,
  battleName,
  npcCount,
}: DeleteConfirmationProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认删除战斗</DialogTitle>
          <DialogDescription>
            您确定要删除"{battleName}"吗？
            {npcCount > 0 && (
              <div className="mt-2 text-orange-600">⚠️ 此战斗包含 {npcCount} 个NPC，删除后这些NPC将从该战斗中移除。</div>
            )}
            <div className="mt-2 text-gray-600">此操作无法撤销。</div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleConfirm} variant="destructive">
            确认删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
