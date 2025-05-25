"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, Plus, FileSpreadsheet, Save, ArrowLeft, Copy, Trash2, Crown, X, ArrowRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { handleExcelImport, handleExcelExport } from "@/lib/excel-utils"
import { generateId } from "@/lib/utils"
import type { NPC, Battle, ProjectData } from "@/lib/excel-utils"

// Battle Canvas Component
function BattleCanvas({
  battle,
  npcs,
  onUpdateBattle,
  onCreateNPC,
}: {
  battle: Battle
  npcs: NPC[]
  onUpdateBattle: (battle: Battle) => void
  onCreateNPC?: (npcCode: string, slotIndex: number) => string
}) {
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null)
  const [inputMode, setInputMode] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [pendingNPCCode, setPendingNPCCode] = useState("")
  const [pendingSlot, setPendingSlot] = useState<number | null>(null)

  const handleDragStart = (slotIndex: number) => {
    if (slotIndex === 2) return
    setDraggedSlot(slotIndex)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetSlotIndex: number) => {
    if (draggedSlot === null || draggedSlot === targetSlotIndex || targetSlotIndex === 2) return

    const newSlots = [...battle.slots]
    const draggedNPC = newSlots[draggedSlot]
    newSlots[draggedSlot] = null
    newSlots[targetSlotIndex] = draggedNPC

    onUpdateBattle({ ...battle, slots: newSlots })
    setDraggedSlot(null)
  }

  const handleSlotClick = (slotIndex: number) => {
    setInputMode(slotIndex)
    setInputValue("")
  }

  const handleInputSubmit = () => {
    if (inputMode === null || !inputValue.trim()) return

    const npc = npcs.find((n) => n.编号 === inputValue.trim())

    if (!npc) {
      setPendingNPCCode(inputValue.trim())
      setPendingSlot(inputMode)
      setShowCreateDialog(true)
      return
    }

    const newSlots = [...battle.slots]
    newSlots[inputMode] = npc.id

    onUpdateBattle({ ...battle, slots: newSlots })
    setInputMode(null)
    setInputValue("")
  }

  const handleCreateNewNPC = () => {
    if (onCreateNPC && pendingNPCCode && pendingSlot !== null) {
      onCreateNPC(pendingNPCCode, pendingSlot)
      setShowCreateDialog(false)
      setPendingNPCCode("")
      setPendingSlot(null)
      setInputMode(null)
      setInputValue("")
    }
  }

  const handleClearSlot = (slotIndex: number) => {
    const newSlots = [...battle.slots]
    newSlots[slotIndex] = null
    onUpdateBattle({ ...battle, slots: newSlots })
  }

  const getNPCData = (npcId: string | null) => {
    if (!npcId) return null
    return npcs.find((npc) => npc.id === npcId)
  }

  const renderSlot = (slotIndex: number) => {
    const npcId = battle.slots[slotIndex]
    const npc = getNPCData(npcId)
    const isMainBoss = slotIndex === 2
    const isEmpty = !npcId

    if (inputMode === slotIndex) {
      return (
        <Card className="w-32 h-24 border-2 border-blue-500">
          <CardContent className="p-2 h-full flex flex-col">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="输入NPC编号"
              className="text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleInputSubmit()
                if (e.key === "Escape") setInputMode(null)
              }}
              autoFocus
            />
            <div className="flex gap-1 mt-1">
              <Button size="sm" className="text-xs h-6" onClick={handleInputSubmit}>
                确定
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-6" onClick={() => setInputMode(null)}>
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card
        className={`w-32 h-24 cursor-pointer transition-all ${
          isEmpty ? "border-dashed border-gray-300 hover:border-gray-400" : "border-solid"
        } ${
          isMainBoss
            ? "border-slate-400 bg-gradient-to-br from-slate-100 to-blue-50 shadow-md ring-1 ring-slate-300"
            : ""
        } ${draggedSlot === slotIndex ? "opacity-50" : ""}`}
        draggable={!isEmpty && !isMainBoss}
        onDragStart={() => handleDragStart(slotIndex)}
        onDragOver={handleDragOver}
        onDrop={() => handleDrop(slotIndex)}
        onClick={() => {
          if (isEmpty) {
            handleSlotClick(slotIndex)
          } else {
            handleSlotClick(slotIndex)
            setInputValue(getNPCData(battle.slots[slotIndex])?.编号 || "")
          }
        }}
        onDoubleClick={() => !isEmpty && handleClearSlot(slotIndex)}
      >
        <CardContent className="p-2 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">#{slotIndex + 1}</span>
            {isMainBoss && <Crown className="h-3 w-3 text-slate-600" />}
          </div>

          {isEmpty ? (
            <div className="flex-1 flex items-center justify-center">
              <Plus className="h-6 w-6 text-gray-400" />
            </div>
          ) : npc ? (
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-xs font-medium truncate">{npc.编号}</div>
              <div className="text-xs text-gray-600 truncate">{npc.名称}</div>
              <div className="text-xs text-gray-500">造型: {npc.造型 || "—"}</div>
              <div className="text-xs text-gray-500">{npc.气血斜率 ? `${npc.气血斜率}*lv` : "气血斜率: —"}</div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-xs text-red-500">NPC不存在</div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        拖拽交换位置 | 点击空格输入NPC编号 | 双击清空 |
        <Badge variant="outline" className="ml-2 border-slate-300 text-slate-700">
          <Crown className="mr-1 h-3 w-3" />
          位置3 为主怪位置（锁定）
        </Badge>
      </div>

      <div className="grid grid-cols-5 gap-2 p-4 bg-gray-100 rounded-lg">
        <div className="col-span-5 grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex justify-center">
              {renderSlot(i)}
            </div>
          ))}
        </div>

        <div className="col-span-5 grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i + 5} className="flex justify-center">
              {renderSlot(i + 5)}
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-500">提示: 同一NPC可以在多个槽位出现。主怪位置(位置3)锁定不可修改。</div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新NPC</DialogTitle>
            <DialogDescription>编号为 "{pendingNPCCode}" 的NPC不存在，是否要创建新的NPC？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateNewNPC}>确认创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// New Project Wizard Component
