"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TemplateDownloadButtonProps {
  className?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
}

export function TemplateDownloadButton({
  className,
  variant = "default",
  size = "default",
}: TemplateDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/excel/template");

      if (!res.ok) {
        throw new Error("Không thể tải file mẫu");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mau_nhap_khach_thue.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Đã tải xuống file mẫu Excel thành công!", {
        description: "Bạn có thể mở bằng Microsoft Excel để kiểm tra cấu trúc.",
      });
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tải file mẫu", {
        description: "Vui lòng thử lại hoặc kiểm tra kết nối mạng.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      id="btn-download-excel-template"
      onClick={handleDownload}
      disabled={loading}
      variant={variant}
      size={size}
      className={`font-medium shadow-sm transition-all hover:shadow active:scale-[0.99] ${
        variant === "default"
          ? "bg-blue-600 hover:bg-blue-700 text-white"
          : "border-blue-200 text-blue-700 hover:bg-blue-50"
      } ${className ?? ""}`}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Đang tạo file mẫu...
        </>
      ) : (
        <>
          <FileSpreadsheet className="mr-2 size-4" />
          Tải file mẫu Excel (.xlsx)
        </>
      )}
    </Button>
  );
}
