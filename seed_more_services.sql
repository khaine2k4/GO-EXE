-- =========================================================================
-- SCRIPT INSERT THÊM 30 DỊCH VU + PACKAGES MẪU (AUTO INCREMENT ID)
-- Chạy TREN du lieu hien co (KHONG xoa data cu)
-- Studio_id 1-4 (Active), category_id 1-5 da co san
-- =========================================================================

USE [PhotoStudioBooking];

-- ────────────────────────────────────────────────────────────────────────
-- THEM 30 DICH VU MOI (tu dong tang ID)
-- ────────────────────────────────────────────────────────────────────────
INSERT INTO [services] ([studio_id],[category_id],[service_name],[description],[thumbnail_url],[city],[is_active],[is_hidden],[sort_order],[created_at],[updated_at]) VALUES

-- Studio 1 - Hung Camera & Studio (HCM) - 8 dich vu
(1, 1, N'Phong Su Cuoi Ngoai Troi Mua Xuan',
 N'Ghi lai khoang khac lang man giua thien nhien mua xuan ruc ro.',
 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=600',
 N'Ho Chi Minh', 1, 0, 4, SYSUTCDATETIME(), SYSUTCDATETIME()),

(1, 2, N'Portrait Ca Nhan Phong Cach Duong Pho',
 N'Bo anh chan dung street style ca tinh, tuoi tre, nang dong.',
 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=600',
 N'Ho Chi Minh', 1, 0, 5, SYSUTCDATETIME(), SYSUTCDATETIME()),

(1, 3, N'Chup Anh Gia Dinh Hanh Phuc Cuoi Tuan',
 N'Khung gio cuoi tuan, tron goi gia dinh 3-7 thanh vien tai studio.',
 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=600',
 N'Ho Chi Minh', 1, 0, 6, SYSUTCDATETIME(), SYSUTCDATETIME()),

(1, 4, N'Chup Anh Tiec Sinh Nhat & Ky Niem',
 N'Ghi lai tung khoang khac vui ve cua buoi tiec sinh nhat dac biet.',
 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=600',
 N'Ho Chi Minh', 1, 0, 7, SYSUTCDATETIME(), SYSUTCDATETIME()),

(1, 5, N'Chup San Pham Thuong Mai Chuyen Nghiep',
 N'Nhiep anh san pham nen trang va ngoai canh chuan e-commerce.',
 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600',
 N'Ho Chi Minh', 1, 0, 8, SYSUTCDATETIME(), SYSUTCDATETIME()),

(1, 1, N'Anh Cuoi Phong Cach Han Quoc',
 N'Concept cuoi Han Quoc thanh lich, nhe nhang, mau pastel tinh te.',
 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&q=80&w=600',
 N'Ho Chi Minh', 1, 0, 9, SYSUTCDATETIME(), SYSUTCDATETIME()),

(1, 2, N'Chup Anh The & Ho So Cong Viec',
 N'Anh chan dung su dung cho CV, LinkedIn, ho so xin viec chuyen nghiep.',
 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
 N'Ho Chi Minh', 1, 0, 10, SYSUTCDATETIME(), SYSUTCDATETIME()),

(1, 3, N'Newborn & Maternity Photography',
 N'Ghi lai khoang khac thieng lieng cua me bau va be so sinh.',
 'https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?auto=format&fit=crop&q=80&w=600',
 N'Ho Chi Minh', 1, 0, 11, SYSUTCDATETIME(), SYSUTCDATETIME()),

-- Studio 2 - Mai Wedding House (HCM) - 8 dich vu
(2, 1, N'Phong Su Cuoi Toan Bo Ngay Trong Dai',
 N'Theo chan co dau chu re tu sang den dem, luu lai moi cam xuc.',
 'https://images.unsplash.com/photo-1465495976277-a5de5bca100b?auto=format&fit=crop&q=80&w=600',
 N'Ho Chi Minh', 1, 0, 4, SYSUTCDATETIME(), SYSUTCDATETIME()),

(2, 1, N'Pre-Wedding Ngoai Canh Hoi An Co Kinh',
 N'Chuyen di chup Hoi An - pho co tram mac lang man duoi anh den long.',
 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&q=80&w=600',
 N'Ho Chi Minh', 1, 0, 5, SYSUTCDATETIME(), SYSUTCDATETIME()),

