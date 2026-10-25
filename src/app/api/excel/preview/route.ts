import { NextRequest, NextResponse } from "next/server";
import { parseTenantExcel } from "@/lib/excel-parser";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Vui lòng chọn file Excel (.xlsx) để tải lên" },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return NextResponse.json(
        { error: "Định dạng file không hợp lệ. Chỉ chấp nhận file Excel (.xlsx, .xls)" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsedResult = await parseTenantExcel(buffer);

    return NextResponse.json({
      success: true,
      filename: file.name,
      ...parsedResult,
    });
  } catch (error: any) {
    console.error("Lỗi khi đọc file Excel:", error);
    return NextResponse.json(
      {
        error: error.message || "Không thể phân tích dữ liệu từ file Excel đã tải lên",
      },
      { status: 500 }
    );
  }
}
