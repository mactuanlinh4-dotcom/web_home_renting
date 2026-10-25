"use client";

import { useState } from "react";
import { DoorClosed, Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createRoom, updateRoom } from "@/lib/actions";

interface RoomModalProps {
  buildings: Array<{ id: string; name: string }>;
  room?: {
    id: string;
    buildingId: string;
    roomNumber: string;
    floor: number;
    basePrice: number;
    area: number;
    status: "AVAILABLE" | "RENTED" | "MAINTENANCE";
  };
  defaultBuildingId?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function RoomModal({
  buildings,
  room,
  defaultBuildingId,
  trigger,
  onSuccess,
}: RoomModalProps) {
  const isEdit = !!room;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    buildingId: room?.buildingId ?? defaultBuildingId ?? buildings[0]?.id ?? "",
    roomNumber: room?.roomNumber ?? "",
    floor: room?.floor ?? 1,
    basePrice: room?.basePrice ?? 3000000,
    area: room?.area ?? 25,
    status: (room?.status ?? "AVAILABLE") as "AVAILABLE" | "RENTED" | "MAINTENANCE",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setFormData({
        buildingId: room?.buildingId ?? defaultBuildingId ?? buildings[0]?.id ?? "",
        roomNumber: room?.roomNumber ?? "",
        floor: room?.floor ?? 1,
        basePrice: room?.basePrice ?? 3000000,
        area: room?.area ?? 25,
        status: (room?.status ?? "AVAILABLE") as "AVAILABLE" | "RENTED" | "MAINTENANCE",
      });
      setErrors({});
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.buildingId) newErrors.buildingId = "Vui lòng chọn tòa nhà";
    if (!formData.roomNumber.trim()) newErrors.roomNumber = "Mã phòng không được để trống";
    if (formData.floor < 1) newErrors.floor = "Tầng phải từ 1 trở lên";
    if (formData.basePrice < 0) newErrors.basePrice = "Giá thuê không được âm";
    if (formData.area <= 0) newErrors.area = "Diện tích phải lớn hơn 0";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const res = isEdit
        ? await updateRoom(room.id, formData)
        : await createRoom(formData);

      if (res.success) {
        toast.success(isEdit ? "Cập nhật phòng thành công" : "Thêm phòng mới thành công");
        setOpen(false);
        onSuccess?.();
      } else {
        toast.error("Không thể lưu phòng", { description: res.error });
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
          <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 gap-2">
            <Plus className="size-4" />
            Thêm Phòng
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-white border-slate-200">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="flex items-center gap-2 text-slate-900 text-lg">
              <DoorClosed className="size-5 text-blue-600" />
              {isEdit ? "Chỉnh sửa Phòng" : "Thêm Phòng mới"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Nhập mã phòng, tầng, diện tích và giá thuê cơ bản
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Thuộc Tòa nhà <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={formData.buildingId}
                onValueChange={(val) => setFormData({ ...formData, buildingId: val })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn tòa nhà..." />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.buildingId && <p className="text-xs text-rose-500">{errors.buildingId}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="r-number" className="text-xs font-semibold text-slate-700">
                  Mã phòng <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="r-number"
                  placeholder="VD: P101, A2-03"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  className={errors.roomNumber ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                />
                {errors.roomNumber && <p className="text-xs text-rose-500">{errors.roomNumber}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="r-floor" className="text-xs font-semibold text-slate-700">
                  Tầng <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="r-floor"
                  type="number"
                  min={1}
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="r-price" className="text-xs font-semibold text-slate-700">
                  Giá thuê (VNĐ/tháng)
                </Label>
                <Input
                  id="r-price"
                  type="number"
                  min={0}
                  step={100000}
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: parseInt(e.target.value) || 0 })}
                />
                <p className="text-[11px] text-slate-500">
                  {formData.basePrice.toLocaleString("vi-VN")} đ/tháng
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="r-area" className="text-xs font-semibold text-slate-700">
                  Diện tích (m²)
                </Label>
                <Input
                  id="r-area"
                  type="number"
                  min={1}
                  step={0.5}
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Trạng thái phòng</Label>
              <Select
                value={formData.status}
                onValueChange={(val: any) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Còn trống (AVAILABLE)</SelectItem>
                  <SelectItem value="RENTED">Đã cho thuê (RENTED)</SelectItem>
                  <SelectItem value="MAINTENANCE">Đang bảo trì (MAINTENANCE)</SelectItem>
                </SelectContent>
              </Select>
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
              {isEdit ? "Lưu thay đổi" : "Tạo phòng"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