(2, 2, N'Bo Anh Lookbook Mua He Nang Dong',
 N'Concept bien xanh, nang vang, gio mat, mau sac tuoi vui ruc ro.',
 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=600',
 N'Ho Chi Minh', 1, 0, 6, SYSUTCDATETIME(), SYSUTCDATETIME()),

(2, 3, N'Chup Concept Sinh Nhat Be Day Thang',
 N'Trang tri decor day mau sac, concept de thuong cho be yeu 1 thang tuoi.',
 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=600',
 N'Ho Chi Minh', 1, 0, 7, SYSUTCDATETIME(), SYSUTCDATETIME()),

(2, 4, N'Chup Anh Graduation & Tot Nghiep',
 N'Ghi dau cot moc tot nghiep ruc ro voi ao gown va mu hoc vi.',
 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&q=80&w=600',
 N'Ho Chi Minh', 1, 0, 8, SYSUTCDATETIME(), SYSUTCDATETIME()),

(2, 5, N'Chup Anh Kien Truc & Noi That',
 N'Nhiep anh khong gian song, showroom, van phong phuc vu marketing.',
 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=600',
 N'Ho Chi Minh', 1, 0, 9, SYSUTCDATETIME(), SYSUTCDATETIME()),

(2, 1, N'Anh Cuoi Phong Cach Vintage Film',
 N'Mau anh co dien analog film, nhe nhang, giau cam xuc, kho quen.',
 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=600',
 N'Ho Chi Minh', 1, 0, 10, SYSUTCDATETIME(), SYSUTCDATETIME()),

(2, 3, N'Chup Anh Cap Doi Tinh Nhan',
 N'Bo anh couple ngot ngao, lang man, luu giu khoang khac hai ban ben nhau.',
 'https://images.unsplash.com/photo-1537907510278-c97fbb2f9a51?auto=format&fit=crop&q=80&w=600',
 N'Ho Chi Minh', 1, 0, 11, SYSUTCDATETIME(), SYSUTCDATETIME()),

-- Studio 3 - Nam Studio & Media (Ha Noi) - 7 dich vu
(3, 4, N'Chup Phong Su Hoi Nghi Cap Cao',
 N'Team chuyen nghiep voi thiet bi flash studio di dong tac nghiep su kien lon.',
 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=600',
 N'Ha Noi', 1, 0, 3, SYSUTCDATETIME(), SYSUTCDATETIME()),

(3, 2, N'Chup Chan Dung Nghe Si & KOL',
 N'Phong cach editorial sang trong, anh sang dep, phu hop mang xa hoi.',
 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600',
 N'Ha Noi', 1, 0, 4, SYSUTCDATETIME(), SYSUTCDATETIME()),

(3, 5, N'Chup Thuc Pham & Do Uong',
 N'Nhiep anh am thuc, do uong chuan tap chi, anh sang tu nhien dep.',
 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=600',
 N'Ha Noi', 1, 0, 5, SYSUTCDATETIME(), SYSUTCDATETIME()),

(3, 3, N'Chup Anh Gia Dinh Phong Cach Han',
 N'Bo anh gia dinh tone mau trang tinh, nhe nhang theo phong cach Han Quoc.',
 'https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&q=80&w=600',
 N'Ha Noi', 1, 0, 6, SYSUTCDATETIME(), SYSUTCDATETIME()),

(3, 1, N'Phong Su Cuoi Concept Rung Nui',
 N'Ngay cuoi giua thien nhien hoang so, bi an tai Sapa hoac Ba Vi.',
 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=600',
 N'Ha Noi', 1, 0, 7, SYSUTCDATETIME(), SYSUTCDATETIME()),

(3, 4, N'Chup Su Kien Ra Mat San Pham',
 N'Ghi lai khong khi soi dong cua buoi ra mat, media wall, CEO phat bieu.',
 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=600',
 N'Ha Noi', 1, 0, 8, SYSUTCDATETIME(), SYSUTCDATETIME()),

(3, 2, N'Bo Anh Thoi Trang Mua Thu Dong',
 N'Tone mau thu - la vang la do, ao len, phong cach minimalist sang trong.',
 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=600',
 N'Ha Noi', 1, 0, 9, SYSUTCDATETIME(), SYSUTCDATETIME()),

