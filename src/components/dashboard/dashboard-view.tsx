"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  DoorClosed,
  Users,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Home,
  ShieldAlert,
  Percent,
  Calendar,
  Layers,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MaskedText } from "@/components/common/masked-text";
import { TemplateDownloadButton } from "@/components/excel/template-download-button";
import { ExcelImportModal } from "@/components/modals/excel-import-modal";
import { BuildingModal } from "@/components/modals/building-modal";
import { RoomModal } from "@/components/modals/room-modal";
import { TenantModal } from "@/components/modals/tenant-modal";
import { deleteBuilding, deleteRoom, deleteTenant } from "@/lib/actions";
import { toast } from "sonner";

interface DashboardViewProps {
  initialData: {
    stats: {
      totalBuildings: number;
      totalRooms: number;
      availableRooms: number;
      rentedRooms: number;
      maintenanceRooms: number;
      totalTenants: number;
      totalContractHolders: number;
    };
    buildings: any[];
    rooms: any[];
    tenants: any[];
  };
}

export function DashboardView({ initialData }: DashboardViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { stats, buildings, rooms, tenants } = initialData;

  // Search & Filter cho tab Khách thuê
  const [tenantSearch, setTenantSearch] = useState("");
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<string>("ALL");

  // Search & Filter cho tab Phòng
  const [roomBuildingFilter, setRoomBuildingFilter] = useState<string>("ALL");
  const [roomStatusFilter, setRoomStatusFilter] = useState<string>("ALL");

  const refreshData = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  // Tính tỷ lệ lấp đầy
  const occupancyRate =
    stats.totalRooms > 0 ? Math.round((stats.rentedRooms / stats.totalRooms) * 100) : 0;

  // Lọc danh sách khách thuê
  const filteredTenants = tenants.filter((t) => {
    const matchSearch =
      t.fullName.toLowerCase().includes(tenantSearch.toLowerCase()) ||
      t.phone.includes(tenantSearch) ||
      t.idCard.includes(tenantSearch) ||
      t.room.roomNumber.toLowerCase().includes(tenantSearch.toLowerCase());

    const matchBuilding =
      selectedBuildingFilter === "ALL" || t.room.buildingId === selectedBuildingFilter;

    return matchSearch && matchBuilding;
  });

  // Lọc danh sách phòng
  const filteredRooms = rooms.filter((r) => {
    const matchBuilding =
      roomBuildingFilter === "ALL" || r.buildingId === roomBuildingFilter;
    const matchStatus = roomStatusFilter === "ALL" || r.status === roomStatusFilter;
    return matchBuilding && matchStatus;
  });

  // Xóa Tòa nhà
  const handleDeleteBuilding = async (id: string) => {
    const res = await deleteBuilding(id);
    if (res.success) {
      toast.success("Đã xóa tòa nhà thành công");
      refreshData();
    } else {
      toast.error("Không thể xóa", { description: res.error });
    }
  };

  // Xóa Phòng
  const handleDeleteRoom = async (id: string) => {
    const res = await deleteRoom(id);
    if (res.success) {
      toast.success("Đã xóa phòng thành công");
      refreshData();
    } else {
      toast.error("Không thể xóa", { description: res.error });
    }
  };

  // Xóa Khách thuê
  const handleDeleteTenant = async (id: string) => {
    const res = await deleteTenant(id);
    if (res.success) {
      toast.success("Đã xóa khách thuê thành công");
      refreshData();
    } else {
      toast.error("Không thể xóa", { description: res.error });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-2xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <Building2 className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                  Nhà Trọ Master
                </span>
                <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  Light Mode
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Hệ thống Quản lý Nhà trọ &amp; Chung cư mini • Supabase PostgreSQL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isPending}
              className="border-slate-200 text-slate-600 hover:bg-slate-100 gap-1.5 h-9"
            >
              <RefreshCw className={`size-3.5 ${isPending ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </Button>

            <ExcelImportModal onSuccess={refreshData} />
            <TenantModal
              buildings={buildings}
              rooms={rooms}
              onSuccess={refreshData}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* KPI Cards */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Card className="border-slate-200/80 bg-white shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tòa Nhà
              </CardTitle>
              <Building2 className="size-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.totalBuildings}</div>
              <p className="text-xs text-slate-500 mt-1">Đang hoạt động</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tổng Phòng
              </CardTitle>
              <DoorClosed className="size-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.totalRooms}</div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                <span className="text-emerald-700 font-medium">{stats.rentedRooms} đã thuê</span>
                <span className="text-slate-300">•</span>
                <span className="text-blue-600 font-medium">{stats.availableRooms} trống</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tỷ Lệ Lấp Đầy
              </CardTitle>
              <Percent className="size-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700">{occupancyRate}%</div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Khách Thuê
              </CardTitle>
              <Users className="size-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.totalTenants}</div>
              <p className="text-xs text-slate-500 mt-1">
                {stats.totalContractHolders} người đứng tên HĐ
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Action Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-blue-200/70 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/40 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Thao tác Nhanh với Excel &amp; Thêm Dữ Liệu
              </h2>
              <p className="text-xs text-slate-600">
                Tải file mẫu 9 cột (có ngày kết thúc HĐ), xem trước dữ liệu hoặc nhập liệu thủ công
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <TemplateDownloadButton variant="outline" size="sm" />
            <BuildingModal onSuccess={refreshData} />
            <RoomModal buildings={buildings} onSuccess={refreshData} />
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="tenants" className="space-y-4">
          <TabsList className="bg-slate-200/70 p-1 border border-slate-200 rounded-xl">
            <TabsTrigger
              value="tenants"
              className="gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-2xs rounded-lg text-xs sm:text-sm font-semibold"
            >
              <Users className="size-4" />
              Khách Thuê ({stats.totalTenants})
            </TabsTrigger>
            <TabsTrigger
              value="rooms"
              className="gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-2xs rounded-lg text-xs sm:text-sm font-semibold"
            >
              <DoorClosed className="size-4" />
              Tòa Nhà &amp; Phòng ({stats.totalRooms})
            </TabsTrigger>
            <TabsTrigger
              value="guide"
              className="gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-2xs rounded-lg text-xs sm:text-sm font-semibold"
            >
              <FileSpreadsheet className="size-4" />
              File Mẫu &amp; Bảo Mật
            </TabsTrigger>
          </TabsList>

          {/* ================================================================= */}
          {/* TAB 1: QUẢN LÝ KHÁCH THUÊ (BẢO MẬT CHE CCCD & SĐT) */}
          {/* ================================================================= */}
          <TabsContent value="tenants" className="space-y-4">
            <Card className="border-slate-200 bg-white shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Users className="size-5 text-blue-600" />
                      Danh Sách Khách Thuê Phòng
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Thông tin CCCD và SĐT mặc định được che để bảo mật. Bấm biểu tượng con mắt để xem chi tiết.
                    </CardDescription>
                  </div>

                  {/* Thanh tìm kiếm & bộ lọc */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-full sm:w-56">
                      <Search className="absolute left-2.5 top-2.5 size-4 text-slate-400" />
                      <Input
                        placeholder="Tìm tên, SĐT, CCCD, phòng..."
                        value={tenantSearch}
                        onChange={(e) => setTenantSearch(e.target.value)}
                        className="pl-8 text-xs bg-slate-50 border-slate-200 h-9"
                      />
                    </div>

                    <select
                      value={selectedBuildingFilter}
                      onChange={(e) => setSelectedBuildingFilter(e.target.value)}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 h-9 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="ALL">Tất cả tòa nhà</option>
                      {buildings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>

                    <TenantModal
                      buildings={buildings}
                      rooms={rooms}
                      onSuccess={refreshData}
                      trigger={
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-9">
                          <Plus className="size-3.5" />
                          Thêm khách
                        </Button>
                      }
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/80">
                      <TableRow>
                        <TableHead className="font-bold text-slate-700">Khách thuê</TableHead>
                        <TableHead className="font-bold text-slate-700">Tòa &amp; Phòng</TableHead>
                        <TableHead className="font-bold text-slate-700">Số Điện Thoại (Che)</TableHead>
                        <TableHead className="font-bold text-slate-700">Số CCCD (Che)</TableHead>
                        <TableHead className="font-bold text-slate-700">Quê quán</TableHead>
                        <TableHead className="font-bold text-slate-700">Hợp đồng thuê</TableHead>
                        <TableHead className="font-bold text-slate-700 text-center">Vai trò</TableHead>
                        <TableHead className="font-bold text-slate-700 text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTenants.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                            <Users className="size-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-slate-700">Chưa có khách thuê nào</p>
                            <p className="text-xs text-slate-400 mt-1">
                              Bấm "Nhập Excel" hoặc "Thêm khách thuê" để bắt đầu
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTenants.map((t) => (
                          <TableRow key={t.id} className="hover:bg-slate-50/70 transition-colors">
                            <TableCell>
                              <div className="font-bold text-slate-900 text-sm">{t.fullName}</div>
                              <span className="text-[11px] text-slate-400">
                                ID: {t.id.slice(-6)}
                              </span>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs">
                                  {t.room.roomNumber}
                                </span>
                                <span className="text-xs text-slate-600">
                                  {t.room.building.name}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell>
                              {/* SĐT che: 038****123 */}
                              <MaskedText value={t.phone} type="phone" />
                            </TableCell>

                            <TableCell>
                              {/* CCCD che: 001****890 */}
                              <MaskedText value={t.idCard} type="idCard" />
                            </TableCell>

                            <TableCell className="text-xs text-slate-600">
                              {t.homeTown || <span className="text-slate-300 italic">—</span>}
                            </TableCell>

                            <TableCell>
                              <div className="text-xs text-slate-700">
                                Từ:{" "}
                                <span className="font-medium">
                                  {new Date(t.startDate).toLocaleDateString("vi-VN")}
                                </span>
                              </div>
                              {t.endDate && (
                                <div className="text-[11px] text-slate-500">
                                  Đến:{" "}
                                  <span className="font-medium">
                                    {new Date(t.endDate).toLocaleDateString("vi-VN")}
                                  </span>
                                </div>
                              )}
                            </TableCell>

                            <TableCell className="text-center">
                              {t.isContractHolder ? (
                                <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-800 text-[11px] border border-emerald-200 font-semibold">
                                  Chủ HĐ
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-slate-500 text-[11px]">
                                  Ở cùng
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <TenantModal
                                  buildings={buildings}
                                  rooms={rooms}
                                  tenant={t}
                                  onSuccess={refreshData}
                                  trigger={
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="size-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                    >
                                      <Edit2 className="size-3.5" />
                                    </Button>
                                  }
                                />

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="size-8 p-0 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-white border-slate-200">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-slate-900">
                                        Xác nhận xóa khách thuê?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-slate-500">
                                        Bạn có chắc chắn muốn xóa khách <strong>{t.fullName}</strong> khỏi phòng{" "}
                                        <strong>{t.room.roomNumber}</strong>?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="border-slate-200">
                                        Hủy
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteTenant(t.id)}
                                        className="bg-rose-600 hover:bg-rose-700 text-white"
                                      >
                                        Xóa khách thuê
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================================================================= */}
          {/* TAB 2: QUẢN LÝ TÒA NHÀ & PHÒNG */}
          {/* ================================================================= */}
          <TabsContent value="rooms" className="space-y-6">
            {/* Danh sách Tòa nhà */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="size-5 text-blue-600" />
                  Danh Sách Tòa Nhà ({buildings.length})
                </h3>
                <BuildingModal onSuccess={refreshData} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {buildings.map((b) => (
                  <Card key={b.id} className="border-slate-200 bg-white shadow-2xs hover:border-blue-300 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base text-slate-900 font-bold">{b.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 text-xs">
                            <MapPin className="size-3.5 text-slate-400 shrink-0" />
                            {b.address}
                          </CardDescription>
                        </div>

                        <div className="flex items-center gap-1">
                          <BuildingModal
                            building={b}
                            onSuccess={refreshData}
                            trigger={
                              <Button variant="ghost" size="sm" className="size-8 p-0 text-slate-500 hover:text-blue-600">
                                <Edit2 className="size-3.5" />
                              </Button>
                            }
                          />

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="size-8 p-0 text-slate-500 hover:text-rose-600">
                                <Trash2 className="size-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white border-slate-200">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xóa tòa nhà {b.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Chỉ xóa được tòa nhà khi không còn phòng nào bên trong.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteBuilding(b.id)}
                                  className="bg-rose-600 hover:bg-rose-700 text-white"
                                >
                                  Xác nhận xóa
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="text-xs text-slate-600 space-y-2 border-t border-slate-100 pt-3">
                      <div className="flex justify-between">
                        <span>Số tầng:</span>
                        <strong className="text-slate-900">{b.totalFloors} tầng</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Tổng số phòng:</span>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-semibold">
                          {b._count?.rooms ?? 0} phòng
                        </Badge>
                      </div>
                      {b.note && (
                        <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-50">
                          Ghi chú: {b.note}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Danh sách Phòng */}
            <Card className="border-slate-200 bg-white shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <DoorClosed className="size-5 text-blue-600" />
                      Chi Tiết Toàn Bộ Phòng Thuê ({filteredRooms.length})
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Quản lý mã phòng, tầng, giá thuê, diện tích và trạng thái hoạt động
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={roomBuildingFilter}
                      onChange={(e) => setRoomBuildingFilter(e.target.value)}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 h-9"
                    >
                      <option value="ALL">Tất cả tòa nhà</option>
                      {buildings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={roomStatusFilter}
                      onChange={(e) => setRoomStatusFilter(e.target.value)}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 h-9"
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      <option value="AVAILABLE">Còn trống</option>
                      <option value="RENTED">Đã cho thuê</option>
                      <option value="MAINTENANCE">Bảo trì</option>
                    </select>

                    <RoomModal buildings={buildings} onSuccess={refreshData} />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/80">
                      <TableRow>
                        <TableHead className="font-bold text-slate-700">Mã phòng</TableHead>
                        <TableHead className="font-bold text-slate-700">Tòa nhà</TableHead>
                        <TableHead className="font-bold text-slate-700 text-center">Tầng</TableHead>
                        <TableHead className="font-bold text-slate-700">Giá thuê</TableHead>
                        <TableHead className="font-bold text-slate-700 text-center">Diện tích</TableHead>
                        <TableHead className="font-bold text-slate-700 text-center">Khách ở</TableHead>
                        <TableHead className="font-bold text-slate-700 text-center">Trạng thái</TableHead>
                        <TableHead className="font-bold text-slate-700 text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRooms.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-10 text-slate-500">
                            Không tìm thấy phòng nào phù hợp
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRooms.map((r) => (
                          <TableRow key={r.id} className="hover:bg-slate-50/70">
                            <TableCell>
                              <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded text-xs">
                                {r.roomNumber}
                              </span>
                            </TableCell>

                            <TableCell className="text-xs font-medium text-slate-800">
                              {r.building.name}
                            </TableCell>

                            <TableCell className="text-center text-xs text-slate-600">
                              Tầng {r.floor}
                            </TableCell>

                            <TableCell className="text-xs font-semibold text-slate-900">
                              {r.basePrice.toLocaleString("vi-VN")} đ/tháng
                            </TableCell>

                            <TableCell className="text-center text-xs text-slate-600">
                              {r.area} m²
                            </TableCell>

                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  r._count?.tenants > 0
                                    ? "border-blue-200 bg-blue-50 text-blue-700"
                                    : "text-slate-400"
                                }`}
                              >
                                {r._count?.tenants ?? 0} người
                              </Badge>
                            </TableCell>

                            <TableCell className="text-center">
                              {r.status === "AVAILABLE" && (
                                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 text-xs">
                                  Còn trống
                                </Badge>
                              )}
                              {r.status === "RENTED" && (
                                <Badge className="bg-blue-600 text-white hover:bg-blue-600 text-xs">
                                  Đã cho thuê
                                </Badge>
                              )}
                              {r.status === "MAINTENANCE" && (
                                <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50 text-xs">
                                  Đang bảo trì
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <RoomModal
                                  buildings={buildings}
                                  room={r}
                                  onSuccess={refreshData}
                                  trigger={
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="size-8 p-0 text-slate-500 hover:text-blue-600"
                                    >
                                      <Edit2 className="size-3.5" />
                                    </Button>
                                  }
                                />

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="size-8 p-0 text-slate-500 hover:text-rose-600"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-white border-slate-200">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Xóa phòng {r.roomNumber}?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Chỉ xóa được khi không có khách thuê trong phòng.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteRoom(r.id)}
                                        className="bg-rose-600 hover:bg-rose-700 text-white"
                                      >
                                        Xác nhận xóa
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================================================================= */}
          {/* TAB 3: FILE MẪU & HƯỚNG DẪN */}
          {/* ================================================================= */}
          <TabsContent value="guide" className="space-y-4">
            <Card className="border-slate-200 bg-white shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <FileSpreadsheet className="size-5 text-blue-600" />
                      Quy Định 9 Cột Trong File Excel Mẫu
                    </CardTitle>
                    <CardDescription className="text-xs">
                      File mẫu đã bổ sung cột 'Ngày kết thúc hợp đồng' theo yêu cầu của bạn
                    </CardDescription>
                  </div>
                  <TemplateDownloadButton />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="w-12 text-center font-bold text-slate-700">STT</TableHead>
                        <TableHead className="font-bold text-slate-700">Tên Cột</TableHead>
                        <TableHead className="font-bold text-slate-700">Kiểu Dữ Liệu</TableHead>
                        <TableHead className="font-bold text-slate-700">Bắt Buộc</TableHead>
                        <TableHead className="font-bold text-slate-700">Quy Chuẩn &amp; Ghi Chú</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { no: 1, name: "Tên tòa nhà", type: "Văn bản", req: true, note: "Tên tòa nhà. Hệ thống tự động tạo nếu chưa có." },
                        { no: 2, name: "Mã phòng", type: "Văn bản", req: true, note: "Mã phòng (P101, P202...). Tự động tạo và cập nhật ĐÃ CHO THUÊ." },
                        { no: 3, name: "Họ và tên khách", type: "Văn bản", req: true, note: "Họ tên đầy đủ người thuê phòng." },
                        { no: 4, name: "Số điện thoại", type: "Text (10 số)", req: true, note: "Đúng 10 chữ số, bắt đầu bằng số 0 (không chứa dấu cách)." },
                        { no: 5, name: "Số CCCD", type: "Text (12 số)", req: true, note: "Đúng 12 chữ số theo quy chuẩn quốc gia. Chống trùng lặp." },
                        { no: 6, name: "Quê quán", type: "Văn bản", req: false, note: "Tỉnh/thành phố hoặc quê quán thường trú." },
                        { no: 7, name: "Ngày bắt đầu thuê", type: "Date/Text", req: true, note: "Định dạng YYYY-MM-DD (VD: 2026-03-01) hoặc DD/MM/YYYY." },
                        { no: 8, name: "Ngày kết thúc hợp đồng", type: "Date/Text", req: false, note: "Định dạng YYYY-MM-DD (VD: 2027-03-01). Để trống nếu chưa xác định." },
                        { no: 9, name: "Là chủ hợp đồng (Có/Không)", type: "Dropdown", req: true, note: "Chọn 'Có' hoặc 'Không' từ danh sách thả xuống có sẵn." },
                      ].map((item) => (
                        <TableRow key={item.no}>
                          <TableCell className="text-center font-mono text-slate-500 font-semibold">{item.no}</TableCell>
                          <TableCell className="font-bold text-slate-900 text-xs">{item.name}</TableCell>
                          <TableCell>
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-700">
                              {item.type}
                            </span>
                          </TableCell>
                          <TableCell>
                            {item.req ? (
                              <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-[11px]">
                                Bắt buộc
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-500 text-[11px]">
                                Tùy chọn
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">{item.note}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
