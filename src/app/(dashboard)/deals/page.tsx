"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  Plus, Search, Eye, Pencil, Trash2, DollarSign, List, LayoutGrid,
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { Deal, DealStage, PaginatedResponse } from "@/types";
import { DealInput } from "@/lib/validations";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/loading";
import { Pagination } from "@/components/ui/pagination";
import { DealForm } from "@/components/deals/deal-form";
import { formatDate, formatCurrency, getDealStageColor, formatEnumLabel, getInitials, cn } from "@/lib/utils";

const STAGES: DealStage[] = ["PROSPECTING", "QUALIFICATION", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];

function DraggableDealCard({
  deal,
  onEdit,
  onDelete,
}: {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing select-none",
        isDragging && "opacity-50"
      )}
    >
      <DealCardContent deal={deal} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

function DealCardContent({
  deal,
  onEdit,
  onDelete,
}: {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link href={`/deals/${deal.id}`}>
          <p className="text-sm font-medium text-gray-900 hover:text-blue-600 leading-tight">{deal.title}</p>
        </Link>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(deal); }}
            className="p-1 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(deal); }}
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      {deal.company && (
        <p className="text-xs text-gray-500 mb-2">{deal.company.name}</p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">{formatCurrency(deal.value)}</span>
        {deal.assignedTo && (
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700" title={deal.assignedTo.name}>
            {getInitials(deal.assignedTo.name)}
          </div>
        )}
      </div>
    </>
  );
}

