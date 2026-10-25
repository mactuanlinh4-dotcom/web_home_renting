"use client";

import { useState, useRef } from "react";
import {
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  Filter,
  ArrowRight,
  Database,
  Info,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { importTenantsFromExcelAction } from "@/lib/actions";
import type { ExcelRowValidationResult } from "@/lib/validations";

interface ExcelImportModalProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function ExcelImportModal({ onSuccess, trigger }: ExcelImportModalProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Dữ liệu parse từ file
  const [previewData, setPreviewData] = useState<{
    filename: string;
    rows: ExcelRowValidationResult[];
    totalRows: number;
    validCount: number;
    invalidCount: number;
  } | null>(null);

  // Bộ lọc xem bảng preview: 'all' | 'valid' | 'invalid'
  const [filterView, setFilterView] = useState<"all" | "valid" | "invalid">("all");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setPreviewData(null);
    setIsParsing(false);
    setIsImporting(false);
    setFilterView("all");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetState();
    }
  };

  const handleFileSelected = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
      toast.error("Vui lòng chọn file Excel có định dạng .xlsx hoặc .xls");
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/excel/preview", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không thể phân tích dữ liệu file");
      }

      setPreviewData(data);
      if (data.invalidCount > 0) {
        toast.warning(
          `Tìm thấy ${data.invalidCount} dòng có thông tin chưa đúng quy cách`,
          {
            description: "Dòng lỗi được đánh dấu màu đỏ kèm chi tiết lý do.",
          }
        );
      } else {
        toast.success(`Toàn bộ ${data.validCount} dòng dữ liệu đều hợp lệ!`);
      }
    } catch (err: any) {
      toast.error("Lỗi đọc file", { description: err.message });
      resetState();
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData) return;

    // Lọc ra các dòng hợp lệ để lưu
    const validRowsToImport = previewData.rows
      .filter((r) => r.isValid)
      .map((r) => r.data);

    if (validRowsToImport.length === 0) {
      toast.error("Không có dòng dữ liệu hợp lệ nào để lưu vào hệ thống");
      return;
    }

    try {
      setIsImporting(true);
      const res = await importTenantsFromExcelAction(validRowsToImport);

      if (res.success) {
        toast.success("Import dữ liệu thành công!", {
          description: res.message,
        });
        setOpen(false);
        resetState();
        onSuccess?.();
      } else {
        toast.error("Lỗi khi lưu dữ liệu", {
          description: res.error,
        });
      }
    } catch (error: any) {
      toast.error("Lỗi hệ thống", { description: error.message });
    } finally {
      setIsImporting(false);
    }
  };

  // Lọc danh sách rows hiển thị theo filterView
  const displayedRows = previewData
    ? previewData.rows.filter((r) => {
        if (filterView === "valid") return r.isValid;
        if (filterView === "invalid") return !r.isValid;
        return true;
      })
    : [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            id="btn-open-excel-import"
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs"
          >
            <Upload className="size-4" />
            Nhập Excel (.xlsx)
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl bg-white border-slate-200 max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <FileSpreadsheet className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Nhập Dữ Liệu Khách Thuê Từ File Excel
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Tải file .xlsx, kiểm tra trước dữ liệu (Data Preview) và tự động map vào Tòa nhà &amp; Phòng
                </DialogDescription>
              </div>
            </div>

            <a
              href="/api/excel/template"
              download="mau_nhap_khach_thue.xlsx"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              <Download className="size-3.5" />
              Tải file mẫu .xlsx
            </a>
          </div>
        </DialogHeader>

        {/* Nội dung chính */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Màn hình Upload khi chưa chọn file */}
          {!previewData && (
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer ${
                  dragActive
                    ? "border-blue-600 bg-blue-50/50 scale-[0.99]"
                    : "border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-blue-400"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelected(e.target.files[0]);
                    }
                  }}
                />

                {isParsing ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="size-10 animate-spin text-blue-600" />
                    <p className="text-sm font-semibold text-slate-800">
                      Đang đọc và kiểm tra dữ liệu qua Zod...
                    </p>
                    <p className="text-xs text-slate-500">
                      Kiểm tra định dạng SĐT 10 số, CCCD 12 số, ngày tháng...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-xs border border-slate-200 mb-3 text-emerald-600">
                      <FileSpreadsheet className="size-7" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800 mb-1">
                      Kéo thả file Excel (.xlsx) vào đây, hoặc{" "}
                      <span className="text-blue-600 hover:underline">bấm để chọn file</span>
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Đảm bảo file theo đúng định dạng các cột của file mẫu. Hệ thống sẽ tự động ghép
                      khách vào đúng Tòa nhà và Phòng.
                    </p>
                  </>
                )}
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-blue-800">
                  <Info className="size-4 text-blue-600" />
                  Quy tắc kiểm tra tự động khi nhập:
                </div>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>
                    <strong className="text-slate-800">Số điện thoại:</strong> Đúng 10 chữ số, bắt đầu bằng số 0.
                  </li>
                  <li>
                    <strong className="text-slate-800">Số CCCD:</strong> Đúng 12 chữ số theo quy chuẩn quốc gia.
                  </li>
                  <li>
                    <strong className="text-slate-800">Tự động map:</strong> Nếu Tòa nhà hoặc Phòng chưa có, hệ thống sẽ tự động tạo mới và cập nhật trạng thái phòng thành ĐÃ CHO THUÊ.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Màn hình Data Preview khi đã đọc file */}
          {previewData && (
            <div className="space-y-4">
              {/* Thanh thống kê preview */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Tệp:</span>
                  <Badge variant="outline" className="bg-white font-mono text-xs">
                    {previewData.filename}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetState}
                    className="text-xs text-slate-500 hover:text-slate-800 h-7 px-2"
                  >
                    Đổi file khác
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setFilterView("all")}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                        filterView === "all"
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Tất cả ({previewData.totalRows})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterView("valid")}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                        filterView === "valid"
                          ? "bg-emerald-600 text-white"
                          : "text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      Hợp lệ ({previewData.validCount})
                    </button>
                    {previewData.invalidCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilterView("invalid")}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                          filterView === "invalid"
                            ? "bg-rose-600 text-white"
                            : "text-rose-700 hover:bg-rose-50"
                        }`}
                      >
                        Có lỗi ({previewData.invalidCount})
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bảng Data Preview */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="max-h-80 overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-100 z-10">
                      <TableRow>
                        <TableHead className="w-12 text-center font-bold text-slate-700">Dòng</TableHead>
                        <TableHead className="font-bold text-slate-700">Tòa nhà</TableHead>
                        <TableHead className="text-center font-bold text-slate-700">Mã phòng</TableHead>
                        <TableHead className="font-bold text-slate-700">Họ và tên</TableHead>
                        <TableHead className="text-center font-bold text-slate-700">SĐT (10 số)</TableHead>
                        <TableHead className="text-center font-bold text-slate-700">CCCD (12 số)</TableHead>
                        <TableHead className="text-center font-bold text-slate-700">Bắt đầu</TableHead>
                        <TableHead className="text-center font-bold text-slate-700">Chủ HĐ</TableHead>
                        <TableHead className="text-center font-bold text-slate-700">Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-slate-500 text-xs">
                            Không có dòng nào phù hợp với bộ lọc
                          </TableCell>
                        </TableRow>
                      ) : (
                        displayedRows.map((row) => (
                          <TableRow
                            key={row.rowNumber}
                            className={`transition-colors ${
                              !row.isValid
                                ? "bg-rose-50/80 hover:bg-rose-100/60 border-l-4 border-l-rose-500"
                                : "hover:bg-slate-50/60"
                            }`}
                          >
                            <TableCell className="text-center font-mono text-xs text-slate-500 font-medium">
                              #{row.rowNumber}
                            </TableCell>
                            <TableCell className="font-medium text-slate-900 text-xs">
                              {row.data.buildingName || <span className="text-rose-500 italic">Trống</span>}
                            </TableCell>
                            <TableCell className="text-center font-mono font-bold text-blue-700 text-xs">
                              {row.data.roomNumber || <span className="text-rose-500 italic">Trống</span>}
                            </TableCell>
                            <TableCell className="text-xs text-slate-800">
                              {row.data.fullName || <span className="text-rose-500 italic">Trống</span>}
                            </TableCell>
                            <TableCell className="text-center font-mono text-xs text-slate-700">
                              <span className={row.data.phone.length !== 10 ? "text-rose-600 font-bold" : ""}>
                                {row.data.phone || "—"}
                              </span>
                            </TableCell>
                            <TableCell className="text-center font-mono text-xs text-slate-700">
                              <span className={row.data.idCard.length !== 12 ? "text-rose-600 font-bold" : ""}>
                                {row.data.idCard || "—"}
                              </span>
                            </TableCell>
                            <TableCell className="text-center text-xs text-slate-600">
                              {row.data.startDate || "—"}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${
                                  row.data.isContractHolder
                                    ? "border-emerald-300 text-emerald-800 bg-emerald-50"
                                    : "text-slate-500"
                                }`}
                              >
                                {row.data.isContractHolder ? "Có" : "Không"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                                  Hợp lệ
                                </span>
                              ) : (
                                <div className="inline-flex flex-col items-start text-[11px] text-rose-700 text-left">
                                  <span className="inline-flex items-center gap-1 font-bold">
                                    <XCircle className="size-3.5 text-rose-600 shrink-0" />
                                    Lỗi {row.errors.length} mục:
                                  </span>
                                  <ul className="list-disc pl-4 text-[10px] text-rose-600">
                                    {row.errors.map((err, i) => (
                                      <li key={i}>{err}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 shrink-0 flex sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-slate-500">
            {previewData ? (
              <span>
                Sẵn sàng import <strong>{previewData.validCount}</strong> / {previewData.totalRows} khách hợp lệ.
              </span>
            ) : (
              <span>Vui lòng tải file để bắt đầu kiểm tra dữ liệu.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isImporting}
              className="border-slate-200"
            >
              Hủy
            </Button>

            {previewData && (
              <Button
                type="button"
                onClick={handleConfirmImport}
                disabled={isImporting || previewData.validCount === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang lưu vào Supabase...
                  </>
                ) : (
                  <>
                    <Database className="size-4" />
                    Xác nhận Lưu {previewData.validCount} Khách vào Hệ thống
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
