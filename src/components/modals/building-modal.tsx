"use client";

import { useState } from "react";
import { Building2, Plus, Loader2, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createBuilding, updateBuilding } from "@/lib/actions";

interface BuildingModalProps {
  building?: {
    id: string;
    name: string;
    address: string;
    totalFloors: number;
    note: string | null;
  };
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function BuildingModal({ building, trigger, onSuccess }: BuildingModalProps) {
  const isEdit = !!building;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: building?.name ?? "",
    address: building?.address ?? "",
    totalFloors: building?.totalFloors ?? 1,
    note: building?.note ?? "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setFormData({
        name: building?.name ?? "",
        address: building?.address ?? "",
        totalFloors: building?.totalFloors ?? 1,
        note: building?.note ?? "",
      });
      setErrors({});
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Tên tòa nhà không được để trống";
    if (!formData.address.trim()) newErrors.address = "Địa chỉ không được để trống";
    if (formData.totalFloors < 1) newErrors.totalFloors = "Số tầng tối thiểu là 1";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const res = isEdit
        ? await updateBuilding(building.id, formData)
        : await createBuilding(formData);

      if (res.success) {
        toast.success(isEdit ? "Cập nhật tòa nhà thành công" : "Thêm tòa nhà mới thành công");
        setOpen(false);
        onSuccess?.();
      } else {
        toast.error("Không thể lưu tòa nhà", { description: res.error });
      }
    } catch (error: any) {
      toast.error("Lỗi hệ thống", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs">
            <Plus className="size-4" />
            Thêm Tòa nhà
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-white border-slate-200">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="flex items-center gap-2 text-slate-900 text-lg">
              <Building2 className="size-5 text-blue-600" />
              {isEdit ? "Chỉnh sửa Tòa nhà" : "Thêm Tòa nhà mới"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Nhập thông tin cơ bản về tòa nhà hoặc chung cư mini
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="b-name" className="text-xs font-semibold text-slate-700">
                Tên tòa nhà <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="b-name"
                placeholder="VD: Tòa A Sunshine, Chung cư mini 88"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? "border-rose-500 focus-visible:ring-rose-500" : ""}
              />
              {errors.name && <p className="text-xs text-rose-500">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="b-address" className="text-xs font-semibold text-slate-700">
                Địa chỉ <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="b-address"
                placeholder="VD: Số 12 ngõ 45 Cầu Giấy, Hà Nội"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={errors.address ? "border-rose-500 focus-visible:ring-rose-500" : ""}
              />
              {errors.address && <p className="text-xs text-rose-500">{errors.address}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="b-floors" className="text-xs font-semibold text-slate-700">
                Số tầng <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="b-floors"
                type="number"
                min={1}
                value={formData.totalFloors}
                onChange={(e) => setFormData({ ...formData, totalFloors: parseInt(e.target.value) || 1 })}
                className={errors.totalFloors ? "border-rose-500 focus-visible:ring-rose-500" : ""}
              />
              {errors.totalFloors && <p className="text-xs text-rose-500">{errors.totalFloors}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="b-note" className="text-xs font-semibold text-slate-700">
                Ghi chú thêm
              </Label>
              <Textarea
                id="b-note"
                placeholder="Thông tin bảo vệ, đồng hồ điện nước, wifi..."
                rows={3}
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="border-slate-200"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? "Lưu thay đổi" : "Tạo tòa nhà"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
