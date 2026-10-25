import ExcelJS from "exceljs";
import { excelRowSchema, type ExcelRowValidationResult } from "./validations";

/**
 * Chuẩn hóa giá trị ô thành chuỗi
 */
function getCellString(cell: ExcelJS.Cell): string {
  if (cell.value === null || cell.value === undefined) return "";

  // Nếu cell là kiểu RichText
  if (typeof cell.value === "object" && "richText" in cell.value) {
    return (cell.value.richText || []).map((t) => t.text).join("").trim();
  }

  // Nếu cell là Date object trong Excel
  if (cell.value instanceof Date) {
    return formatDateToString(cell.value);
  }

  // Nếu là công thức
  if (typeof cell.value === "object" && "result" in cell.value) {
    return String(cell.value.result ?? "").trim();
  }

  return String(cell.value).trim();
}

/**
 * Chuẩn hóa ngày thành định dạng YYYY-MM-DD
 */
function formatDateToString(d: Date): string {
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse chuỗi ngày người dùng nhập (hỗ trợ YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY)
 */
function parseDateInput(val: string): string {
  if (!val) return "";
  val = val.trim();

  // Đã đúng định dạng YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return val;
  }

  // Định dạng DD/MM/YYYY hoặc DD-MM-YYYY
  const dmyMatch = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Thử parse Date thông thường
  const timestamp = Date.parse(val);
  if (!isNaN(timestamp)) {
    return formatDateToString(new Date(timestamp));
  }

  return val;
}

/**
 * Parse file Excel (.xlsx) tải lên từ client/server và kiểm tra bằng Zod
 */
export async function parseTenantExcel(buffer: Buffer): Promise<{
  rows: ExcelRowValidationResult[];
  totalRows: number;
  validCount: number;
  invalidCount: number;
}> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  // Lấy sheet đầu tiên hoặc sheet có tên "Danh sách khách thuê"
  const worksheet =
    workbook.getWorksheet("Danh sách khách thuê") || workbook.worksheets[0];

  if (!worksheet) {
    throw new Error("File Excel không có bất kỳ trang tính (worksheet) nào!");
  }

  const results: ExcelRowValidationResult[] = [];

  // Duyệt từ dòng thứ 2 (bỏ qua dòng header)
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Bỏ header

    // Lấy giá trị các ô
    const buildingName = getCellString(row.getCell(1));
    const roomNumber = getCellString(row.getCell(2));
    const fullName = getCellString(row.getCell(3));

    // Xử lý SĐT: lấy chuỗi, nếu có số 0 đầu bị Excel cắt thì padStart
    let phone = getCellString(row.getCell(4)).replace(/\s+/g, "");
    if (/^\d{9}$/.test(phone)) {
      phone = "0" + phone;
    }

    // Xử lý CCCD
    let idCard = getCellString(row.getCell(5)).replace(/\s+/g, "");
    if (/^\d{11}$/.test(idCard)) {
      idCard = "0" + idCard;
    }

    const homeTown = getCellString(row.getCell(6));
    const rawStartDate = getCellString(row.getCell(7));
    const rawEndDate = getCellString(row.getCell(8));
    const isHolderRaw = getCellString(row.getCell(9)).toLowerCase();

    // Bỏ qua dòng trống hoàn toàn
    if (!buildingName && !roomNumber && !fullName && !phone && !idCard) {
      return;
    }

    const startDate = parseDateInput(rawStartDate);
    const endDate = rawEndDate ? parseDateInput(rawEndDate) : null;
    const isContractHolder = ["có", "co", "yes", "true", "1", "x"].includes(
      isHolderRaw
    );

    const rawData = {
      rowIndex: rowNumber,
      buildingName,
      roomNumber,
      fullName,
      phone,
      idCard,
      homeTown: homeTown || "",
      startDate,
      endDate: endDate || null,
      isContractHolder,
    };

    // Kiểm tra tính hợp lệ qua Zod
    const parsed = excelRowSchema.safeParse(rawData);
    const errors: string[] = [];

    if (!parsed.success) {
      for (const err of parsed.error.issues) {
        errors.push(err.message);
      }
    }

    // Kiểm tra thêm tính logic: Ngày kết thúc phải sau ngày bắt đầu
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
        errors.push("Ngày kết thúc hợp đồng phải sau ngày bắt đầu thuê");
      }
    }

    results.push({
      rowNumber,
      data: {
        buildingName,
        roomNumber,
        fullName,
        phone,
        idCard,
        homeTown,
        startDate,
        endDate,
        isContractHolder,
      },
      isValid: errors.length === 0,
      errors,
    });
  });

  const validCount = results.filter((r) => r.isValid).length;
  const invalidCount = results.length - validCount;

  return {
    rows: results,
    totalRows: results.length,
    validCount,
    invalidCount,
  };
}
