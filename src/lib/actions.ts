"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  buildingSchema,
  roomSchema,
  tenantSchema,
  type BuildingInput,
  type RoomInput,
  type TenantInput,
  type ExcelTenantRow,
} from "./validations";

// =============================================================================
// 1. DASHBOARD QUERIES
// =============================================================================

export async function getDashboardData() {
  try {
    const [buildings, rooms, tenants] = await Promise.all([
      prisma.building.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { rooms: true },
          },
        },
      }),
      prisma.room.findMany({
        orderBy: [{ buildingId: "asc" }, { roomNumber: "asc" }],
        include: {
          building: true,
          tenants: true,
          _count: {
            select: { tenants: true },
          },
        },
      }),
      prisma.tenant.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          room: {
            include: {
              building: true,
            },
          },
        },
      }),
    ]);

    // Thống kê nhanh
    const totalBuildings = buildings.length;
    const totalRooms = rooms.length;
    const availableRooms = rooms.filter((r) => r.status === "AVAILABLE").length;
    const rentedRooms = rooms.filter((r) => r.status === "RENTED").length;
    const maintenanceRooms = rooms.filter((r) => r.status === "MAINTENANCE").length;
    const totalTenants = tenants.length;
    const totalContractHolders = tenants.filter((t) => t.isContractHolder).length;

    return {
      success: true,
      stats: {
        totalBuildings,
        totalRooms,
        availableRooms,
        rentedRooms,
        maintenanceRooms,
        totalTenants,
        totalContractHolders,
      },
      buildings,
      rooms,
      tenants,
    };
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu Dashboard:", error);
    return {
      success: false,
      error: "Không thể kết nối đến cơ sở dữ liệu Supabase",
      stats: {
        totalBuildings: 0,
        totalRooms: 0,
        availableRooms: 0,
        rentedRooms: 0,
        maintenanceRooms: 0,
        totalTenants: 0,
        totalContractHolders: 0,
      },
      buildings: [],
      rooms: [],
      tenants: [],
    };
  }
}

// =============================================================================
// 2. BUILDING CRUD
// =============================================================================

export async function createBuilding(input: BuildingInput) {
  try {
    const validated = buildingSchema.parse(input);

    const existing = await prisma.building.findUnique({
      where: { name: validated.name },
    });
    if (existing) {
      return { success: false, error: `Tòa nhà '${validated.name}' đã tồn tại trong hệ thống` };
    }

    const building = await prisma.building.create({
      data: {
        name: validated.name,
        address: validated.address,
        totalFloors: validated.totalFloors,
        note: validated.note || null,
      },
    });

    revalidatePath("/");
    return { success: true, building };
  } catch (error: any) {
    console.error("Lỗi tạo tòa nhà:", error);
    return { success: false, error: error.message || "Không thể tạo tòa nhà" };
  }
}

export async function updateBuilding(id: string, input: BuildingInput) {
  try {
    const validated = buildingSchema.parse(input);

    const existing = await prisma.building.findFirst({
      where: { name: validated.name, NOT: { id } },
    });
    if (existing) {
      return { success: false, error: `Tên tòa nhà '${validated.name}' đã được sử dụng` };
    }

    const building = await prisma.building.update({
      where: { id },
      data: {
        name: validated.name,
        address: validated.address,
        totalFloors: validated.totalFloors,
        note: validated.note || null,
      },
    });

    revalidatePath("/");
    return { success: true, building };
  } catch (error: any) {
    console.error("Lỗi cập nhật tòa nhà:", error);
    return { success: false, error: error.message || "Không thể cập nhật tòa nhà" };
  }
}

export async function deleteBuilding(id: string) {
  try {
    const roomsCount = await prisma.room.count({ where: { buildingId: id } });
    if (roomsCount > 0) {
      return {
        success: false,
        error: `Không thể xóa tòa nhà đang có ${roomsCount} phòng. Vui lòng chuyển hoặc xóa phòng trước.`,
      };
    }

    await prisma.building.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi xóa tòa nhà:", error);
    return { success: false, error: error.message || "Không thể xóa tòa nhà" };
  }
}

// =============================================================================
// 3. ROOM CRUD
// =============================================================================

