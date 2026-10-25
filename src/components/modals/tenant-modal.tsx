"use client";

import { useState, useMemo } from "react";
import { UserPlus, Loader2, Calendar } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { createTenant, updateTenant } from "@/lib/actions";
import { phoneRegex, idCardRegex } from "@/lib/validations";

interface TenantModalProps {
  buildings: Array<{ id: string; name: string }>;
  rooms: Array<{
    id: string;
    buildingId: string;
    roomNumber: string;
    floor: number;
    status: string;
  }>;
  tenant?: {
    id: string;
    roomId: string;
    fullName: string;
    phone: string;
    idCard: string;
    homeTown: string | null;
    startDate: string | Date;
    endDate?: string | Date | null;
    isContractHolder: boolean;
    room?: {
      id: string;
      buildingId: string;
      roomNumber: string;
    };
  };
  defaultRoomId?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function TenantModal({
  buildings,
  rooms,
  tenant,
  defaultRoomId,
  trigger,
  onSuccess,
}: TenantModalProps) {
  const isEdit = !!tenant;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Format date helper
  const toDateString = (d?: string | Date | null) => {
    if (!d) return "";
    const dateObj = typeof d === "string" ? new Date(d) : d;
    if (isNaN(dateObj.getTime())) return "";
    return dateObj.toISOString().split("T")[0];
  };

  // Xác định building ban đầu dựa trên roomId nếu có
  const initialRoomId = tenant?.roomId ?? defaultRoomId ?? "";
  const initialBuildingId = useMemo(() => {
    if (tenant?.room?.buildingId) return tenant.room.buildingId;
    if (initialRoomId) {
      const found = rooms.find((r) => r.id === initialRoomId);
      if (found) return found.buildingId;
    }
    return buildings[0]?.id ?? "";
  }, [tenant, initialRoomId, rooms, buildings]);

  const [selectedBuildingId, setSelectedBuildingId] = useState(initialBuildingId);

  const [formData, setFormData] = useState({
    roomId: initialRoomId,
    fullName: tenant?.fullName ?? "",
    phone: tenant?.phone ?? "",
    idCard: tenant?.idCard ?? "",
    homeTown: tenant?.homeTown ?? "",
    startDate: toDateString(tenant?.startDate) || toDateString(new Date()),
    endDate: toDateString(tenant?.endDate),
    isContractHolder: tenant?.isContractHolder ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Lọc phòng thuộc tòa nhà được chọn
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => r.buildingId === selectedBuildingId);
  }, [rooms, selectedBuildingId]);

