using DATN_HKP.Data;
using DATN_HKP.Models;
using Microsoft.EntityFrameworkCore;

namespace DATN_HKP.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            // 1. Thêm tài khoản Quản trị viên (Admin) mặc định nếu chưa có
            if (!await context.NguoiDungs.AnyAsync())
            {
                var adminUser = new NguoiDung
                {
                    TenDangNhap = "admin",
                    MatKhau = "admin123",
                    Email = "admin@care24h.vn",
                    HoTen = "Quản trị viên Care24H",
                    SoDienThoai = "0988888888",
                    VaiTro = "Admin",
                    NgayTao = DateTime.Now,
                    TrangThai = true
                };

                var testUser = new NguoiDung
                {
                    TenDangNhap = "customer1",
                    MatKhau = "123456",
                    Email = "khachhang@gmail.com",
                    HoTen = "Nguyễn Văn An",
                    SoDienThoai = "0912345678",
                    VaiTro = "Customer",
                    NgayTao = DateTime.Now,
                    TrangThai = true
                };

                context.NguoiDungs.AddRange(adminUser, testUser);
                await context.SaveChangesAsync();
            }

            // 2. Thêm Danh mục mặc định nếu chưa có
            if (!await context.DanhMucs.AnyAsync())
            {
                var categories = new List<DanhMuc>
                {
                    new DanhMuc { TenDanhMuc = "Laptop Gaming", MoTa = "Các dòng laptop hiệu năng cao, card đồ họa rời cho game thủ và đồ họa nặng" },
                    new DanhMuc { TenDanhMuc = "Laptop Văn Phòng", MoTa = "Laptop mỏng nhẹ, pin trâu, thiết kế thanh lịch cho học tập và văn phòng" },
                    new DanhMuc { TenDanhMuc = "MacBook & Apple", MoTa = "Các dòng máy tính Mac chạy chip Apple Silicon M2, M3, M4 chính hãng" },
                    new DanhMuc { TenDanhMuc = "PC Gaming & Đồ Họa", MoTa = "Dàn máy để bàn chuyên chiến game max setting và render video 4K" },
                    new DanhMuc { TenDanhMuc = "Màn Hình Máy Tính", MoTa = "Màn hình 2K, 4K, tần số quét 144Hz - 240Hz màu sắc chuẩn đồ họa" },
                    new DanhMuc { TenDanhMuc = "Phụ Kiện & Bàn Phím", MoTa = "Bàn phím cơ, chuột gaming, tai nghe chống ồn" },
                    new DanhMuc { TenDanhMuc = "Linh Kiện & Nâng Cấp", MoTa = "RAM, ổ cứng SSD NVMe, card màn hình VGA, nguồn PSU" }
                };

                context.DanhMucs.AddRange(categories);
                await context.SaveChangesAsync();
            }

            // 3. Thêm Thương hiệu mặc định nếu chưa có
            if (!await context.ThuongHieus.AnyAsync())
            {
                var brands = new List<ThuongHieu>
                {
                    new ThuongHieu { TenThuongHieu = "Asus", Logo = "https://upload.wikimedia.org/wikipedia/commons/2/2e/ASUS_Logo.svg" },
                    new ThuongHieu { TenThuongHieu = "Apple", Logo = "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" },
                    new ThuongHieu { TenThuongHieu = "Dell", Logo = "https://upload.wikimedia.org/wikipedia/commons/4/48/Dell_Logo.svg" },
                    new ThuongHieu { TenThuongHieu = "Lenovo", Logo = "https://upload.wikimedia.org/wikipedia/commons/b/b8/Lenovo_logo_2015.svg" },
                    new ThuongHieu { TenThuongHieu = "MSI", Logo = "https://upload.wikimedia.org/wikipedia/commons/0/02/MSI_Logo.svg" },
                    new ThuongHieu { TenThuongHieu = "HP", Logo = "https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_630x630.png" },
                    new ThuongHieu { TenThuongHieu = "LG", Logo = "https://upload.wikimedia.org/wikipedia/commons/b/bf/LG_logo_%282015%29.svg" }
                };

                context.ThuongHieus.AddRange(brands);
                await context.SaveChangesAsync();
            }

            // 4. Thêm Sản phẩm mẫu nếu chưa có
            if (!await context.SanPhams.AnyAsync())
            {
                var catGaming = await context.DanhMucs.FirstOrDefaultAsync(c => c.TenDanhMuc == "Laptop Gaming");
                var catOffice = await context.DanhMucs.FirstOrDefaultAsync(c => c.TenDanhMuc == "Laptop Văn Phòng");
                var catMacbook = await context.DanhMucs.FirstOrDefaultAsync(c => c.TenDanhMuc == "MacBook & Apple");
                var catMonitor = await context.DanhMucs.FirstOrDefaultAsync(c => c.TenDanhMuc == "Màn Hình Máy Tính");

                var brandAsus = await context.ThuongHieus.FirstOrDefaultAsync(t => t.TenThuongHieu == "Asus");
                var brandApple = await context.ThuongHieus.FirstOrDefaultAsync(t => t.TenThuongHieu == "Apple");
                var brandDell = await context.ThuongHieus.FirstOrDefaultAsync(t => t.TenThuongHieu == "Dell");
                var brandLg = await context.ThuongHieus.FirstOrDefaultAsync(t => t.TenThuongHieu == "LG");

                var sampleProducts = new List<SanPham>
                {
                    new SanPham
                    {
                        TenSanPham = "Laptop Gaming Asus ROG Strix G16 G614JVR",
                        Gia = 36990000,
                        SoLuong = 12,
                        HinhAnh = "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80",
                        ThongSoKyThuat = "CPU: Intel Core i9-14900HX | RAM: 16GB DDR5 5600MHz | SSD: 1TB PCIe 4.0 | VGA: RTX 4070 8GB | Màn: 16 inch QHD+ 240Hz",
                        MoTa = "Asus ROG Strix G16 2024 sở hữu sức mạnh vượt trội từ CPU Intel Gen 14th đỉnh cao và đồ họa RTX 4070, mang lại hiệu năng gaming đỉnh cấp và render 3D không đối thủ.",
                        MaDanhMuc = catGaming?.MaDanhMuc ?? 1,
                        MaThuongHieu = brandAsus?.MaThuongHieu ?? 1
                    },
                    new SanPham
                    {
                        TenSanPham = "Apple MacBook Air 15 inch M3 (2024)",
                        Gia = 32890000,
                        SoLuong = 20,
                        HinhAnh = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
                        ThongSoKyThuat = "CPU: Apple M3 8-core CPU | GPU: 10-core GPU | RAM: 16GB Unified | SSD: 512GB | Màn: 15.3 inch Liquid Retina True Tone",
                        MoTa = "MacBook Air 15 M3 kết hợp hoàn hảo giữa màn hình rộng rãi, độ mỏng ấn tượng chỉ 11.5mm cùng thời lượng pin lên đến 18 giờ liên tục.",
                        MaDanhMuc = catMacbook?.MaDanhMuc ?? 3,
                        MaThuongHieu = brandApple?.MaThuongHieu ?? 2
                    },
                    new SanPham
                    {
                        TenSanPham = "Dell XPS 13 9340 Intel Core Ultra 7",
                        Gia = 41990000,
                        SoLuong = 8,
                        HinhAnh = "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
                        ThongSoKyThuat = "CPU: Intel Core Ultra 7 155H | RAM: 32GB LPDDR5x | SSD: 1TB PCIe 4.0 | Màn: 13.4 inch FHD+ InfinityEdge 120Hz",
                        MoTa = "Tuyệt tác thiết kế laptop siêu cao cấp của Dell với bàn phím liền mạch không viền, touchpad tàng hình phản hồi rung haptic và AI tích hợp sẵn.",
                        MaDanhMuc = catOffice?.MaDanhMuc ?? 2,
                        MaThuongHieu = brandDell?.MaThuongHieu ?? 3
                    },
                    new SanPham
                    {
                        TenSanPham = "Màn hình LG UltraGear 27GR75Q-B 27 inch 2K 165Hz",
                        Gia = 5890000,
                        SoLuong = 25,
                        HinhAnh = "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
                        ThongSoKyThuat = "Kích thước: 27 inch | Độ phân giải: 2K QHD (2560x1440) | Tần số quét: 165Hz | Thời gian đáp ứng: 1ms (GtG) | Tấm nền: IPS 99% sRGB",
                        MoTa = "Màn hình quốc dân phân khúc 2K cho game thủ và dân thiết kế với tấm nền IPS rực rỡ, góc nhìn rộng và tần số quét 165Hz không độ trễ.",
                        MaDanhMuc = catMonitor?.MaDanhMuc ?? 5,
                        MaThuongHieu = brandLg?.MaThuongHieu ?? 7
                    }
                };

                context.SanPhams.AddRange(sampleProducts);
                await context.SaveChangesAsync();
            }

            // 5. Thêm Mã giảm giá mẫu nếu chưa có
            if (!await context.MaGiamGias.AnyAsync())
            {
                var vouchers = new List<MaGiamGia>
                {
                    new MaGiamGia
                    {
                        Code = "CARE24H500",
                        SoTienGiam = 500000,
                        GiaTriToiThieu = 10000000,
                        SoLuong = 100,
                        NgayBatDau = DateTime.Now.AddDays(-10),
                        NgayKetThuc = DateTime.Now.AddMonths(2),
                        TrangThai = true
                    },
                    new MaGiamGia
                    {
                        Code = "VIPGAMING",
                        SoTienGiam = 1000000,
                        GiaTriToiThieu = 25000000,
                        SoLuong = 50,
                        NgayBatDau = DateTime.Now.AddDays(-5),
                        NgayKetThuc = DateTime.Now.AddMonths(3),
                        TrangThai = true
                    },
                    new MaGiamGia
                    {
                        Code = "FREESHIP",
                        SoTienGiam = 50000,
                        GiaTriToiThieu = 500000,
                        SoLuong = 500,
                        NgayBatDau = DateTime.Now.AddDays(-1),
                        NgayKetThuc = DateTime.Now.AddMonths(1),
                        TrangThai = true
                    }
                };

                context.MaGiamGias.AddRange(vouchers);
                await context.SaveChangesAsync();
            }

            // 6. Thêm Thông tin cửa hàng mẫu nếu chưa có
            if (!await context.ThongTinCuaHangs.AnyAsync())
            {
                var store = new ThongTinCuaHang
                {
                    TenCuaHang = "Care24H - Hệ Thống Máy Tính & Linh Kiện Chính Hãng",
                    Hotline = "1800 6824",
                    Email = "support@care24h.vn",
                    DiaChi = "Tòa nhà Care24H, 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
                    GioMoCua = "08:00 - 21:30 (Mở cửa tất cả các ngày trong tuần)",
                    FanpageUrl = "https://facebook.com/care24h",
                    Logo = "/logo.png"
                };

                context.ThongTinCuaHangs.Add(store);
                await context.SaveChangesAsync();
            }

            // 7. Thêm Đơn hàng mẫu nếu chưa có
            if (!await context.DonHangs.AnyAsync())
            {
                var sp1 = await context.SanPhams.FirstOrDefaultAsync();
                var demoOrder = new DonHang
                {
                    MaNguoiDung = "customer1",
                    TenNguoiNhan = "Nguyễn Văn An",
                    SoDienThoai = "0912345678",
                    DiaChiGiaoHang = "123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
                    TongTien = sp1 != null ? sp1.Gia : 36990000,
                    TrangThai = "Chờ xác nhận",
                    PhuongThucThanhToan = "COD",
                    NgayDat = DateTime.Now.AddHours(-3),
                    GhiChu = "Giao hàng giờ hành chính giúp tôi"
                };

                if (sp1 != null)
                {
                    demoOrder.ChiTietDonHangs = new List<ChiTietDonHang>
                    {
                        new ChiTietDonHang
                        {
                            MaSanPham = sp1.MaSanPham,
                            SoLuong = 1,
                            DonGia = sp1.Gia
                        }
                    };
                }

                context.DonHangs.Add(demoOrder);
                await context.SaveChangesAsync();
            }
        }
    }
}