export async function createRoom(input: RoomInput) {
  try {
    const validated = roomSchema.parse(input);

    const existing = await prisma.room.findUnique({
      where: {
        buildingId_roomNumber: {
          buildingId: validated.buildingId,
          roomNumber: validated.roomNumber,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        error: `Phòng '${validated.roomNumber}' đã tồn tại trong tòa nhà này`,
      };
    }

    const room = await prisma.room.create({
      data: {
        buildingId: validated.buildingId,
        roomNumber: validated.roomNumber,
        floor: validated.floor,
        basePrice: validated.basePrice,
        area: validated.area,
        status: validated.status,
      },
    });

    revalidatePath("/");
    return { success: true, room };
  } catch (error: any) {
    console.error("Lỗi tạo phòng:", error);
    return { success: false, error: error.message || "Không thể tạo phòng" };
  }
}

export async function updateRoom(id: string, input: RoomInput) {
  try {
    const validated = roomSchema.parse(input);

    const existing = await prisma.room.findFirst({
      where: {
        buildingId: validated.buildingId,
        roomNumber: validated.roomNumber,
        NOT: { id },
      },
    });

    if (existing) {
      return {
        success: false,
        error: `Mã phòng '${validated.roomNumber}' đã tồn tại trong tòa nhà này`,
      };
    }

    const room = await prisma.room.update({
      where: { id },
      data: {
        buildingId: validated.buildingId,
        roomNumber: validated.roomNumber,
        floor: validated.floor,
        basePrice: validated.basePrice,
        area: validated.area,
        status: validated.status,
      },
    });

    revalidatePath("/");
    return { success: true, room };
  } catch (error: any) {
    console.error("Lỗi cập nhật phòng:", error);
    return { success: false, error: error.message || "Không thể cập nhật phòng" };
  }
}

export async function deleteRoom(id: string) {
  try {
    const tenantsCount = await prisma.tenant.count({ where: { roomId: id } });
    if (tenantsCount > 0) {
      return {
        success: false,
        error: `Không thể xóa phòng đang có ${tenantsCount} khách thuê. Vui lòng chuyển hoặc xóa khách trước.`,
      };
    }

    await prisma.room.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi xóa phòng:", error);
    return { success: false, error: error.message || "Không thể xóa phòng" };
  }
}

// =============================================================================
// 4. TENANT CRUD
// =============================================================================

export async function createTenant(input: TenantInput) {
  try {
    const validated = tenantSchema.parse(input);

    const existingIdCard = await prisma.tenant.findUnique({
      where: { idCard: validated.idCard },
    });

    if (existingIdCard) {
      return {
        success: false,
        error: `Số CCCD '${validated.idCard}' đã tồn tại trong hệ thống (khách: ${existingIdCard.fullName})`,
      };
    }

    const startDate = new Date(validated.startDate);
    const endDate = validated.endDate ? new Date(validated.endDate) : null;

    const tenant = await prisma.$transaction(async (tx) => {
      const created = await tx.tenant.create({
        data: {
          roomId: validated.roomId,
          fullName: validated.fullName,
          phone: validated.phone,
          idCard: validated.idCard,
          homeTown: validated.homeTown || null,
          startDate,
          endDate,
          isContractHolder: validated.isContractHolder,
        },
      });

      // Cập nhật trạng thái phòng thành RENTED nếu đang AVAILABLE
      await tx.room.update({
        where: { id: validated.roomId },
        data: { status: "RENTED" },
      });

      return created;
    });

    revalidatePath("/");
    return { success: true, tenant };
  } catch (error: any) {
    console.error("Lỗi thêm khách thuê:", error);
    return { success: false, error: error.message || "Không thể thêm khách thuê" };
  }
}

export async function updateTenant(id: string, input: TenantInput) {
  try {
    const validated = tenantSchema.parse(input);

    const existingIdCard = await prisma.tenant.findFirst({
      where: { idCard: validated.idCard, NOT: { id } },
    });

    if (existingIdCard) {
      return {
        success: false,
        error: `Số CCCD '${validated.idCard}' đã thuộc về khách khác`,
      };
    }

    const startDate = new Date(validated.startDate);
    const endDate = validated.endDate ? new Date(validated.endDate) : null;

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        roomId: validated.roomId,
        fullName: validated.fullName,
        phone: validated.phone,
        idCard: validated.idCard,
        homeTown: validated.homeTown || null,
        startDate,
        endDate,
        isContractHolder: validated.isContractHolder,
      },
    });

    revalidatePath("/");
    return { success: true, tenant };
  } catch (error: any) {
    console.error("Lỗi cập nhật khách thuê:", error);
    return { success: false, error: error.message || "Không thể cập nhật khách thuê" };
  }
}