function DroppableColumn({
  stage,
  deals,
  onEdit,
  onDelete,
}: {
  stage: DealStage;
  deals: Deal[];
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col min-w-[240px] max-w-[280px] flex-1">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", getDealStageColor(stage))}>
            {formatEnumLabel(stage)}
          </span>
          <span className="text-xs text-gray-500 font-medium">{deals.length}</span>
        </div>
        <span className="text-xs font-semibold text-gray-700">{formatCurrency(totalValue)}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 min-h-[400px] rounded-xl p-2 space-y-2 transition-colors",
          isOver ? "bg-blue-50 border-2 border-blue-200 border-dashed" : "bg-gray-100"
        )}
      >
        {deals.map((deal) => (
          <DraggableDealCard key={deal.id} deal={deal} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

export default function DealsPage() {
  const queryClient = useQueryClient();

  const [view, setView] = useState<"list" | "pipeline">("list");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);
  const [deleteDeal, setDeleteDeal] = useState<Deal | null>(null);
  const [activeDragDeal, setActiveDragDeal] = useState<Deal | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data: listData, isLoading: isListLoading } = useQuery<PaginatedResponse<Deal>>({
    queryKey: ["deals-list", search, page],
    queryFn: async () => {
      const res = await axios.get("/api/deals", { params: { search, page, pageSize: 10 } });
      return res.data;
    },
    enabled: view === "list",
  });

  const { data: pipelineData, isLoading: isPipelineLoading } = useQuery<Deal[]>({
    queryKey: ["deals-pipeline"],
    queryFn: async () => {
      const res = await axios.get("/api/deals?pipeline=true");
      return res.data.data ?? res.data;
    },
    enabled: view === "pipeline",
  });

  const createMutation = useMutation({
    mutationFn: (data: DealInput) => axios.post("/api/deals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals-list"] });
      queryClient.invalidateQueries({ queryKey: ["deals-pipeline"] });
      toast.success("Deal created");
      setIsCreateOpen(false);
    },
    onError: () => toast.error("Failed to create deal"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DealInput> }) =>
      axios.patch(`/api/deals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals-list"] });
      queryClient.invalidateQueries({ queryKey: ["deals-pipeline"] });
      toast.success("Deal updated");
      setEditDeal(null);
    },
    onError: () => toast.error("Failed to update deal"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/deals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals-list"] });
      queryClient.invalidateQueries({ queryKey: ["deals-pipeline"] });
      toast.success("Deal deleted");
      setDeleteDeal(null);
    },
    onError: () => toast.error("Failed to delete deal"),
  });

  const handleDragStart = (event: DragStartEvent) => {
    const deal = pipelineData?.find((d) => d.id === event.active.id);
    setActiveDragDeal(deal ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragDeal(null);
    const { active, over } = event;
    if (!over || !active) return;
    const dealId = active.id as string;
    const newStage = over.id as DealStage;
    const deal = pipelineData?.find((d) => d.id === dealId);
    if (!deal || deal.stage === newStage) return;
    updateMutation.mutate({ id: dealId, data: { stage: newStage } });
  };

  const dealsByStage = (stage: DealStage) =>
    (pipelineData ?? []).filter((d) => d.stage === stage);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your sales pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView("list")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors", view === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setView("pipeline")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors", view === "pipeline" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
            >
              <LayoutGrid className="w-4 h-4" />
              Pipeline
            </button>
          </div>
          <button onClick={() => setIsCreateOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Deal
          </button>
        </div>
      </div>

      {view === "list" && (
        <>
          <div className="card p-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search deals..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="input pl-9"
              />
            </div>
          </div>

          <div className="card overflow-hidden p-0">
            {isListLoading ? (
              <TableSkeleton rows={5} cols={8} />
            ) : !listData?.data.length ? (
              <EmptyState
                icon={DollarSign}
                title="No deals found"
                description="Create your first deal to start tracking your pipeline."
                action={
                  <button onClick={() => setIsCreateOpen(true)} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Deal
                  </button>
                }
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Title</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Contact</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Company</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Stage</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Value</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Close Date</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Assigned To</th>
                        <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {listData.data.map((deal) => (
                        <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <Link href={`/deals/${deal.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                              {deal.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {deal.contact ? (
                              <Link href={`/contacts/${deal.contact.id}`} className="hover:text-blue-600">
                                {deal.contact.firstName} {deal.contact.lastName}
                              </Link>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {deal.company ? (
                              <Link href={`/companies/${deal.company.id}`} className="hover:text-blue-600">
                                {deal.company.name}
                              </Link>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", getDealStageColor(deal.stage))}>
                              {formatEnumLabel(deal.stage)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(deal.value)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{formatDate(deal.expectedCloseDate)}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{deal.assignedTo?.name ?? "—"}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Link href={`/deals/${deal.id}`}>
                                <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                  <Eye className="w-4 h-4" />
                                </button>
                              </Link>
                              <button
                                onClick={() => setEditDeal(deal)}
                                className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteDeal(deal)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {listData.totalPages > 1 && (
                  <Pagination
                    page={page}
                    totalPages={listData.totalPages}
                    onPageChange={setPage}
                    total={listData.total}
                    pageSize={listData.pageSize}
                  />
                )}
              </>
            )}
          </div>
        </>
      )}

      {view === "pipeline" && (
        <div className="overflow-x-auto pb-4">
          {isPipelineLoading ? (
            <div className="flex gap-4">
              {STAGES.map((s) => (
                <div key={s} className="min-w-[240px] h-96 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="flex gap-4">
                {STAGES.map((stage) => (
                  <DroppableColumn
                    key={stage}
                    stage={stage}
                    deals={dealsByStage(stage)}
                    onEdit={setEditDeal}
                    onDelete={setDeleteDeal}
                  />
                ))}
              </div>
              <DragOverlay>
                {activeDragDeal && (
                  <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-lg w-[240px]">
                    <DealCardContent deal={activeDragDeal} onEdit={setEditDeal} onDelete={setDeleteDeal} />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add Deal" size="lg">
        <DealForm
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal isOpen={!!editDeal} onClose={() => setEditDeal(null)} title="Edit Deal" size="lg">
        {editDeal && (
          <DealForm
            defaultValues={editDeal}
            onSubmit={(data) => updateMutation.mutate({ id: editDeal.id, data })}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!deleteDeal}
        onClose={() => setDeleteDeal(null)}
        onConfirm={() => deleteDeal && deleteMutation.mutate(deleteDeal.id)}
        title="Delete Deal"
        message={`Are you sure you want to delete "${deleteDeal?.title}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
