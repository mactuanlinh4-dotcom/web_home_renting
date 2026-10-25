import { z } from "zod";

// Regex kiểm tra số điện thoại Việt Nam (10 số, bắt đầu bằng 03, 05, 07, 08, 09...)
export const phoneRegex = /^0\d{9}$/;

// Regex kiểm tra số CCCD/CMND (12 chữ số theo chuẩn CCCD mới)
export const idCardRegex = /^\d{12}$/;

// Schema tạo/sửa Tòa nhà
export const buildingSchema = z.object({
  name: z.string().trim().min(1, "Tên tòa nhà không được để trống"),
  address: z.string().trim().min(1, "Địa chỉ không được để trống"),
  totalFloors: z.coerce.number().int().min(1, "Số tầng tối thiểu là 1").default(1),
  note: z.string().trim().optional().nullable(),
});

export type BuildingInput = z.infer<typeof buildingSchema>;

// Schema tạo/sửa Phòng
export const roomSchema = z.object({
  buildingId: z.string().min(1, "Vui lòng chọn tòa nhà"),
  roomNumber: z.string().trim().min(1, "Mã phòng không được để trống"),
  floor: z.coerce.number().int().min(1, "Tầng phải từ 1 trở lên").default(1),
  basePrice: z.coerce.number().int().min(0, "Giá thuê không được âm").default(0),
  area: z.coerce.number().min(0, "Diện tích không được âm").default(0),
  status: z.enum(["AVAILABLE", "RENTED", "MAINTENANCE"]).default("AVAILABLE"),
});

export type RoomInput = z.infer<typeof roomSchema>;

// Schema tạo/sửa Khách thuê
export const tenantSchema = z.object({
  roomId: z.string().min(1, "Vui lòng chọn phòng"),
  fullName: z.string().trim().min(2, "Họ và tên phải có ít nhất 2 ký tự"),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng số 0 (VD: 0912345678)"),
  idCard: z
    .string()
    .trim()
    .regex(idCardRegex, "Số CCCD phải gồm đúng 12 chữ số (VD: 001200001234)"),
  homeTown: z.string().trim().optional().nullable(),
  startDate: z.string().min(1, "Vui lòng chọn ngày bắt đầu thuê"),
  endDate: z.string().optional().nullable(),
  isContractHolder: z.boolean().default(false),
});

export type TenantInput = z.infer<typeof tenantSchema>;

// Schema parse từng dòng từ file Excel
export const excelRowSchema = z.object({
  rowIndex: z.number(), // Số dòng trong file Excel (bắt đầu từ 2)
  buildingName: z.string().trim().min(1, "Tên tòa nhà không được để trống"),
  roomNumber: z.string().trim().min(1, "Mã phòng không được để trống"),
  fullName: z.string().trim().min(2, "Họ và tên phải từ 2 ký tự"),
  phone: z
    .string()
    .trim()
    .transform((val) => val.replace(/\s+/g, ""))
    .refine((val) => phoneRegex.test(val), {
      message: "SĐT phải gồm đúng 10 số, bắt đầu bằng 0",
    }),
  idCard: z
    .string()
    .trim()
    .transform((val) => val.replace(/\s+/g, ""))
    .refine((val) => idCardRegex.test(val), {
      message: "CCCD phải gồm đúng 12 chữ số",
    }),
  homeTown: z.string().trim().optional().nullable().default(""),
  startDate: z.string().min(1, "Ngày bắt đầu thuê không hợp lệ"),
  endDate: z.string().optional().nullable().default(null),
  isContractHolder: z.boolean().default(false),
});

export type ExcelTenantRow = z.infer<typeof excelRowSchema>;

export interface ExcelRowValidationResult {
  rowNumber: number;
  data: {
    buildingName: string;
    roomNumber: string;
    fullName: string;
    phone: string;
    idCard: string;
    homeTown: string;
    startDate: string;
    endDate: string | null;
    isContractHolder: boolean;
  };
  isValid: boolean;
  errors: string[];
}