  const handleOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      const bId = tenant?.room?.buildingId || initialBuildingId;
      setSelectedBuildingId(bId);
      setFormData({
        roomId: tenant?.roomId ?? defaultRoomId ?? "",
        fullName: tenant?.fullName ?? "",
        phone: tenant?.phone ?? "",
        idCard: tenant?.idCard ?? "",
        homeTown: tenant?.homeTown ?? "",
        startDate: toDateString(tenant?.startDate) || toDateString(new Date()),
        endDate: toDateString(tenant?.endDate),
        isContractHolder: tenant?.isContractHolder ?? true,
      });
      setErrors({});
    }
  };

  const handleBuildingChange = (bId: string) => {
    setSelectedBuildingId(bId);
    const roomsInB = rooms.filter((r) => r.buildingId === bId);
    // Nếu phòng hiện tại không thuộc tòa này, chọn phòng đầu tiên của tòa mới
    if (!roomsInB.some((r) => r.id === formData.roomId)) {
      setFormData((prev) => ({
        ...prev,
        roomId: roomsInB[0]?.id ?? "",
      }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.roomId) newErrors.roomId = "Vui lòng chọn phòng thuê";
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      newErrors.fullName = "Họ và tên khách phải có từ 2 ký tự trở lên";
    }

    const cleanPhone = formData.phone.trim();
    if (!phoneRegex.test(cleanPhone)) {
      newErrors.phone = "Số điện thoại phải gồm đúng 10 số và bắt đầu bằng số 0 (VD: 0912345678)";
    }

    const cleanIdCard = formData.idCard.trim();
    if (!idCardRegex.test(cleanIdCard)) {
      newErrors.idCard = "Số CCCD phải gồm đúng 12 chữ số (VD: 001200001234)";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Vui lòng chọn ngày bắt đầu thuê";
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        newErrors.endDate = "Ngày kết thúc hợp đồng phải sau ngày bắt đầu thuê";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const res = isEdit
        ? await updateTenant(tenant.id, formData)
        : await createTenant(formData);

      if (res.success) {
        toast.success(isEdit ? "Cập nhật khách thuê thành công" : "Thêm khách thuê thành công");
        setOpen(false);
        onSuccess?.();
      } else {
        toast.error("Không thể lưu khách thuê", { description: res.error });
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
            <UserPlus className="size-4" />
            Thêm Khách thuê
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg bg-white border-slate-200 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="flex items-center gap-2 text-slate-900 text-lg">
              <UserPlus className="size-5 text-blue-600" />
              {isEdit ? "Chỉnh sửa Thông tin Khách thuê" : "Thêm Khách thuê mới"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Chọn tòa nhà và phòng để gắn khách thuê tương ứng vào hợp đồng
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Hàng 1: Chọn Tòa nhà -> Load danh sách Phòng */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  1. Chọn Tòa nhà <span className="text-rose-500">*</span>
                </Label>
                <Select value={selectedBuildingId} onValueChange={handleBuildingChange}>
                  <SelectTrigger className="w-full bg-white">
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
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  2. Chọn Phòng <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={formData.roomId}
                  onValueChange={(val) => setFormData({ ...formData, roomId: val })}
                  disabled={filteredRooms.length === 0}
                >
                  <SelectTrigger
                    className={`w-full bg-white ${
                      errors.roomId ? "border-rose-500 focus-visible:ring-rose-500" : ""
                    }`}
                  >
                    <SelectValue
                      placeholder={
                        filteredRooms.length === 0 ? "Tòa chưa có phòng" : "Chọn phòng..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredRooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        Phòng {r.roomNumber} (Tầng {r.floor}
                        {r.status === "RENTED" ? " - Đang thuê" : " - Trống"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.roomId && <p className="text-xs text-rose-500">{errors.roomId}</p>}
              </div>
            </div>

            {/* Hàng 2: Họ và tên */}
            <div className="space-y-1.5">
              <Label htmlFor="t-name" className="text-xs font-semibold text-slate-700">
                Họ và tên khách thuê <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="t-name"
                placeholder="VD: Nguyễn Văn An"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={errors.fullName ? "border-rose-500 focus-visible:ring-rose-500" : ""}
              />
              {errors.fullName && <p className="text-xs text-rose-500">{errors.fullName}</p>}
            </div>

            {/* Hàng 3: SĐT 10 số & CCCD 12 số */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="t-phone" className="text-xs font-semibold text-slate-700">
                  Số điện thoại (10 số) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="t-phone"
                  placeholder="0912345678"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\s+/g, "") })}
                  className={errors.phone ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                />
                {errors.phone ? (
                  <p className="text-xs text-rose-500">{errors.phone}</p>
                ) : (
                  <p className="text-[11px] text-slate-500">Bắt đầu bằng số 0, đủ 10 chữ số</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="t-idcard" className="text-xs font-semibold text-slate-700">
                  Số CCCD (12 số) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="t-idcard"
                  placeholder="001200001234"
                  maxLength={12}
                  value={formData.idCard}
                  onChange={(e) => setFormData({ ...formData, idCard: e.target.value.replace(/\s+/g, "") })}
                  className={errors.idCard ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                />
                {errors.idCard ? (
                  <p className="text-xs text-rose-500">{errors.idCard}</p>
                ) : (
                  <p className="text-[11px] text-slate-500">Chuẩn căn cước 12 chữ số</p>
                )}
              </div>
            </div>

            {/* Hàng 4: Quê quán */}
            <div className="space-y-1.5">
              <Label htmlFor="t-hometown" className="text-xs font-semibold text-slate-700">
                Quê quán / Thường trú
              </Label>
              <Input
                id="t-hometown"
                placeholder="VD: Hà Nội, Nam Định, Thái Bình..."
                value={formData.homeTown}
                onChange={(e) => setFormData({ ...formData, homeTown: e.target.value })}
              />
            </div>

            {/* Hàng 5: Ngày bắt đầu thuê & Ngày kết thúc hợp đồng */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="t-startdate" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Calendar className="size-3.5 text-blue-600" />
                  Ngày bắt đầu thuê <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="t-startdate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className={errors.startDate ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                />
                {errors.startDate && <p className="text-xs text-rose-500">{errors.startDate}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="t-enddate" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Calendar className="size-3.5 text-slate-400" />
                  Ngày kết thúc hợp đồng
                </Label>
                <Input
                  id="t-enddate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className={errors.endDate ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                />
                {errors.endDate && <p className="text-xs text-rose-500">{errors.endDate}</p>}
              </div>
            </div>

            {/* Hàng 6: Checkbox là chủ hợp đồng */}
            <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
              <Checkbox
                id="t-holder"
                checked={formData.isContractHolder}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isContractHolder: !!checked })
                }
              />
              <Label
                htmlFor="t-holder"
                className="text-xs font-medium text-slate-700 cursor-pointer select-none"
              >
                Là người đứng tên hợp đồng thuê phòng (Chủ hợp đồng)
              </Label>
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
              {isEdit ? "Lưu thay đổi" : "Thêm khách thuê"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