export async function deleteTenant(id: string) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: { room: { include: { tenants: true } } },
    });

    if (!tenant) {
      return { success: false, error: "Không tìm thấy khách thuê" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.tenant.delete({ where: { id } });

      // Nếu phòng không còn khách nào sau khi xóa, tự động đổi trạng thái phòng về AVAILABLE
      if (tenant.room.tenants.length <= 1) {
        await tx.room.update({
          where: { id: tenant.roomId },
          data: { status: "AVAILABLE" },
        });
      }
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi xóa khách thuê:", error);
    return { success: false, error: error.message || "Không thể xóa khách thuê" };
  }
}

// =============================================================================
// 5. IMPORT EXCEL VÀ AUTO-MAP VÀO TÒA NHÀ & PHÒNG
// =============================================================================

export async function importTenantsFromExcelAction(
  rows: Array<{
    buildingName: string;
    roomNumber: string;
    fullName: string;
    phone: string;
    idCard: string;
    homeTown?: string | null;
    startDate: string;
    endDate?: string | null;
    isContractHolder: boolean;
  }>
) {
  try {
    if (!rows || rows.length === 0) {
      return { success: false, error: "Không có dữ liệu hợp lệ để lưu" };
    }

    let importedCount = 0;
    let updatedCount = 0;

    // Thực hiện transaction để đảm bảo toàn vẹn dữ liệu
    await prisma.$transaction(
      async (tx) => {
        for (const row of rows) {
          const buildingName = row.buildingName.trim();
          const roomNumber = row.roomNumber.trim();
          const startDate = new Date(row.startDate);
          const endDate = row.endDate ? new Date(row.endDate) : null;

          // 1. Tự động tìm hoặc tạo Tòa nhà
          let building = await tx.building.findUnique({
            where: { name: buildingName },
          });

          if (!building) {
            building = await tx.building.create({
              data: {
                name: buildingName,
                address: `Địa chỉ tòa ${buildingName}`,
                totalFloors: 1,
                note: "Tự động tạo từ import Excel",
              },
            });
          }

          // 2. Tự động tìm hoặc tạo Phòng trong Tòa nhà
          let room = await tx.room.findUnique({
            where: {
              buildingId_roomNumber: {
                buildingId: building.id,
                roomNumber,
              },
            },
          });

          if (!room) {
            room = await tx.room.create({
              data: {
                buildingId: building.id,
                roomNumber,
                floor: 1,
                basePrice: 0,
                area: 20,
                status: "RENTED",
              },
            });
          } else {
            // Cập nhật trạng thái phòng thành RENTED
            await tx.room.update({
              where: { id: room.id },
              data: { status: "RENTED" },
            });
          }

          // 3. Upsert khách thuê theo CCCD
          const existingTenant = await tx.tenant.findUnique({
            where: { idCard: row.idCard },
          });

          if (existingTenant) {
            await tx.tenant.update({
              where: { id: existingTenant.id },
              data: {
                roomId: room.id,
                fullName: row.fullName,
                phone: row.phone,
                homeTown: row.homeTown || null,
                startDate,
                endDate,
                isContractHolder: row.isContractHolder,
              },
            });
            updatedCount++;
          } else {
            await tx.tenant.create({
              data: {
                roomId: room.id,
                fullName: row.fullName,
                phone: row.phone,
                idCard: row.idCard,
                homeTown: row.homeTown || null,
                startDate,
                endDate,
                isContractHolder: row.isContractHolder,
              },
            });
            importedCount++;
          }
        }
      },
      {
        timeout: 25000, // 25s timeout cho batch import
      }
    );

    revalidatePath("/");
    return {
      success: true,
      message: `Đã xử lý xong: thêm mới ${importedCount} khách, cập nhật ${updatedCount} khách.`,
      importedCount,
      updatedCount,
    };
  } catch (error: any) {
    console.error("Lỗi khi import khách thuê từ Excel:", error);
    return {
      success: false,
      error: error.message || "Lỗi hệ thống khi lưu dữ liệu từ Excel",
    };
  }
}