function NewProjectWizard({
  isOpen,
  onClose,
  onComplete,
}: {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: { activityName: string; activityId: string }) => void
}) {
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

  const handleClose = () => {
    setFormData({ activityName: "", activityId: "" })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新建表格</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="activityName">活动名称 *</Label>
            <Input
              id="activityName"
              placeholder="例如：2026春节活动、2026嘉年华"
              value={formData.activityName}
              onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activityId">活动ID *</Label>
            <Input
              id="activityId"
              placeholder="通常为5-6位数字，如112233"
              value={formData.activityId}
              onChange={(e) => setFormData({ ...formData, activityId: e.target.value })}
              required
            />
            <p className="text-sm text-gray-500">建议使用数字，便于系统识别</p>
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
            确定
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Delete Confirmation Dialog Component
function DeleteConfirmation({
  isOpen,
  onClose,
  onConfirm,
  battleName,
  npcCount,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  battleName: string
  npcCount: number
}) {
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

// NPC Table Component
function NPCTable({
  npcs,
  allNPCs,
  isInBattle,
  battleName,
  allBattles,
  activityName,
  onUpdateNPCs,
  onCreateBattle,
}: {
  npcs: NPC[]
  allNPCs: NPC[]
  isInBattle?: boolean
  battleName?: string
  allBattles: Battle[]
  activityName: string
  onUpdateNPCs: (npcs: NPC[]) => void
  onCreateBattle?: () => void
}) {
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [fieldPage, setFieldPage] = useState(0)
  const fieldsPerPage = 6

  const fieldGroups = {
    basic: {
      name: "基础身份",
      fields: ["编号", "名称", "造型", "门派", "备注", "过期时间"],
    },
    combat: {
      name: "战斗属性",
      fields: ["气血斜率", "气血基数", "难度", "受击增伤", "魔法值基数", "速度斜率", "速度基数", "智能速度配置"],
    },
    behavior: {
      name: "行为逻辑",
      fields: ["技能", "行为树编号", "使用等级类型", "进入战斗喊话"],
    },
  }

  const allFields = [...fieldGroups.basic.fields, ...fieldGroups.combat.fields, ...fieldGroups.behavior.fields]

  const getCurrentGroup = (pageIndex: number) => {
    const frozenFields = ["编号", "名称"]
    const otherFields = allFields.filter((field) => !frozenFields.includes(field))
    const startIndex = pageIndex * (fieldsPerPage - frozenFields.length)

    let currentIndex = 0
    for (const [groupKey, group] of Object.entries(fieldGroups)) {
      const groupOtherFields = group.fields.filter((field) => !frozenFields.includes(field))
      if (startIndex < currentIndex + groupOtherFields.length) {
        return group.name
      }
      currentIndex += groupOtherFields.length
    }
    return fieldGroups.behavior.name
  }

  const handleUpdateNPC = (npcId: string, field: string, value: any) => {
    const updatedNPCs = npcs.map((npc) => (npc.id === npcId ? { ...npc, [field]: value, isModified: true } : npc))
    onUpdateNPCs(updatedNPCs)
  }

  const handleAddNPC = () => {
    const newNPC: NPC = {
      id: `npc_${Date.now()}`,
      编号: "",
      名称: "",
      造型: "",
      门派: "",
      备注: activityName,
      过期时间: "",
      气血斜率: "",
      气血基数: "",
      难度: "",
      受击增伤: "",
      魔法值基数: "",
      速度斜率: "",
      速度基数: "",
      智能速度配置: "",
      技能: "",
      行为树编号: "",
      使用等级类型: "",
      进入战斗喊话: "",
      所属战斗: battleName ? [battleName] : [],
      isModified: false,
    }
    onUpdateNPCs([...npcs, newNPC])
  }

  const handleDeleteNPC = (npcId: string) => {
    const updatedNPCs = npcs.filter((npc) => npc.id !== npcId)
    onUpdateNPCs(updatedNPCs)
  }

  const handleCopyPreviousRow = () => {
    if (selectedRows.length === 0) return

    const updatedNPCs = npcs.map((npc, index) => {
      if (selectedRows.includes(npc.id) && index > 0) {
        const previousNPC = npcs[index - 1]
        const updates: any = { isModified: true }

        allFields.forEach((field) => {
          if (field !== "编号" && (!npc[field as keyof NPC] || npc[field as keyof NPC] === "")) {
            updates[field] = previousNPC[field as keyof NPC]
          }
        })

        return { ...npc, ...updates }
      }
      return npc
    })

    onUpdateNPCs(updatedNPCs)
  }

  const handleToggleBattle = (npcId: string, battleName: string, isAdding: boolean) => {
    const updatedNPCs = npcs.map((npc) => {
      if (npc.id === npcId) {
        const battles = npc.所属战斗 || []
        const updatedBattles = isAdding ? [...battles, battleName] : battles.filter((b) => b !== battleName)
        return { ...npc, 所属战斗: updatedBattles, isModified: true }
      }
      return npc
    })
    onUpdateNPCs(updatedNPCs)
  }

  const handleCreateNewBattle = () => {
    if (onCreateBattle) {
      onCreateBattle()
    }
  }

  const renderField = (npc: NPC, field: string) => {
    const value = npc[field as keyof NPC]
    return (
      <Input
        value={(value as string) || ""}
        onChange={(e) => handleUpdateNPC(npc.id, field, e.target.value)}
        className="w-full"
      />
    )
  }

  const frozenFields = ["编号", "名称"]
  const otherFields = allFields.filter((field) => !frozenFields.includes(field))
  const startIndex = fieldPage * (fieldsPerPage - frozenFields.length)
  const otherFieldsForPage = otherFields.slice(startIndex, startIndex + fieldsPerPage - frozenFields.length)
  const displayFields = [...frozenFields, ...otherFieldsForPage]

  const totalPages = Math.ceil(otherFields.length / (fieldsPerPage - frozenFields.length))

  const handleNextPage = () => {
    if (fieldPage < totalPages - 1) {
      setFieldPage(fieldPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (fieldPage > 0) {
      setFieldPage(fieldPage - 1)
    }
  }

  const isFirstPage = fieldPage === 0
  const isLastPage = fieldPage === totalPages - 1
  const currentGroup = getCurrentGroup(fieldPage)

  const fieldLabels: Record<string, string> = {
    编号: "编号",
    名称: "名称",
    造型: "造型",
    门派: "门派",
    备注: "备注",
    过期时间: "过期时间",
    气血斜率: "气血斜率",
    气血基数: "气血基数",
    难度: "难度",
    受击增伤: "受击增伤",
    魔法值基数: "魔法值基数",
    速度斜率: "速度斜率",
    速度基数: "速度基数",
    智能速度配置: "智能速度配置",
    技能: "技能",
    行为树编号: "行为树编号",
    使用等级类型: "使用等级类型",
    进入战斗喊话: "进入战斗喊话",
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium">{isInBattle ? `${battleName} - NPC列表` : "NPC数据表"}</h3>
            {/* 字段视图切换分页器 */}
            {!isInBattle && (
              <div className="flex items-center ml-4">
                <div className="flex items-center border rounded-md overflow-hidden shadow-sm">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrevPage}
                    disabled={isFirstPage}
                    className="h-8 w-8 rounded-none border-0"
                    style={{ borderRight: '1px solid #e5e7eb' }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextPage}
                    disabled={isLastPage}
                    className="h-8 w-8 rounded-none border-0"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-sm text-gray-500 ml-3">字段视图：</span>
                <Badge variant="outline" className="text-xs ml-1 font-semibold">
                  {currentGroup}
                </Badge>
                <div className="flex space-x-1 ml-3">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${i === fieldPage ? "bg-blue-500" : "bg-gray-300"}`}
                      onClick={() => setFieldPage(i)}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500 ml-2">{fieldPage + 1} / {totalPages}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {selectedRows.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleCopyPreviousRow}>
                <Copy className="mr-2 h-4 w-4" />
                复制上一行 ({selectedRows.length})
              </Button>
            )}
            <Button size="sm" onClick={handleAddNPC}>
              <Plus className="mr-2 h-4 w-4" />
              添加NPC
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-hidden">
        <div className="relative h-full" style={{ height: 500 }}>
          <div className="overflow-y-auto h-full">
            <table className="w-full table-fixed">
              <thead>
                <tr>
                  <th className="sticky top-0 z-10 bg-gray-50 p-3 min-w-[120px] text-left border-r border-gray-200 font-medium text-gray-700">
                    <Checkbox
                      checked={selectedRows.length === npcs.length}
                      onCheckedChange={(checked) => {
                        setSelectedRows(checked ? npcs.map((npc) => npc.id) : [])
                      }}
                    />
                  </th>
                  {!isInBattle && (
                    <th className="sticky top-0 z-10 bg-gray-50 p-3 min-w-[140px] text-left border-r border-gray-200 font-medium text-gray-700">
                      所属战斗
                    </th>
                  )}
                  {displayFields.map((field) => {
                    const isFrozen = frozenFields.includes(field)
                    return (
                      <th
                        key={field}
                        className={`sticky top-0 z-10 bg-gray-50 p-3 min-w-[120px] text-left ${
                          isFrozen
                            ? "border-r border-gray-200 font-medium text-gray-700"
                            : ""
                        }`}
                      >
                        {fieldLabels[field] || field}
                      </th>
                    )
                  })}
                  <th className="sticky top-0 z-10 bg-gray-50 p-3 min-w-[120px] text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {npcs.map((npc) => (
                  <tr key={npc.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 min-w-[120px] bg-gray-50/80 border-r border-gray-200">
                      <Checkbox
                        checked={selectedRows.includes(npc.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedRows([...selectedRows, npc.id])
                          } else {
                            setSelectedRows(selectedRows.filter((id) => id !== npc.id))
                          }
                        }}
                      />
                    </td>
                    {!isInBattle && (
                      <td className="p-3 min-w-[140px] bg-gray-50/80 border-r border-gray-200">
                        <div className="flex flex-wrap gap-1 items-center max-w-[200px]">
                          {npc.所属战斗?.map((battle) => (
                            <Badge
                              key={battle}
                              variant="secondary"
                              className="cursor-pointer text-xs"
                              onClick={() => handleToggleBattle(npc.id, battle, false)}
                            >
                              {battle}
                              <X className="ml-1 h-3 w-3" />
                            </Badge>
                          ))}
                          <Select
                            onValueChange={(battleName) => {
                              if (battleName === "__create_new__") {
                                handleCreateNewBattle()
                              } else {
                                handleToggleBattle(npc.id, battleName, true)
                              }
                            }}
                          >
                            <SelectTrigger className="w-auto h-6 text-xs border-dashed">
                              <SelectValue>
                                <Plus className="h-3 w-3" />
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {allBattles
                                .filter((battle) => !npc.所属战斗?.includes(battle.name))
                                .map((battle) => (
                                  <SelectItem key={battle.id} value={battle.name}>
                                    {battle.name}
                                  </SelectItem>
                                ))}
                              <SelectItem value="__create_new__">
                                <div className="flex items-center">
                                  <Plus className="h-3 w-3 mr-1" />
                                  新建战斗
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    )}
                    {displayFields.map((field) => {
                      const isFrozen = frozenFields.includes(field)
                      return (
                        <td
                          key={field}
                          className={`p-3 min-w-[120px] ${isFrozen ? "bg-gray-50/80 border-r border-gray-200" : ""}`}
                        >
                          {renderField(npc, field)}
                        </td>
                      )
                    })}
                    <td className="p-3 min-w-[120px]">
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteNPC(npc.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// Home Page View Component
function HomePageView({ onCreateNew, onImport }: { onCreateNew: () => void; onImport: () => void }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-light text-gray-900 mb-8 tracking-tight">NPC 配表工具</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
              专为游戏策划设计的智能化NPC数据编辑平台
              <br />
              让复杂的配表工作变得简单高效
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <Card
              className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white border border-gray-200"
              onClick={onImport}
            >
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-4 bg-gray-900 rounded-2xl">
                    <FileSpreadsheet className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-gray-900 font-medium">导入现有表格</CardTitle>
                    <CardDescription className="text-gray-500 mt-2">从Excel文件导入现有的NPC配表数据</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  支持导入 .xlsx 格式的NPC配表文件，自动识别字段分组和战斗配置，让数据迁移变得轻松简单
                </p>
                <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white border-0 h-12 text-base font-medium">
                  <Upload className="mr-3 h-5 w-5" />
                  导入数据
                </Button>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white border border-gray-200"
              onClick={onCreateNew}
            >
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-4 bg-gray-900 rounded-2xl">
                    <Plus className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-gray-900 font-medium">创建新表格</CardTitle>
                    <CardDescription className="text-gray-500 mt-2">从空白模板开始创建新的NPC配表</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  使用预设的字段模板快速创建新的NPC配表，包含完整的字段分组和智能化的数据验证
                </p>
                <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 text-base font-medium">
                  <Plus className="mr-3 h-5 w-5" />
                  开始创建
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Import Page Component
function ImportPage({ onBack, onImportSuccess }: { onBack: () => void; onImportSuccess: (projectData: ProjectData) => void }) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.name.endsWith(".xlsx")) {
      alert("请选择.xlsx格式的Excel文件")
      return
    }
    try {
      const projectData = await handleExcelImport(file)
      onImportSuccess(projectData)
    } catch (e) {
      alert("导入失败，请检查文件格式")
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileUpload(e.dataTransfer.files)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回首页
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>导入Excel文件</CardTitle>
            <CardDescription>支持导入现有的NPC配表Excel文件，额外字段将归入"暂未归类"组</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">拖拽Excel文件到此处</p>
              <p className="text-sm text-gray-500 mb-4">或点击选择文件</p>
              <label htmlFor="file-upload">
                <Button asChild type="button">
                  <span>选择文件</span>
                </Button>
                <input
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  id="file-upload"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </label>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">导入说明</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 支持 .xlsx 格式文件</li>
                <li>• 不支持Excel公式和合并单元格，请提前展开并转为数值</li>
                <li>• 额外字段将自动归入"暂未归类"分组</li>
                <li>• 备注列中的战斗标签将自动解析</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const validateProjectData = (data: ProjectData) => {
  const errors: string[] = []
  const npcIds = new Set<string>()

  data.npcs.forEach((npc) => {
    if (!npc.编号) {
      errors.push(`NPC ${npc.名称 || npc.id} 缺少编号`)
    } else if (npcIds.has(npc.编号)) {
      errors.push(`NPC编号 ${npc.编号} 重复`)
    } else {
      npcIds.add(npc.编号)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// NPC Editor Main Component
function NPCEditor({
  projectData,
  setProjectData,
  onBack,
}: {
  projectData: ProjectData
  setProjectData: (data: ProjectData) => void
  onBack: () => void
}) {
  const [activeTab, setActiveTab] = useState("summary")
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    battleId: string
    battleName: string
    npcCount: number
  }>({
    isOpen: false,
    battleId: "",
    battleName: "",
    npcCount: 0,
  })

  const handleSave = () => {
    const validation = validateProjectData(projectData)
    if (!validation.isValid) {
      alert(`数据验证失败: ${validation.errors.join(", ")}`)
      return
    }
    handleExcelExport(projectData)
    alert("保存成功！")
  }

  const handleCreateBattle = () => {
    const newBattleId = `battle_${projectData.battles.length + 1}`
    const newBattle: Battle = {
      id: newBattleId,
      name: `战斗${projectData.battles.length + 1}`,
      slots: Array(10).fill(null),
    }

    setProjectData({
      ...projectData,
      battles: [...projectData.battles, newBattle],
    })
  }

  const handleDeleteBattle = (battleId: string) => {
    const battle = projectData.battles.find((b) => b.id === battleId)
    if (!battle) return

    const npcCount = projectData.npcs.filter((npc) => npc.所属战斗.includes(battle.name)).length

    setDeleteConfirmation({
      isOpen: true,
      battleId,
      battleName: battle.name,
      npcCount,
    })
  }

  const confirmDeleteBattle = () => {
    const battleToDelete = projectData.battles.find((b) => b.id === deleteConfirmation.battleId)
    if (!battleToDelete) return

    const updatedNPCs = projectData.npcs.map((npc) => ({
      ...npc,
      所属战斗: npc.所属战斗.filter((battle) => battle !== battleToDelete.name),
    }))

    const updatedBattles = projectData.battles.filter((b) => b.id !== deleteConfirmation.battleId)

    setProjectData({
      ...projectData,
      npcs: updatedNPCs,
      battles: updatedBattles,
    })

    if (activeTab === deleteConfirmation.battleId) {
      setActiveTab("summary")
    }
  }

  const currentBattle = projectData.battles.find((b) => b.id === activeTab)
  const currentNPCs = useMemo(() => {
    if (activeTab === "summary") {
      return projectData.npcs
    } else {
      return projectData.npcs.filter((npc) => npc.所属战斗.includes(currentBattle?.name || ""))
    }
  }, [activeTab, projectData.npcs, currentBattle?.name])

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener("keydown", handleKeydown)
    return () => window.removeEventListener("keydown", handleKeydown)
  }, [projectData])

  const handleCreateNPCFromBattle = (npcCode: string, slotIndex: number): string => {
    const newNPC: NPC = {
      id: `npc_${Date.now()}`,
      编号: npcCode,
      名称: "",
      造型: "",
      门派: "",
      备注: projectData.activityName,
      过期时间: "",
      气血斜率: "",
      气血基数: "",
      难度: "",
      受击增伤: "",
      魔法值基数: "",
      速度斜率: "",
      速度基数: "",
      智能速度配置: "",
      技能: "",
      行为树编号: "",
      使用等级类型: "",
      进入战斗喊话: "",
      所属战斗: currentBattle ? [currentBattle.name] : [],
      isModified: true,
    }

    const updatedBattles = projectData.battles.map((battle) => {
      if (battle.id === currentBattle?.id) {
        const newSlots = [...battle.slots]
        newSlots[slotIndex] = newNPC.id
        return { ...battle, slots: newSlots }
      }
      return battle
    })

    const updatedProjectData = {
      ...projectData,
      npcs: [...projectData.npcs, newNPC],
      battles: updatedBattles,
    }

    setProjectData(updatedProjectData)
    return newNPC.id
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回首页
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{projectData.activityName}</h1>
              <p className="text-sm text-gray-500">活动ID: {projectData.activityId}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              保存 (Ctrl+S)
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        <div className="fixed left-0 top-0 h-screen w-64 bg-white border-r flex flex-col z-20">
          <div className="p-4 border-b">
            <h3 className="font-medium text-gray-900">页签管理</h3>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div
              className={`p-3 rounded-lg cursor-pointer mb-2 ${
                activeTab === "summary" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("summary")}
            >
              <div className="font-medium">汇总数据</div>
            </div>

            <div className="space-y-2">
              {projectData.battles.map((battle) => (
                <div
                  key={battle.id}
                  className={`p-3 rounded-lg cursor-pointer flex items-center justify-between group ${
                    activeTab === battle.id ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                  }`}
                  onClick={() => setActiveTab(battle.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{battle.name}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 ml-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteBattle(battle.id)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <Button variant="outline" className="w-full" onClick={handleCreateBattle}>
              <Plus className="mr-2 h-4 w-4" />
              新建战斗
            </Button>
          </div>
        </div>

        <div className="ml-64 flex-1 flex flex-col">
          {activeTab !== "summary" && currentBattle && (
            <div className="bg-white border-b p-6">
              <h3 className="text-lg font-medium mb-4">{currentBattle.name} - 战斗布局</h3>
              <BattleCanvas
                battle={currentBattle}
                npcs={projectData.npcs}
                onUpdateBattle={(updatedBattle) => {
                  const updatedBattles = projectData.battles.map((b) => (b.id === updatedBattle.id ? updatedBattle : b))
                  setProjectData({
                    ...projectData,
                    battles: updatedBattles,
                  })
                }}
                onCreateNPC={(npcCode, slotIndex) => handleCreateNPCFromBattle(npcCode, slotIndex)}
              />
            </div>
          )}

          <div className="flex-1 p-6">
            <div className="bg-white rounded-lg shadow-sm h-full">
              <NPCTable
                npcs={currentNPCs}
                allNPCs={projectData.npcs}
                isInBattle={activeTab !== "summary"}
                battleName={currentBattle?.name}
                allBattles={projectData.battles}
                activityName={projectData.activityName}
                onUpdateNPCs={(updatedNPCs) => {
                  if (activeTab === "summary") {
                    setProjectData({
                      ...projectData,
                      npcs: updatedNPCs,
                    })
                  } else {
                    // 战斗模式下的更新逻辑
                    const existingNPCIds = new Set(projectData.npcs.map((npc) => npc.id))
                    const newNPCs = updatedNPCs.filter((npc) => !existingNPCIds.has(npc.id))

                    const allNPCs = projectData.npcs.map((npc) => {
                      const updatedNPC = updatedNPCs.find((u) => u.id === npc.id)
                      return updatedNPC || npc
                    })

                    // 添加新的NPC到列表中
                    setProjectData({
                      ...projectData,
                      npcs: [...allNPCs, ...newNPCs],
                    })
                  }
                }}
                onCreateBattle={handleCreateBattle}
              />
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmation
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}
        onConfirm={confirmDeleteBattle}
        battleName={deleteConfirmation.battleName}
        npcCount={deleteConfirmation.npcCount}
      />
    </div>
  )
}

// Main Page Component
export default function HomePage() {
  const [currentView, setCurrentView] = useState<"home" | "editor" | "import">("home")
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [showNewProjectWizard, setShowNewProjectWizard] = useState(false)

  const handleCreateNew = () => {
    setShowNewProjectWizard(true)
  }

  const handleProjectCreated = (wizardData: { activityName: string; activityId: string }) => {
    const newProject: ProjectData = {
      activityName: wizardData.activityName,
      activityId: wizardData.activityId,
      npcs: [
        {
          id: "npc_1",
          编号: "",
          名称: "",
          造型: "",
          门派: "",
          备注: wizardData.activityName, // 修改这里，使用活动名称
          过期时间: "",
          气血斜率: "",
          气血基数: "",
          难度: "",
          受击增伤: "",
          魔法值基数: "",
          速度斜率: "",
          速度基数: "",
          智能速度配置: "",
          技能: "",
          行为树编号: "",
          使用等级类型: "",
          进入战斗喊话: "",
          所属战斗: [],
          isModified: false,
        },
      ],
      battles: [],
    }
    setProjectData(newProject)
    setCurrentView("editor")
    setShowNewProjectWizard(false)
  }

  const handleImport = () => {
    setCurrentView("import")
  }

  if (currentView === "editor" && projectData) {
    return <NPCEditor projectData={projectData} setProjectData={setProjectData} onBack={() => setCurrentView("home")} />
  }

  if (currentView === "import") {
    return <ImportPage onBack={() => setCurrentView("home")} onImportSuccess={(projectData) => {
      setProjectData(projectData)
      setCurrentView("editor")
    }} />
  }

  return (
    <>
      <HomePageView onCreateNew={handleCreateNew} onImport={handleImport} />
      <NewProjectWizard
        isOpen={showNewProjectWizard}
        onClose={() => setShowNewProjectWizard(false)}
        onComplete={handleProjectCreated}
      />
    </>
  )
}
