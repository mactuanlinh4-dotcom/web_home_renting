import { NextResponse } from "next/server";
import { generateTenantExcelTemplate } from "@/lib/excel-template";

export async function GET() {
  try {
    const buffer = await generateTenantExcelTemplate();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="mau_nhap_khach_thue.xlsx"',
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Lỗi khi tạo file Excel mẫu:", error);
    return NextResponse.json(
      { error: "Không thể tạo file Excel mẫu" },
      { status: 500 }
    );
  }
}