-- Studio 4 - Tuan Art Fine Portrait (Da Nang) - 7 dich vu
(4, 2, N'Fine Art Portrait Den Trang Co Dien',
 N'Nghe thuat chan dung don sac, anh sang rembrandt, tinh te va sau lang.',
 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=600',
 N'Da Nang', 1, 0, 3, SYSUTCDATETIME(), SYSUTCDATETIME()),

(4, 1, N'Pre-Wedding Bien My Khe Lang Man',
 N'Chup anh cuoi hoang hon tren bai bien My Khe - nang vang, song xanh.',
 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600',
 N'Da Nang', 1, 0, 4, SYSUTCDATETIME(), SYSUTCDATETIME()),

(4, 5, N'Chup Anh Thuong Hieu Ca Nhan (Personal Branding)',
 N'Xay dung hinh anh ca nhan chuyen nghiep cho doanh nhan, coach, influencer.',
 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=600',
 N'Da Nang', 1, 0, 5, SYSUTCDATETIME(), SYSUTCDATETIME()),

(4, 3, N'Chup Anh Be Yeu Concept Rung Xanh',
 N'Be kham pha the gioi tu nhien - concept fairy tale day than tien.',
 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&q=80&w=600',
 N'Da Nang', 1, 0, 6, SYSUTCDATETIME(), SYSUTCDATETIME()),

(4, 4, N'Chup Anh Teambuilding & Noi Bo Cong Ty',
 N'Luu lai ky uc dep cua ca team trong nhung chuyen teambuilding thu vi.',
 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=600',
 N'Da Nang', 1, 0, 7, SYSUTCDATETIME(), SYSUTCDATETIME()),

(4, 2, N'Chup Concept Ngoai Canh Son Tra',
 N'Ban dao Son Tra xanh muot, hoang hon vang ruc - boi canh thien nhien tuyet dep.',
 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=600',
 N'Da Nang', 1, 0, 8, SYSUTCDATETIME(), SYSUTCDATETIME()),

(4, 5, N'Chup Anh Kien Truc Cau Rong & Landmark',
 N'Nhiep anh kien truc do thi, cau cang, landmark noi tieng Da Nang.',
 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=600',
 N'Da Nang', 1, 0, 9, SYSUTCDATETIME(), SYSUTCDATETIME());


-- ────────────────────────────────────────────────────────────────────────
-- THEM PACKAGES - lay service_id moi vua insert
-- ────────────────────────────────────────────────────────────────────────
DECLARE @baseServiceId BIGINT;
-- ID nho nhat trong cac service vua insert (dich vu dau tien khong co trong DB truoc)
SELECT @baseServiceId = MIN(service_id)
FROM [services]
WHERE service_name IN (
    N'Phong Su Cuoi Ngoai Troi Mua Xuan',
    N'Portrait Ca Nhan Phong Cach Duong Pho'
);

INSERT INTO [packages] ([service_id],[package_name],[description],[price],[duration_hours],[max_photos],[inclusions],[is_active],[sort_order],[created_at],[updated_at])
SELECT s.service_id,
       p.package_name,
       p.description,
       p.price,
       p.duration_hours,
       p.max_photos,
       p.inclusions,
       1,
       p.sort_order,
       SYSUTCDATETIME(),
       SYSUTCDATETIME()
FROM [services] s
CROSS APPLY (
    SELECT * FROM (VALUES
        (N'Goi Co Ban', N'1 nhep anh gia, buoi sang, 80 anh chinh sua.', 1500000, 3, 80, N'Ban giao USB, chinh mau co ban', 1),
        (N'Goi Nang Cao', N'2 nhep anh gia, ca ngay, 200 anh + video highlight.', 3500000, 6, 200, N'Video highlight 3 phut, album 20 trang', 2)
    ) AS v(package_name, description, price, duration_hours, max_photos, inclusions, sort_order)
) p
WHERE s.service_id >= @baseServiceId
  AND NOT EXISTS (
      SELECT 1 FROM [packages] pk WHERE pk.service_id = s.service_id
  );

PRINT 'Done! Da insert thanh cong 30 dich vu moi va packages tuong ung.';
