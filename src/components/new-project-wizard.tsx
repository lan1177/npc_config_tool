"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Check, Wand2 } from "lucide-react"

interface NewProjectWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: { activityName: string; activityId: string }) => void
}

export default function NewProjectWizard({ isOpen, onClose, onComplete }: NewProjectWizardProps) {
  const [formData, setFormData] = useState({
    activityName: "",
    activityId: "",
  })

  const handleSubmit = () => {
    if (!formData.activityName.trim() || !formData.activityId.trim()) {
      alert("请填写完整的活动信息")
      return
    }

    onComplete(formData)
    setFormData({ activityName: "", activityId: "" })
  }

  const generateActivityId = () => {
    const name = formData.activityName.trim()
    if (name) {
      const id = name
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")
      setFormData({ ...formData, activityId: `${id}_${Date.now().toString().slice(-6)}` })
    }
  }

  const handleClose = () => {
    setFormData({ activityName: "", activityId: "" })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新建项目向导</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="activityName">活动名称 *</Label>
            <Input
              id="activityName"
              placeholder="例如：春节活动、周年庆典"
              value={formData.activityName}
              onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activityId">活动ID *</Label>
            <div className="flex gap-2">
              <Input
                id="activityId"
                placeholder="例如：spring_festival_2024"
                value={formData.activityId}
                onChange={(e) => setFormData({ ...formData, activityId: e.target.value })}
                required
              />
              <Button type="button" variant="outline" onClick={generateActivityId} title="根据活动名称自动生成ID">
                <Wand2 className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-500">建议使用英文和下划线，便于系统识别</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={!formData.activityName.trim() || !formData.activityId.trim()}
          >
            <Check className="mr-2 h-4 w-4" />
            确定
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
