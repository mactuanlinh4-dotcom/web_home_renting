import ExcelJS from "exceljs";

export const EXCEL_TEMPLATE_COLUMNS = [
  { header: "Tên tòa nhà", key: "buildingName", width: 22 },
  { header: "Mã phòng", key: "roomNumber", width: 16 },
  { header: "Họ và tên khách", key: "fullName", width: 24 },
  { header: "Số điện thoại", key: "phone", width: 18 },
  { header: "Số CCCD", key: "idCard", width: 22 },
  { header: "Quê quán", key: "homeTown", width: 20 },
  { header: "Ngày bắt đầu thuê", key: "startDate", width: 20 },
  { header: "Ngày kết thúc hợp đồng", key: "endDate", width: 24 },
  { header: "Là chủ hợp đồng (Có/Không)", key: "isContractHolder", width: 30 },
] as const;

export async function generateTenantExcelTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Hệ thống Quản lý Nhà trọ & Chung cư mini";
  workbook.lastModifiedBy = "Admin";
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet("Danh sách khách thuê", {
    views: [{ showGridLines: true }],
  });

  // Cấu hình các cột
  worksheet.columns = EXCEL_TEMPLATE_COLUMNS.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width,
  }));

  // Style cho header row
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" }, // Blue-600
    };
    cell.font = {
      name: "Segoe UI",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "medium", color: { argb: "FF1D4ED8" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  });

  // Thêm 2 dòng dữ liệu mẫu trực quan
  const sampleRows = [
    {
      buildingName: "Tòa A Sunshine",
      roomNumber: "P101",
      fullName: "Nguyễn Văn An",
      phone: "0912345678",
      idCard: "001200001234",
      homeTown: "Hà Nội",
      startDate: "2026-03-01",
      endDate: "2027-03-01",
      isContractHolder: "Có",
    },
    {
      buildingName: "Tòa A Sunshine",
      roomNumber: "P101",
      fullName: "Trần Thị Bình",
      phone: "0987654321",
      idCard: "001200005678",
      homeTown: "Hải Phòng",
      startDate: "2026-03-05",
      endDate: "2027-03-05",
      isContractHolder: "Không",
    },
  ];

  sampleRows.forEach((item) => {
    const row = worksheet.addRow(item);
    row.height = 24;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: "Segoe UI", size: 10 };
      cell.alignment = { vertical: "middle" };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      // Căn giữa cho một số cột định dạng cố định
      if ([2, 4, 5, 7, 8, 9].includes(colNumber)) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }

      // Đảm bảo Phone và CCCD không bị Excel tự ép thành số làm mất số 0 đầu
      if (colNumber === 4 || colNumber === 5) {
        cell.numFmt = "@";
      }
    });
  });

  // Định dạng text cho cả cột SĐT và CCCD từ dòng 4 trở đi để khi user gõ vào không mất số 0
  for (let r = 4; r <= 150; r++) {
    const row = worksheet.getRow(r);
    const phoneCell = row.getCell(4);
    const idCardCell = row.getCell(5);
    phoneCell.numFmt = "@";
    idCardCell.numFmt = "@";
  }

  // Data Validation cho cột "Là chủ hợp đồng (Có/Không)" (Cột 9 - I)
  for (let r = 2; r <= 150; r++) {
    const cell = worksheet.getCell(`I${r}`);
    cell.dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"Có,Không"'],
      showErrorMessage: true,
      errorTitle: "Giá trị không hợp lệ",
      error: "Vui lòng chọn 'Có' hoặc 'Không'",
    };
  }

  // Thêm sheet Hướng dẫn nhập liệu để người dùng dễ tra cứu
  const guideSheet = workbook.addWorksheet("Hướng dẫn nhập liệu");
  guideSheet.columns = [
    { header: "Tên cột", key: "colName", width: 28 },
    { header: "Quy định & Định dạng", key: "rule", width: 55 },
    { header: "Ví dụ", key: "example", width: 30 },
  ];

  const guideHeader = guideSheet.getRow(1);
  guideHeader.height = 28;
  guideHeader.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F172A" }, // Slate-900
    };
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const guideRules = [
    {
      colName: "1. Tên tòa nhà",
      rule: "Bắt buộc. Tên tòa nhà quản lý. Nếu đã có trong hệ thống sẽ tự động ghép vào, chưa có sẽ tự tạo mới.",
      example: "Tòa A Sunshine",
    },
    {
      colName: "2. Mã phòng",
      rule: "Bắt buộc. Mã phòng trong tòa nhà (VD: P101, P202, A1-02). Chưa có sẽ tự tạo phòng.",
      example: "P101",
    },
    {
      colName: "3. Họ và tên khách",
      rule: "Bắt buộc. Tên đầy đủ của khách thuê.",
      example: "Nguyễn Văn An",
    },
    {
      colName: "4. Số điện thoại",
      rule: "Bắt buộc. Đúng 10 chữ số, bắt đầu bằng số 0 (không chứa dấu cách/kí tự lạ).",
      example: "0912345678",
    },
    {
      colName: "5. Số CCCD",
      rule: "Bắt buộc. Đúng 12 chữ số theo chuẩn CCCD Việt Nam.",
      example: "001200001234",
    },
    {
      colName: "6. Quê quán",
      rule: "Tùy chọn. Tỉnh/thành phố hoặc địa chỉ nguyên quán của khách.",
      example: "Hà Nội",
    },
    {
      colName: "7. Ngày bắt đầu thuê",
      rule: "Bắt buộc. Định dạng YYYY-MM-DD (VD: 2026-03-01) hoặc DD/MM/YYYY.",
      example: "2026-03-01",
    },
    {
      colName: "8. Ngày kết thúc hợp đồng",
      rule: "Tùy chọn. Định dạng YYYY-MM-DD (VD: 2027-03-01) hoặc DD/MM/YYYY (để trống nếu chưa xác định).",
      example: "2027-03-01",
    },
    {
      colName: "9. Là chủ hợp đồng (Có/Không)",
      rule: "Bắt buộc. Nhập 'Có' hoặc 'Không'. Chọn từ dropdown danh sách có sẵn.",
      example: "Có",
    },
  ];

  guideRules.forEach((rule) => {
    const row = guideSheet.addRow(rule);
    row.height = 24;
    row.eachCell((cell) => {
      cell.font = { name: "Segoe UI", size: 10 };
      cell.alignment = { vertical: "middle" };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
