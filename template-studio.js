(() => {
    'use strict';

    const W = 250;
    const H = 128;
    // The legacy nRF52 encoder detects colors by exact RGB channel values:
    // black must be 0,0,0 and red must be 255,0,0.
    const COLORS = { black: '#000000', red: '#ff0000', white: '#ffffff' };
    const STORAGE_KEY = 'nrf-epd-template-studio-v1';
    const AUTO_SYNC_KEY = 'nrf-epd-template-auto-sync-v1';
    const clone = value => JSON.parse(JSON.stringify(value));
    const uid = () => `o_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    const rect = (x, y, w, h, fill = COLORS.white, stroke = COLORS.black, sw = 1, extra = {}) => ({ id: uid(), type: 'rect', x, y, w, h, fill, stroke, strokeWidth: sw, ...extra });
    const line = (x, y, w, h, color = COLORS.black, sw = 1, extra = {}) => ({ id: uid(), type: 'line', x, y, w, h, color, strokeWidth: sw, ...extra });
    const text = (value, x, y, w, h, size = 16, color = COLORS.black, extra = {}) => ({ id: uid(), type: 'text', text: value, x, y, w, h, fontSize: size, color, fontFamily: 'Arial', bold: false, italic: false, underline: false, align: 'left', valign: 'middle', ...extra });
    const icon = (value, x, y, w, h, color = COLORS.black, extra = {}) => ({ id: uid(), type: 'icon', text: value, x, y, w, h, color, fontSize: Math.min(w, h), align: 'center', ...extra });
    const qr = (value, x, y, size) => ({ id: uid(), type: 'qr', text: value, x, y, w: size, h: size, color: COLORS.black, fill: COLORS.white });

    const PIXEL_ART = {
        bunny: { name: 'Thỏ', rows: ['..BB....BB..','.BWWB..BWWB.','.BWWBBBBWWB.','..BWWWWWWB..','.BWBWWBWWBW.','.BWWWWWWWWB.','..BWRRRRWB..','...BWWWWB...','..BBBWWBBB..','.BWWBBBBWWB.','.BWB....BWB.','..B......B..'] },
        fox: { name: 'Cáo', rows: ['R..........R','RR........RR','RBR......RBR','RBBR....RBBR','.RBBRRRRBBR.','..RBBBBBBR..','..RBWBBWBR..','..RBBBBBBR..','...RBWWBR...','....RBBR....','...R....R...','..R......R..'] },
        cat: { name: 'Mèo', rows: ['B..........B','BB........BB','BWB......BWB','BWWBBBBBBWWB','.BWWWWWWWWB.','.BWBWWBWWBW.','.BWWWWWWWWB.','..BWRRRRWB..','...BWWWWB...','..BB....BB..','.B........B.','B..........B'] },
        bear: { name: 'Gấu', rows: ['.BBB....BBB.','BWWWB..BWWWB','BWWWB..BWWWB','.BBBBBBBBBB.','.BWWWWWWWWB.','.BWBWWBWWBW.','.BWWWWWWWWB.','..BWB..BWB..','..BWWBBWWB..','...BWWWWB...','..BBB..BBB..','.B........B.'] },
        heart: { name: 'Trái tim', rows: ['............','..RR....RR..','.RRRR..RRRR.','RRRRRRRRRRRR','RRRRRRRRRRRR','.RRRRRRRRRR.','..RRRRRRRR..','...RRRRRR...','....RRRR....','.....RR.....','............','............'] },
        flower: { name: 'Hoa', rows: ['.....RR.....','....RRRR....','..RRRBBRRR..','.RRBBBBBBRR.','RRBBBRRBBBRR','.RBBBBBBBBR.','..RRBBBBRR..','....BBBB....','.....BB.....','...BBBBBB...','..BB.BB.BB..','.....BB.....'] },
        cactus: { name: 'Xương rồng', rows: ['.....BB.....','....BWWB....','....BWWB....','..B.BWWB....','.BWB BWWB...','.BWWBBWWB...','..BWWWWWB...','....BWWB....','....BWWB....','...BBBBBB...','..BRRRRRRB..','.BRRRRRRRRB.'].map(r => r.replace(/ /g,'.')) },
        coffee: { name: 'Cà phê', rows: ['............','..BBBBBBBB..','..BWWWWWWB..','..BWRRWWWB..','..BWWRRWWB.B','..BWWWWWWBBB','..BWWWWWWB.B','...BWWWWB...','....BBBB....','..BBBBBBBB..','.BWWWWWWWWB.','..BBBBBBBB..'] }
        ,clock: { name: 'Đồng hồ', rows: ['....BBBB....','..BB....BB..','.B........B.','B....BB....B','B....BB....B','B....BB....B','B....BBBBB.B','B..........B','B..........B','.B........B.','..BB....BB..','....BBBB....'] }
        ,calendarIcon: { name: 'Lịch', rows: ['..BB....BB..','..BB....BB..','.BBBBBBBBBB.','BRRRRRRRRRRB','BWWWWWWWWWWB','BWBWWBWWBWWB','BWWWWWWWWWWB','BWBWWBWWBWWB','BWWWWWWWWWWB','BWBWWBWWBWWB','BWWWWWWWWWWB','.BBBBBBBBBB.'] }
        ,sun: { name: 'Mặt trời', rows: ['.....RR.....','..R..RR..R..','...R.RR.R...','....RRRR....','.RR.RRRR.RR.','RRRRRRRRRRRR','.RR.RRRR.RR.','....RRRR....','...R.RR.R...','..R..RR..R..','.....RR.....','............'] }
        ,cloud: { name: 'Mây', rows: ['............','....BBBB....','...BWWWWB...','..BWWWWWWB..','.BWWWWWWWWB.','BWWWWWWWWWWB','BWWWWWWWWWWB','.BBBBBBBBBB.','............','............','............','............'] }
        ,battery: { name: 'Pin', rows: ['............','............','.BBBBBBBBB..','BWWWWWWWWWB.','BRRRRRWWWWBB','BRRRRRWWWWBB','BRRRRRWWWWBB','BRRRRRWWWWBB','BWWWWWWWWWB.','.BBBBBBBBB..','............','............'] }
        ,wifi: { name: 'Wi‑Fi', rows: ['............','..BBBBBBBB..','.B........B.','B..BBBBBB..B','..B......B...','...B.BBBB.B..','....B....B...','.....BBBB....','......BB.....','............','............','............'].map(r => r.slice(0,12).padEnd(12,'.')) }
        ,bell: { name: 'Chuông', rows: ['.....BB.....','....BBBB....','...BWWWWB...','...BWWWWB...','...BWWWWB...','..BWWWWWWB..','..BWWWWWWB..','.BBBBBBBBBB.','BRRRRRRRRRRB','..BBBBBBBB..','.....BB.....','............'] }
        ,mail: { name: 'Thư', rows: ['............','.BBBBBBBBBB.','BWWWWWWWWWWB','BBWBBBBBBBWBB','BWBWWWWWWBWB','BWWBWWWWBWWB','BWWWBWWBWWWB','BWWWWBBWWWWB','BWWWWWWWWWWB','BWWWWWWWWWWB','.BBBBBBBBBB.','............'].map(r => r.slice(0,12)) }
        ,pin: { name: 'Vị trí', rows: ['....BBBB....','..BBWWWWBB..','.BWWWWWWWWB.','BWWWWBBWWWWB','BWWWB..BWWWB','BWWWWBBWWWWB','.BWWWWWWWWB.','..BWWWWWWB..','...BWWWWB...','....BWWB....','.....BB.....','............'] }
        ,phone: { name: 'Điện thoại', rows: ['....BBBB....','...BWWWWB...','...BWWWWB...','...BWWWWB...','...BWWWWB...','...BWWWWB...','...BWWWWB...','...BWWWWB...','...BWWWWB...','...BWWWWB...','....BBBB....','............'] }
        ,music: { name: 'Âm nhạc', rows: ['......BBBB..','......BWWB..','......BWWB..','......BWWB..','..BBBBBWWB..','.BWWWWBWWB..','.BWWWWBWWB..','.BWWWWBWWB..','..BBBB.WWB..','......BWWB..','.......BB...','............'] }
        ,check: { name: 'Hoàn thành', rows: ['............','..........BB','.........BB.','........BB..','.BB....BB...','..BB..BB....','...BBBB.....','....BB......','............','............','............','............'] }
        ,handset: { name: 'Điện thoại cầm tay', rows: ['..RRRR........',' .RRRRR.......','RRRRRR........','RRRRR.........','.RRRR.........','..RRRR........','...RRRR.......','....RRRR......','.....RRRR.....','......RRRR....','.......RRRR...','........RRRR..','.........RRRR.','........RRRRR.','.........RRRR.','..........RR..'].map(r => r.replace(/ /g,'.')) }
        ,spark: { name: 'Tia sáng', rows: ['.....RR.....','.....RR.....','.....RR.....','.....RR.....','....RRRR....','RRRRRRRRRRRR','RRRRRRRRRRRR','....RRRR....','.....RR.....','.....RR.....','.....RR.....','.....RR.....'] }
    };

    const templates = [
        { id: 'daily', name: 'Kế hoạch hôm nay', category: 'work', objects: [
            text('HÔM NAY', 10, 6, 112, 24, 22, COLORS.black, { bold: true }), text('{{date}}', 154, 7, 86, 18, 12, COLORS.red, { align: 'right', bold: true }),
            line(10, 32, 230, 0, COLORS.black, 2), text('ƯU TIÊN', 10, 37, 70, 14, 10, COLORS.red, { bold: true }),
            text('□ Việc quan trọng nhất\n□ Việc thứ hai\n□ Việc thứ ba', 10, 51, 142, 66, 13, COLORS.black, { valign: 'top', lineHeight: 1.55 }),
            rect(163, 39, 77, 78, COLORS.white, COLORS.black, 1), text('GHI CHÚ', 169, 44, 65, 13, 10, COLORS.black, { bold: true, align: 'center' }), line(170, 66, 62, 0, '#999999'), line(170, 82, 62, 0, '#999999'), line(170, 98, 62, 0, '#999999')
        ]},
        { id: 'todo', name: 'Danh sách việc', category: 'work', objects: [
            rect(0, 0, 250, 27, COLORS.black, COLORS.black, 0), text('TO-DO', 10, 2, 90, 23, 21, COLORS.white, { bold: true }), text('{{weekday}} • {{date}}', 116, 5, 124, 17, 11, COLORS.white, { align: 'right' }),
            text('□ __________________________________\n□ __________________________________\n□ __________________________________\n□ __________________________________\n□ __________________________________', 12, 35, 226, 86, 13, COLORS.black, { valign: 'top', lineHeight: 1.35 })
        ]},
        { id: 'week', name: 'Lịch tuần', category: 'work', objects: [
            text('TUẦN CỦA TÔI', 8, 4, 234, 20, 17, COLORS.black, { bold: true, align: 'center' }), line(8, 28, 234, 0, COLORS.red, 2),
            ...['T2','T3','T4','T5','T6','T7','CN'].map((d, i) => text(d, 8 + i * 34, 33, 30, 14, 10, i === 6 ? COLORS.red : COLORS.black, { bold: true, align: 'center' })),
            ...Array.from({length: 8}, (_, i) => line(8 + i * 33.4, 31, 0, 88, '#777777', 1)),
            ...Array.from({length: 5}, (_, i) => line(8, 48 + i * 18, 234, 0, '#aaaaaa', 1))
        ]},
        { id: 'habit', name: 'Theo dõi thói quen', category: 'work', objects: [
            text('HABIT TRACKER', 9, 5, 155, 20, 18, COLORS.black, { bold: true }), text('{{date}}', 169, 7, 72, 16, 11, COLORS.red, { align: 'right' }),
            text('Uống nước', 10, 34, 78, 13, 11), text('Đọc sách', 10, 55, 78, 13, 11), text('Vận động', 10, 76, 78, 13, 11), text('Ngủ sớm', 10, 97, 78, 13, 11),
            ...Array.from({length: 28}, (_, i) => rect(94 + (i % 7) * 21, 32 + Math.floor(i / 7) * 21, 14, 14, COLORS.white, i % 7 === 6 ? COLORS.red : COLORS.black, 1))
        ]},
        { id: 'focus', name: 'Chế độ tập trung', category: 'work', objects: [
            text('FOCUS', 10, 8, 230, 25, 24, COLORS.red, { bold: true, align: 'center' }), text('25:00', 10, 36, 230, 50, 49, COLORS.black, { bold: true, align: 'center' }), line(60, 91, 130, 0, COLORS.black, 2), text('Đừng làm phiền • Đang làm việc sâu', 10, 99, 230, 18, 12, COLORS.black, { align: 'center' })
        ]},
        { id: 'badge', name: 'Bảng tên', category: 'personal', objects: [
            rect(0, 0, 250, 22, COLORS.red, COLORS.red, 0), text('XIN CHÀO, TÔI LÀ', 10, 2, 230, 18, 11, COLORS.white, { bold: true, align: 'center' }), text('TÊN CỦA BẠN', 10, 34, 230, 38, 30, COLORS.black, { bold: true, align: 'center' }), line(30, 80, 190, 0, COLORS.black, 2), text('Chức danh / Nhóm / Sự kiện', 10, 88, 230, 21, 14, COLORS.red, { align: 'center' })
        ]},
        { id: 'business', name: 'Danh thiếp', category: 'personal', objects: [
            rect(0, 0, 9, 128, COLORS.red, COLORS.red, 0), text('NGUYỄN VĂN A', 21, 16, 150, 26, 23, COLORS.black, { bold: true }), text('PRODUCT DESIGNER', 22, 44, 145, 16, 11, COLORS.red, { bold: true }), line(22, 66, 145, 0, COLORS.black, 1), text('hello@example.com\n090 123 4567\nexample.com', 22, 73, 145, 45, 11, COLORS.black, { valign: 'top', lineHeight: 1.4 }), qr('https://example.com', 183, 38, 55)
        ]},
        { id: 'wifi', name: 'Wi-Fi QR', category: 'personal', objects: [
            qr('WIFI:T:WPA;S:TEN_WIFI;P:MAT_KHAU;;', 13, 14, 96), text('WI-FI', 123, 17, 110, 30, 28, COLORS.black, { bold: true, align: 'center' }), text('Quét để kết nối', 123, 48, 110, 18, 12, COLORS.red, { bold: true, align: 'center' }), text('Tên mạng\nTEN_WIFI', 123, 74, 110, 37, 12, COLORS.black, { align: 'center', bold: true })
        ]},
        { id: 'contact', name: 'Liên hệ khẩn cấp', category: 'personal', objects: [
            rect(0, 0, 250, 25, COLORS.red, COLORS.red, 0), text('THÔNG TIN KHẨN CẤP', 8, 2, 234, 20, 16, COLORS.white, { bold: true, align: 'center' }), text('Tên: NGUYỄN VĂN A\nLiên hệ: 090 123 4567\nNhóm máu: O+\nLưu ý: __________________', 15, 35, 220, 82, 15, COLORS.black, { valign: 'top', lineHeight: 1.35 })
        ]},
        { id: 'quote', name: 'Câu truyền cảm hứng', category: 'personal', objects: [
            text('“', 8, 0, 38, 45, 42, COLORS.red, { bold: true }), text('Bắt đầu từ nơi bạn đang đứng.\nDùng những gì bạn đang có.', 32, 22, 205, 58, 18, COLORS.black, { bold: true, align: 'center', lineHeight: 1.25 }), line(73, 91, 104, 0, COLORS.red, 2), text('MỖI NGÀY MỘT BƯỚC NHỎ', 20, 100, 210, 16, 10, COLORS.black, { align: 'center', bold: true })
        ]},
        { id: 'weather', name: 'Thời tiết', category: 'info', objects: [
            text('{{weather_city}}', 10, 8, 150, 21, 18, COLORS.black, { bold: true }), text('{{weekday}}, {{date}}', 10, 30, 150, 16, 11, COLORS.red), icon('☀', 166, 8, 72, 66, COLORS.red), text('{{weather_temp}}°', 10, 52, 142, 50, 45, COLORS.black, { bold: true }), text('{{weather_desc}}', 12, 102, 226, 17, 12, COLORS.black)
        ]},
        { id: 'calendar', name: 'Lịch ngày', category: 'info', objects: [
            rect(9, 8, 82, 109, COLORS.white, COLORS.black, 2), rect(9, 8, 82, 27, COLORS.red, COLORS.red, 0), text('{{month}}', 12, 10, 76, 21, 13, COLORS.white, { bold: true, align: 'center' }), text('{{day}}', 12, 39, 76, 54, 45, COLORS.black, { bold: true, align: 'center' }), text('{{weekday}}', 12, 95, 76, 17, 11, COLORS.red, { bold: true, align: 'center' }), text('LỊCH HÔM NAY', 106, 9, 134, 19, 16, COLORS.black, { bold: true }), line(106, 31, 134, 0, COLORS.red, 2), text('{{event1}}\n{{event2}}\n{{event3}}', 106, 38, 134, 78, 12, COLORS.black, { valign: 'top', lineHeight: 1.6 })
        ]},
        { id: 'countdown', name: 'Đếm ngược', category: 'info', objects: [
            text('CÒN LẠI', 10, 8, 230, 18, 15, COLORS.red, { bold: true, align: 'center' }), text('{{countdown}}', 10, 27, 230, 59, 55, COLORS.black, { bold: true, align: 'center' }), text('NGÀY ĐẾN SỰ KIỆN', 10, 87, 230, 23, 18, COLORS.black, { bold: true, align: 'center' }), line(73, 116, 104, 0, COLORS.red, 2)
        ]},
        { id: 'meeting', name: 'Phòng họp', category: 'info', objects: [
            rect(0, 0, 250, 34, COLORS.black, COLORS.black, 0), text('PHÒNG ĐANG BẬN', 8, 4, 234, 26, 20, COLORS.white, { bold: true, align: 'center' }), text('{{event1}}', 12, 44, 226, 30, 23, COLORS.black, { bold: true, align: 'center' }), text('10:00 — 11:00', 12, 79, 226, 21, 16, COLORS.red, { bold: true, align: 'center' }), text('Vui lòng quay lại sau', 12, 104, 226, 15, 11, COLORS.black, { align: 'center' })
        ]},
        { id: 'menu', name: 'Thực đơn', category: 'life', objects: [
            text('THỰC ĐƠN HÔM NAY', 10, 7, 230, 23, 19, COLORS.black, { bold: true, align: 'center' }), line(54, 34, 142, 0, COLORS.red, 2), text('SÁNG', 13, 42, 50, 16, 11, COLORS.red, { bold: true }), text('Bánh mì • Cà phê', 68, 42, 168, 16, 12), text('TRƯA', 13, 67, 50, 16, 11, COLORS.red, { bold: true }), text('Cơm • Canh • Rau', 68, 67, 168, 16, 12), text('TỐI', 13, 92, 50, 16, 11, COLORS.red, { bold: true }), text('Món ăn của bạn', 68, 92, 168, 16, 12)
        ]},
        { id: 'shopping', name: 'Danh sách mua sắm', category: 'life', objects: [
            text('ĐI CHỢ', 10, 5, 105, 25, 22, COLORS.black, { bold: true }), text('{{date}}', 140, 8, 100, 18, 12, COLORS.red, { bold: true, align: 'right' }), line(10, 34, 230, 0, COLORS.black, 2), text('□ Rau củ\n□ Thịt / cá\n□ Trái cây\n□ Sữa\n□ Khác: ______________', 15, 42, 220, 78, 14, COLORS.black, { valign: 'top', lineHeight: 1.28 })
        ]},
        { id: 'water', name: 'Nhắc uống nước', category: 'life', objects: [
            icon('◉', 13, 22, 79, 79, COLORS.red), text('UỐNG NƯỚC', 97, 19, 141, 29, 23, COLORS.black, { bold: true, align: 'center' }), text('Mục tiêu: 8 cốc', 97, 49, 141, 16, 12, COLORS.red, { bold: true, align: 'center' }), text('○ ○ ○ ○\n○ ○ ○ ○', 97, 70, 141, 41, 22, COLORS.black, { align: 'center', bold: true, lineHeight: 1.1 })
        ]},
        { id: 'minimal_clock', name: 'Đồng hồ snapshot', category: 'info', objects: [
            text('{{time}}', 8, 10, 234, 66, 60, COLORS.black, { bold: true, align: 'center' }), line(62, 82, 126, 0, COLORS.red, 2), text('{{weekday}} • {{date}}', 10, 91, 230, 22, 16, COLORS.red, { bold: true, align: 'center' })
        ]},
        { id: 'month_calendar', name: 'Lịch tháng', category: 'info', objects: [
            text('{{month}}', 8, 4, 150, 22, 19, COLORS.black, { bold: true }), text('{{day}}', 184, 1, 56, 28, 28, COLORS.red, { bold: true, align: 'right' }),
            { id: uid(), type: 'calendar', x: 8, y: 31, w: 234, h: 89, color: COLORS.black, accent: COLORS.red }
        ]},
        { id: 'calendar_events', name: 'Lịch và sự kiện', category: 'info', objects: [
            { id: uid(), type: 'calendar', x: 7, y: 7, w: 135, h: 114, color: COLORS.black, accent: COLORS.red },
            text('SỰ KIỆN', 153, 8, 88, 18, 14, COLORS.red, { bold: true }), line(153, 29, 88, 0, COLORS.black, 1), text('{{event1}}\n{{event2}}\n{{event3}}', 153, 36, 88, 78, 10, COLORS.black, { valign: 'top', lineHeight: 1.55 })
        ]},
        { id: 'calendar_minimal', name: 'Lịch tối giản', category: 'info', objects: [
            text('{{weekday}}', 12, 8, 226, 23, 19, COLORS.red, { bold: true, align: 'center' }), text('{{day}}', 10, 27, 230, 64, 61, COLORS.black, { bold: true, align: 'center' }), line(76, 96, 98, 0, COLORS.red, 2), text('{{month}}', 10, 101, 230, 18, 13, COLORS.black, { bold: true, align: 'center' })
        ]},
        { id: 'flip_clock', name: 'Đồng hồ flip', category: 'info', objects: [
            rect(12, 14, 226, 71, COLORS.black, COLORS.black, 2, { radius: 5 }), text('{{time}}', 18, 17, 214, 62, 53, COLORS.white, { bold: true, align: 'center' }), line(14, 50, 222, 0, '#666666', 1), text('{{weekday}}', 12, 91, 110, 19, 14, COLORS.red, { bold: true }), text('{{date}}', 128, 91, 110, 19, 14, COLORS.black, { bold: true, align: 'right' })
        ]},
        { id: 'analog_clock', name: 'Đồng hồ kim', category: 'info', objects: [
            { id: uid(), type: 'analog', x: 8, y: 7, w: 112, h: 112, color: COLORS.black, accent: COLORS.red },
            text('{{time}}', 132, 17, 106, 38, 32, COLORS.black, { bold: true, align: 'center' }), text('{{weekday}}', 132, 60, 106, 18, 14, COLORS.red, { bold: true, align: 'center' }), text('{{date}}', 132, 82, 106, 18, 12, COLORS.black, { align: 'center' }), { id: uid(), type: 'pixel', pattern: 'clock', x: 168, y: 103, w: 28, h: 28 }
        ]},
        { id: 'clock_weather', name: 'Đồng hồ và thời tiết', category: 'info', objects: [
            text('{{time}}', 8, 9, 146, 55, 48, COLORS.black, { bold: true }), text('{{weekday}} • {{date}}', 10, 69, 144, 18, 12, COLORS.red, { bold: true }), line(162, 9, 0, 106, COLORS.black, 2), { id: uid(), type: 'pixel', pattern: 'sun', x: 181, y: 8, w: 50, h: 50 }, text('{{weather_temp}}°', 171, 62, 69, 30, 26, COLORS.black, { bold: true, align: 'center' }), text('{{weather_desc}}', 169, 95, 73, 22, 9, COLORS.red, { bold: true, align: 'center' })
        ]},
        { id: 'clock_focus', name: 'Đồng hồ tập trung', category: 'work', objects: [
            text('ĐANG TẬP TRUNG', 10, 7, 230, 18, 13, COLORS.red, { bold: true, align: 'center' }), text('{{time}}', 10, 28, 230, 58, 55, COLORS.black, { bold: true, align: 'center' }), rect(39, 92, 172, 8, COLORS.white, COLORS.black, 1), rect(40, 93, 104, 6, COLORS.red, COLORS.red, 0), text('Không làm phiền', 10, 105, 230, 14, 10, COLORS.black, { align: 'center' })
        ]},
        { id: 'clock_quote', name: 'Đồng hồ và câu nhắc', category: 'personal', objects: [
            text('{{time}}', 11, 10, 91, 46, 40, COLORS.black, { bold: true }), text('{{date}}', 12, 57, 90, 17, 11, COLORS.red, { bold: true }), line(112, 9, 0, 110, COLORS.red, 2), text('“Làm điều quan trọng trước.”', 126, 20, 110, 60, 19, COLORS.black, { bold: true, align: 'center', lineHeight: 1.22 }), { id: uid(), type: 'pixel', pattern: 'check', x: 161, y: 86, w: 40, h: 40 }
        ]},
        { id: 'lunar_calendar', name: 'Âm dương lịch', category: 'info', objects: [
            text('{{weekday}}', 10, 5, 230, 17, 13, COLORS.red, { bold: true, align: 'center' }), text('{{day}}', 9, 20, 93, 63, 59, COLORS.black, { bold: true, align: 'center' }), text('{{month}}', 10, 84, 91, 17, 11, COLORS.black, { bold: true, align: 'center' }), line(111, 10, 0, 106, COLORS.red, 2), text('ÂM LỊCH', 125, 13, 110, 17, 13, COLORS.red, { bold: true, align: 'center' }), text('{{lunar_day}}', 126, 30, 108, 45, 42, COLORS.black, { bold: true, align: 'center' }), text('Tháng {{lunar_month}} • {{lunar_year}}{{lunar_leap}}', 120, 78, 120, 19, 11, COLORS.black, { bold: true, align: 'center' }), text('{{lunar_full}}', 120, 100, 120, 17, 9, COLORS.red, { align: 'center' })
        ]},
        { id: 'blank', name: 'Trang trắng', category: 'personal', objects: [] }
    ];

    const DYNAMIC_WIDGETS = {
        digitalTime: { name: 'Giờ số', sample: '12:34', create: () => text('{{time}}', 0, 0, 118, 42, 36, COLORS.black, { bold: true, align: 'center' }) },
        date: { name: 'Ngày đầy đủ', sample: '23/09/2026', create: () => text('{{date}}', 0, 0, 110, 22, 14, COLORS.black, { bold: true, align: 'center' }) },
        weekday: { name: 'Thứ', sample: 'Thứ Tư', create: () => text('{{weekday}}', 0, 0, 104, 22, 15, COLORS.red, { bold: true, align: 'center' }) },
        dayNumber: { name: 'Ngày lớn', sample: '23', create: () => text('{{day}}', 0, 0, 66, 60, 52, COLORS.black, { bold: true, align: 'center' }) },
        month: { name: 'Tháng', sample: 'THÁNG 9', create: () => text('{{month}}', 0, 0, 110, 22, 15, COLORS.red, { bold: true, align: 'center' }) },
        monthCalendar: { name: 'Lịch tháng', sample: 'T2  T3  T4', create: () => ({ id: uid(), type: 'calendar', x: 0, y: 0, w: 150, h: 105, color: COLORS.black, accent: COLORS.red }) },
        analogClock: { name: 'Đồng hồ kim', sample: '◷', create: () => ({ id: uid(), type: 'analog', x: 0, y: 0, w: 94, h: 94, color: COLORS.black, accent: COLORS.red }) },
        countdown: { name: 'Đếm ngược', sample: 'Còn 7 ngày', create: () => text('Còn {{countdown}} ngày', 0, 0, 126, 28, 19, COLORS.red, { bold: true, align: 'center' }) },
        events: { name: 'Sự kiện', sample: '09:00 Họp', create: () => text('{{event1}}\n{{event2}}\n{{event3}}', 0, 0, 132, 62, 12, COLORS.black, { valign: 'top', lineHeight: 1.55 }) },
        weather: { name: 'Thời tiết', sample: '30° Trời quang', create: () => text('{{weather_temp}}°\n{{weather_desc}}', 0, 0, 110, 48, 20, COLORS.black, { bold: true, align: 'center', lineHeight: 1.2 }) },
        weatherCity: { name: 'Địa điểm', sample: 'TP. HCM', create: () => text('{{weather_city}}', 0, 0, 116, 22, 13, COLORS.red, { bold: true, align: 'center' }) },
        lunarDate: { name: 'Ngày âm lịch', sample: '12 tháng 8 ÂL', create: () => text('{{lunar_day}} tháng {{lunar_month}} ÂL', 0, 0, 130, 25, 16, COLORS.red, { bold: true, align: 'center' }) },
        lunarFull: { name: 'Âm lịch đầy đủ', sample: '12/8 năm Bính Ngọ', create: () => text('{{lunar_full}}', 0, 0, 150, 38, 14, COLORS.black, { bold: true, align: 'center' }) },
        lunarMonthCalendar: { name: 'Lịch tháng âm–dương', sample: 'Dương / Âm', create: () => ({ id: uid(), type: 'calendar', x: 0, y: 0, w: 172, h: 112, color: COLORS.black, accent: COLORS.red, showLunar: true }) }
        ,batteryLevel: { name: 'Dung lượng pin', sample: '▰ 75%', create: () => ({ id: uid(), type: 'battery', x: 0, y: 0, w: 112, h: 34, color: COLORS.black, accent: COLORS.red }) }
    };

    const root = document.getElementById('template-studio-root');
    if (!root) return;

    root.innerHTML = `
      <div class="studio-shell">
        <header class="studio-topbar">
          <div class="studio-brand"><div class="studio-brand-mark">E</div><div><h2>E‑Ink Template Studio</h2><p>nRF52 • 2.13” • 250×128 • Đen / Trắng / Đỏ</p></div></div>
          <div class="studio-top-actions">
            <button id="studio-save" class="studio-button-dark">Lưu trên máy</button>
            <button id="studio-export" class="studio-button-dark">Xuất JSON</button>
            <button id="studio-import" class="studio-button-dark">Nhập JSON</button>
            <button id="studio-png" class="studio-button-light">Tải PNG</button>
            <button id="studio-send" class="studio-button-red">Gửi lên màn hình</button>
            <button id="studio-auto-sync" class="studio-button-auto" aria-pressed="false">Tự đồng bộ: Tắt</button>
            <input id="studio-import-file" class="studio-hidden-input" type="file" accept="application/json,.json">
          </div>
        </header>
        <div class="studio-layout">
          <aside class="studio-sidebar">
            <h3 class="studio-section-title">Thư viện mẫu <span id="studio-template-count"></span></h3>
            <input id="studio-search" class="studio-search" type="search" placeholder="Tìm template…">
            <div class="studio-filter-row">
              <button class="studio-filter active" data-filter="all">Tất cả</button><button class="studio-filter" data-filter="work">Công việc</button><button class="studio-filter" data-filter="personal">Cá nhân</button><button class="studio-filter" data-filter="info">Thông tin</button><button class="studio-filter" data-filter="life">Đời sống</button>
            </div>
            <div id="studio-template-list" class="studio-template-list"></div>
          </aside>
          <main class="studio-main">
            <div class="studio-toolbar">
              <button class="studio-tool-button active" data-tool="select" title="Chọn và di chuyển">↖ Chọn</button>
              <button class="studio-tool-button" data-add="text">T Chữ</button><button class="studio-tool-button" data-add="rect">▭ Khối</button><button class="studio-tool-button" data-add="line">╱ Đường</button><button class="studio-tool-button" data-add="icon">★ Biểu tượng</button><button class="studio-tool-button" data-add="dynamic">◷ Dữ liệu động</button><button class="studio-tool-button" data-add="pixel">▦ Pixel & Widget</button><button class="studio-tool-button" data-add="qr">▦ QR</button><button class="studio-tool-button" data-add="image">▧ Ảnh</button>
              <span class="studio-toolbar-divider"></span><button id="studio-undo" class="studio-tool-button" title="Hoàn tác">↶</button><button id="studio-redo" class="studio-tool-button" title="Làm lại">↷</button><button id="studio-duplicate" class="studio-tool-button">⧉</button><button id="studio-delete" class="studio-tool-button">⌫</button>
              <input id="studio-image-file" class="studio-hidden-input" type="file" accept="image/*">
            </div>
            <div class="studio-canvas-stage"><div class="studio-canvas-wrap"><canvas id="studio-canvas" width="250" height="128"></canvas><div class="studio-canvas-label">Kéo để di chuyển • kéo ô vuông góc phải dưới để đổi kích thước</div></div></div>
            <div class="studio-statusbar"><span id="studio-status">Sẵn sàng</span><span id="studio-auto-sync-status">Ảnh là snapshot. Bật Tự đồng bộ để gửi lại khi sang ngày mới.</span></div>
          </main>
          <aside class="studio-inspector"><div class="studio-inspector-inner">
            <section class="studio-inspector-section"><h3 class="studio-section-title">Thuộc tính</h3><div id="studio-properties" class="studio-empty">Chọn một thành phần trên canvas.</div></section>
            <section class="studio-inspector-section"><h3 class="studio-section-title">Dữ liệu động</h3>
              <div class="studio-data-note">Dùng biến: <code>{{time}}</code>, <code>{{date}}</code>, <code>{{weekday}}</code>, <code>{{lunar_full}}</code>, <code>{{battery_percent}}</code>, <code>{{countdown}}</code>, <code>{{event1}}</code>…</div>
              <label class="studio-field"><span>Ngày đếm ngược</span><input id="studio-countdown-date" type="date"></label>
              <label class="studio-field"><span>Sự kiện 1</span><input id="studio-event-1" value="09:00 Họp nhóm"></label><label class="studio-field"><span>Sự kiện 2</span><input id="studio-event-2" value="14:00 Công việc sâu"></label><label class="studio-field"><span>Sự kiện 3</span><input id="studio-event-3" value="18:30 Tập thể thao"></label>
              <div class="studio-action-row"><button id="studio-ics" class="studio-button-ghost">Nhập lịch .ics</button><button id="studio-refresh-data" class="studio-button-ghost">Cập nhật giờ</button><input id="studio-ics-file" class="studio-hidden-input" type="file" accept=".ics,text/calendar"></div>
              <h3 class="studio-section-title" style="margin-top:14px">Thời tiết</h3><div class="studio-data-grid"><label class="studio-field"><span>Vĩ độ</span><input id="studio-lat" type="number" step="any" value="10.8231"></label><label class="studio-field"><span>Kinh độ</span><input id="studio-lon" type="number" step="any" value="106.6297"></label></div><label class="studio-field"><span>Tên địa điểm</span><input id="studio-city" value="TP. Hồ Chí Minh"></label><button id="studio-weather" class="studio-button-ghost">Lấy thời tiết hiện tại</button>
              <h3 class="studio-section-title" style="margin-top:14px">Dung lượng pin</h3><label class="studio-field"><span>Pin (%)</span><input id="studio-battery-percent" type="number" min="0" max="100" value="75"></label><div id="studio-battery-source" class="studio-data-note">Giá trị thủ công. Khi thiết bị hỗ trợ Battery Service, website sẽ tự cập nhật.</div>
            </section>
            <section class="studio-inspector-section"><h3 class="studio-section-title">Dynamic Widgets <small>Kéo hoặc chạm để thêm</small></h3><div id="studio-dynamic-gallery" class="studio-dynamic-gallery"></div></section>
            <section class="studio-inspector-section"><h3 class="studio-section-title">Pixel art & Widget</h3><div id="studio-pixel-gallery" class="studio-pixel-gallery"></div></section>
            <section class="studio-inspector-section"><h3 class="studio-section-title">Lớp</h3><div id="studio-layer-list" class="studio-layer-list"></div></section>
          </div></aside>
        </div>
      </div><div id="studio-toast" class="studio-toast"></div>`;

    const canvas = document.getElementById('studio-canvas');
    const ctx = canvas.getContext('2d');
    const state = { objects: [], selectedId: null, templateId: null, history: [], future: [], weather: { city: 'TP. Hồ Chí Minh', temp: '--', desc: 'Chưa cập nhật thời tiết' }, filter: 'all', query: '', dragging: null, autoSync: { enabled: false, lastDate: '', lastSuccess: '', lastError: '', busy: false, nextRetryAt: 0 } };
    const byId = id => document.getElementById(id);
    const selected = () => state.objects.find(o => o.id === state.selectedId);
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    let toastTimer;

    function toast(message, error = false) {
        const el = byId('studio-toast'); el.textContent = message; el.className = `studio-toast visible${error ? ' error' : ''}`;
        clearTimeout(toastTimer); toastTimer = setTimeout(() => el.className = 'studio-toast', 2600);
    }

    // Vietnamese astronomical lunar calendar, adapted from Hồ Ngọc Đức's
    // published algorithm. Vietnam time zone is fixed at UTC+7.
    const lunarInt = Math.floor;
    function lunarJdFromDate(day, month, year) {
        const a = lunarInt((14 - month) / 12), y = year + 4800 - a, m = month + 12 * a - 3;
        let jd = day + lunarInt((153 * m + 2) / 5) + 365 * y + lunarInt(y / 4) - lunarInt(y / 100) + lunarInt(y / 400) - 32045;
        if (jd < 2299161) jd = day + lunarInt((153 * m + 2) / 5) + 365 * y + lunarInt(y / 4) - 32083;
        return jd;
    }
    function lunarNewMoonDay(k, timeZone = 7) {
        const T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = Math.PI / 180;
        let jd = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
        jd += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
        const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
        const Mp = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
        const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
        const c1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * M * dr) - 0.4068 * Math.sin(Mp * dr) + 0.0161 * Math.sin(2 * Mp * dr) - 0.0004 * Math.sin(3 * Mp * dr) + 0.0104 * Math.sin(2 * F * dr) - 0.0051 * Math.sin((M + Mp) * dr) - 0.0074 * Math.sin((M - Mp) * dr) + 0.0004 * Math.sin((2 * F + M) * dr) - 0.0004 * Math.sin((2 * F - M) * dr) - 0.0006 * Math.sin((2 * F + Mp) * dr) + 0.0010 * Math.sin((2 * F - Mp) * dr) + 0.0005 * Math.sin((2 * Mp + M) * dr);
        const deltaT = T < -11 ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3 : -0.000278 + 0.000265 * T + 0.000262 * T2;
        return lunarInt(jd + c1 - deltaT + 0.5 + timeZone / 24);
    }
    function lunarSunLongitude(jdn, timeZone = 7) {
        const T = (jdn - 2451545.5 - timeZone / 24) / 36525, T2 = T * T, dr = Math.PI / 180;
        const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
        const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
        const dl = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M) + (0.019993 - 0.000101 * T) * Math.sin(2 * dr * M) + 0.000290 * Math.sin(3 * dr * M);
        let L = (L0 + dl) * dr; L -= Math.PI * 2 * lunarInt(L / (Math.PI * 2));
        return lunarInt(L / Math.PI * 6);
    }
    function lunarMonth11(year, timeZone = 7) {
        const off = lunarJdFromDate(31, 12, year) - 2415021, k = lunarInt(off / 29.530588853);
        let nm = lunarNewMoonDay(k, timeZone); if (lunarSunLongitude(nm, timeZone) >= 9) nm = lunarNewMoonDay(k - 1, timeZone); return nm;
    }
    function lunarLeapMonthOffset(a11, timeZone = 7) {
        const k = lunarInt((a11 - 2415021.076998695) / 29.530588853 + 0.5); let last = 0, i = 1, arc = lunarSunLongitude(lunarNewMoonDay(k + i, timeZone), timeZone);
        do { last = arc; i++; arc = lunarSunLongitude(lunarNewMoonDay(k + i, timeZone), timeZone); } while (arc !== last && i < 14);
        return i - 1;
    }
    function solarToVietnameseLunar(day, month, year) {
        const timeZone = 7, dayNumber = lunarJdFromDate(day, month, year); let k = lunarInt((dayNumber - 2415021.076998695) / 29.530588853), monthStart = lunarNewMoonDay(k + 1, timeZone);
        if (monthStart > dayNumber) monthStart = lunarNewMoonDay(k, timeZone);
        let a11 = lunarMonth11(year, timeZone), b11 = a11, lunarYear;
        if (a11 >= monthStart) { lunarYear = year; a11 = lunarMonth11(year - 1, timeZone); } else { lunarYear = year + 1; b11 = lunarMonth11(year + 1, timeZone); }
        const lunarDay = dayNumber - monthStart + 1, diff = lunarInt((monthStart - a11) / 29); let lunarLeap = 0, lunarMonth = diff + 11;
        if (b11 - a11 > 365) { const leapDiff = lunarLeapMonthOffset(a11, timeZone); if (diff >= leapDiff) { lunarMonth = diff + 10; if (diff === leapDiff) lunarLeap = 1; } }
        if (lunarMonth > 12) lunarMonth -= 12; if (lunarMonth >= 11 && diff < 4) lunarYear--;
        return { day: lunarDay, month: lunarMonth, year: lunarYear, leap: lunarLeap === 1 };
    }
    function lunarYearName(year) {
        const stems = ['Canh','Tân','Nhâm','Quý','Giáp','Ất','Bính','Đinh','Mậu','Kỷ'];
        const branches = ['Thân','Dậu','Tuất','Hợi','Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi'];
        return `${stems[year % 10]} ${branches[year % 12]}`;
    }

    function variables() {
        const now = new Date();
        const lunar = solarToVietnameseLunar(now.getDate(), now.getMonth() + 1, now.getFullYear());
        const target = byId('studio-countdown-date')?.value;
        const days = target ? Math.max(0, Math.ceil((new Date(`${target}T23:59:59`) - now) / 86400000)) : '--';
        return {
            time: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), date: now.toLocaleDateString('vi-VN'), weekday: now.toLocaleDateString('vi-VN', { weekday: 'long' }),
            day: String(now.getDate()).padStart(2, '0'), month: now.toLocaleDateString('vi-VN', { month: 'long' }).toUpperCase(), countdown: String(days),
            event1: byId('studio-event-1')?.value || 'Chưa có sự kiện', event2: byId('studio-event-2')?.value || '', event3: byId('studio-event-3')?.value || '',
            weather_city: state.weather.city, weather_temp: state.weather.temp, weather_desc: state.weather.desc,
            lunar_day: String(lunar.day), lunar_month: String(lunar.month), lunar_year: lunarYearName(lunar.year), lunar_leap: lunar.leap ? ' nhuận' : '',
            lunar_full: `${lunar.day}/${lunar.month}${lunar.leap ? ' nhuận' : ''} năm ${lunarYearName(lunar.year)}`,
            battery_percent: String(clamp(Number(byId('studio-battery-percent')?.value ?? 75), 0, 100))
        };
    }

    function resolve(value) { const vars = variables(); return String(value ?? '').replace(/{{(\w+)}}/g, (_, key) => vars[key] ?? `{{${key}}}`); }
    function rounded(ctx2, x, y, w, h, r = 4) { const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2); ctx2.beginPath(); ctx2.roundRect ? ctx2.roundRect(x, y, w, h, rr) : ctx2.rect(x, y, w, h); }
    function wrapLines(ctx2, value, maxWidth) {
        const result = []; String(value).split('\n').forEach(paragraph => { const words = paragraph.split(' '); let current = ''; words.forEach(word => { const test = current ? `${current} ${word}` : word; if (current && ctx2.measureText(test).width > maxWidth) { result.push(current); current = word; } else current = test; }); result.push(current); }); return result;
    }

    function drawObject(ctx2, o, preview = false) {
        ctx2.save(); ctx2.globalAlpha = o.opacity ?? 1;
        if (o.type === 'rect') { rounded(ctx2, o.x, o.y, o.w, o.h, o.radius || 0); ctx2.fillStyle = o.fill || COLORS.white; ctx2.fill(); if (o.strokeWidth) { ctx2.strokeStyle = o.stroke || COLORS.black; ctx2.lineWidth = o.strokeWidth; ctx2.stroke(); } }
        if (o.type === 'line') { ctx2.beginPath(); ctx2.moveTo(o.x, o.y); ctx2.lineTo(o.x + o.w, o.y + o.h); ctx2.strokeStyle = o.color || COLORS.black; ctx2.lineWidth = o.strokeWidth || 1; ctx2.stroke(); }
        if (o.type === 'circle') { ctx2.beginPath(); ctx2.arc(o.x + o.w / 2, o.y + o.h / 2, Math.min(o.w, o.h) / 2, 0, Math.PI * 2); ctx2.fillStyle = o.fill || COLORS.white; ctx2.fill(); if (o.strokeWidth) { ctx2.strokeStyle = o.stroke || COLORS.black; ctx2.lineWidth = o.strokeWidth; ctx2.stroke(); } }
        if (o.type === 'stamp') { ctx2.save(); ctx2.translate(o.x, o.y); ctx2.rotate(o.angle || 0); ctx2.fillStyle = COLORS.red; ctx2.fillRect(-o.w / 2, -o.h / 2, o.w, o.h); ctx2.strokeStyle = COLORS.white; ctx2.lineWidth = 1; ctx2.strokeRect(-o.w / 2 + 3, -o.h / 2 + 3, o.w - 6, o.h - 6); ctx2.fillStyle = COLORS.white; ctx2.font = '700 27px Arial'; ctx2.textAlign = 'center'; ctx2.textBaseline = 'middle'; ctx2.fillText(o.text, 0, 1); ctx2.restore(); }
        if (o.type === 'text' || o.type === 'icon') {
            const size = o.fontSize || 14; ctx2.fillStyle = o.color || COLORS.black; ctx2.font = `${o.italic ? 'italic ' : ''}${o.bold ? '700 ' : '400 '}${size}px ${o.fontFamily || 'Arial'}`; ctx2.textAlign = o.align || 'left'; ctx2.textBaseline = 'top';
            const lines = wrapLines(ctx2, resolve(o.text), Math.max(4, o.w)); const lh = size * (o.lineHeight || 1.15); const total = lines.length * lh; let yy = o.y + (o.valign === 'top' ? 0 : o.valign === 'bottom' ? o.h - total : (o.h - total) / 2); const xx = o.align === 'center' ? o.x + o.w / 2 : o.align === 'right' ? o.x + o.w : o.x;
            ctx2.beginPath(); ctx2.rect(o.x, o.y, o.w, o.h); ctx2.clip(); lines.forEach((l, i) => { const lineY = yy + i * lh; ctx2.fillText(l, xx, lineY); if (o.underline) { const tw = ctx2.measureText(l).width; const startX = o.align === 'center' ? xx - tw / 2 : o.align === 'right' ? xx - tw : xx; ctx2.beginPath(); ctx2.moveTo(startX, lineY + size + 1); ctx2.lineTo(startX + tw, lineY + size + 1); ctx2.lineWidth = Math.max(1, size / 12); ctx2.strokeStyle = o.color || COLORS.black; ctx2.stroke(); } });
        }
        if (o.type === 'image' && o.imageElement) { ctx2.drawImage(o.imageElement, o.x, o.y, o.w, o.h); }
        if (o.type === 'pixel') drawPixelArt(ctx2, o);
        if (o.type === 'calendar') drawCalendarWidget(ctx2, o);
        if (o.type === 'analog') drawAnalogClock(ctx2, o);
        if (o.type === 'battery') drawBatteryWidget(ctx2, o);
        if (o.type === 'qr') drawQr(ctx2, o);
        ctx2.restore();
        if (!preview && o.id === state.selectedId) { ctx2.save(); ctx2.strokeStyle = '#2477ff'; ctx2.lineWidth = 1; ctx2.setLineDash([3, 2]); ctx2.strokeRect(o.x - 2, o.y - 2, o.w + 4, o.h + 4); ctx2.setLineDash([]); ctx2.fillStyle = '#2477ff'; ctx2.fillRect(o.x + o.w - 3, o.y + o.h - 3, 7, 7); ctx2.restore(); }
    }

    function drawPixelArt(ctx2, o) {
        const art = PIXEL_ART[o.pattern];
        if (!art) return;
        const rows = art.rows, columns = Math.max(...rows.map(row => row.length));
        const cellW = o.w / columns, cellH = o.h / rows.length;
        rows.forEach((row, y) => [...row].forEach((pixel, x) => {
            const color = pixel === 'B' ? COLORS.black : pixel === 'R' ? COLORS.red : pixel === 'W' ? COLORS.white : null;
            if (!color) return;
            ctx2.fillStyle = color;
            ctx2.fillRect(o.x + x * cellW, o.y + y * cellH, Math.ceil(cellW), Math.ceil(cellH));
        }));
    }

    function drawCalendarWidget(ctx2, o) {
        const now = new Date(), year = now.getFullYear(), month = now.getMonth();
        const firstMondayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const headerH = Math.max(12, o.h * 0.18), cellW = o.w / 7, cellH = (o.h - headerH) / 6;
        const labels = ['T2','T3','T4','T5','T6','T7','CN'];
        ctx2.save(); ctx2.strokeStyle = o.color || COLORS.black; ctx2.lineWidth = 0.7; ctx2.font = `700 ${Math.max(6, Math.min(9, cellH * 0.58))}px Arial`; ctx2.textAlign = 'center'; ctx2.textBaseline = 'middle';
        labels.forEach((label, i) => { ctx2.fillStyle = i === 6 ? (o.accent || COLORS.red) : (o.color || COLORS.black); ctx2.fillText(label, o.x + (i + .5) * cellW, o.y + headerH / 2); });
        for (let i = 0; i <= 7; i++) { ctx2.beginPath(); ctx2.moveTo(o.x + i * cellW, o.y + headerH); ctx2.lineTo(o.x + i * cellW, o.y + o.h); ctx2.stroke(); }
        for (let i = 0; i <= 6; i++) { ctx2.beginPath(); ctx2.moveTo(o.x, o.y + headerH + i * cellH); ctx2.lineTo(o.x + o.w, o.y + headerH + i * cellH); ctx2.stroke(); }
        ctx2.font = `700 ${Math.max(6, Math.min(10, cellH * (o.showLunar ? 0.48 : 0.62)))}px Arial`;
        for (let day = 1; day <= daysInMonth; day++) { const index = firstMondayIndex + day - 1, column = index % 7, row = Math.floor(index / 7), cellX = o.x + column * cellW, cellY = o.y + headerH + row * cellH, cx = cellX + cellW / 2, cy = cellY + cellH / 2; const today = day === now.getDate(); if (today) { ctx2.fillStyle = o.accent || COLORS.red; ctx2.fillRect(cellX + 1, cellY + 1, cellW - 2, cellH - 2); ctx2.fillStyle = COLORS.white; } else ctx2.fillStyle = column === 6 ? (o.accent || COLORS.red) : (o.color || COLORS.black); if (o.showLunar) { ctx2.textAlign = 'left'; ctx2.fillText(String(day), cellX + 2, cellY + cellH * .35); const lunar = solarToVietnameseLunar(day, month + 1, year); ctx2.textAlign = 'right'; ctx2.font = `400 ${Math.max(5, Math.min(8, cellH * .38))}px Arial`; ctx2.fillStyle = today ? COLORS.white : (o.accent || COLORS.red); ctx2.fillText(lunar.day === 1 ? `1/${lunar.month}` : String(lunar.day), cellX + cellW - 2, cellY + cellH * .72); ctx2.font = `700 ${Math.max(6, Math.min(10, cellH * .48))}px Arial`; } else { ctx2.textAlign = 'center'; ctx2.fillText(String(day), cx, cy); } }
        ctx2.restore();
    }

    function drawAnalogClock(ctx2, o) {
        const now = new Date(), cx = o.x + o.w / 2, cy = o.y + o.h / 2, radius = Math.min(o.w, o.h) / 2 - 3;
        ctx2.save(); ctx2.strokeStyle = o.color || COLORS.black; ctx2.fillStyle = COLORS.white; ctx2.lineWidth = 2; ctx2.beginPath(); ctx2.arc(cx, cy, radius, 0, Math.PI * 2); ctx2.fill(); ctx2.stroke();
        for (let i = 0; i < 12; i++) { const angle = i * Math.PI / 6 - Math.PI / 2, inner = radius - (i % 3 === 0 ? 8 : 4); ctx2.lineWidth = i % 3 === 0 ? 2 : 1; ctx2.beginPath(); ctx2.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner); ctx2.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius); ctx2.stroke(); }
        const minuteAngle = now.getMinutes() * Math.PI / 30 - Math.PI / 2, hourAngle = ((now.getHours() % 12) + now.getMinutes() / 60) * Math.PI / 6 - Math.PI / 2;
        ctx2.lineCap = 'round'; ctx2.lineWidth = 4; ctx2.beginPath(); ctx2.moveTo(cx, cy); ctx2.lineTo(cx + Math.cos(hourAngle) * radius * .5, cy + Math.sin(hourAngle) * radius * .5); ctx2.stroke(); ctx2.strokeStyle = o.accent || COLORS.red; ctx2.lineWidth = 2; ctx2.beginPath(); ctx2.moveTo(cx, cy); ctx2.lineTo(cx + Math.cos(minuteAngle) * radius * .72, cy + Math.sin(minuteAngle) * radius * .72); ctx2.stroke(); ctx2.fillStyle = o.accent || COLORS.red; ctx2.beginPath(); ctx2.arc(cx, cy, 3, 0, Math.PI * 2); ctx2.fill(); ctx2.restore();
    }

    function drawBatteryWidget(ctx2, o) {
        const percent = clamp(Number(byId('studio-battery-percent')?.value ?? 75), 0, 100);
        const labelWidth = Math.min(38, o.w * .38), bodyX = o.x, bodyY = o.y + o.h * .18, bodyW = Math.max(24, o.w - labelWidth - 6), bodyH = o.h * .64, tipW = Math.max(2, o.w * .035);
        ctx2.save(); ctx2.strokeStyle = o.color || COLORS.black; ctx2.lineWidth = Math.max(1, Math.min(2, o.h / 12)); ctx2.strokeRect(bodyX, bodyY, bodyW, bodyH); ctx2.fillStyle = o.color || COLORS.black; ctx2.fillRect(bodyX + bodyW, bodyY + bodyH * .28, tipW, bodyH * .44);
        const innerW = Math.max(0, (bodyW - 4) * percent / 100); ctx2.fillStyle = percent <= 20 ? (o.accent || COLORS.red) : (o.color || COLORS.black); ctx2.fillRect(bodyX + 2, bodyY + 2, innerW, Math.max(1, bodyH - 4));
        ctx2.font = `700 ${Math.max(8, Math.min(16, o.h * .43))}px Arial`; ctx2.textAlign = 'right'; ctx2.textBaseline = 'middle'; ctx2.fillStyle = percent <= 20 ? (o.accent || COLORS.red) : (o.color || COLORS.black); ctx2.fillText(`${Math.round(percent)}%`, o.x + o.w, o.y + o.h / 2); ctx2.restore();
    }

    function drawQr(ctx2, o) {
        ctx2.fillStyle = o.fill || COLORS.white; ctx2.fillRect(o.x, o.y, o.w, o.h);
        if (typeof window.qrcode !== 'function') { ctx2.strokeStyle = COLORS.black; ctx2.strokeRect(o.x, o.y, o.w, o.h); ctx2.font = 'bold 10px Arial'; ctx2.textAlign = 'center'; ctx2.fillStyle = COLORS.black; ctx2.fillText('QR', o.x + o.w / 2, o.y + o.h / 2 - 5); return; }
        try { const code = window.qrcode(0, o.errorCorrection || 'M'); code.addData(resolve(o.text)); code.make(); const count = code.getModuleCount(); const cell = Math.max(1, Math.floor(Math.min(o.w, o.h) / (count + 4))); const size = cell * count; const sx = o.x + (o.w - size) / 2, sy = o.y + (o.h - size) / 2; ctx2.fillStyle = o.color || COLORS.black; for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) if (code.isDark(r, c)) ctx2.fillRect(Math.round(sx + c * cell), Math.round(sy + r * cell), cell, cell); } catch (_) { /* invalid data is shown as blank */ }
    }

    function render() { ctx.fillStyle = COLORS.white; ctx.fillRect(0, 0, W, H); state.objects.forEach(o => drawObject(ctx, o)); byId('studio-status').textContent = `${state.objects.length} thành phần${selected() ? ` • Đang chọn: ${objectName(selected())}` : ''}`; }
    function renderTo(target, objects, preview = true) { const c = target.getContext('2d'); c.fillStyle = COLORS.white; c.fillRect(0, 0, target.width, target.height); const sx = target.width / W, sy = target.height / H; c.save(); c.scale(sx, sy); objects.forEach(o => drawObject(c, o, preview)); c.restore(); }
    function objectName(o) { return o.type === 'text' ? (resolve(o.text).slice(0, 18) || 'Chữ') : o.type === 'pixel' ? (PIXEL_ART[o.pattern]?.name || 'Pixel art') : ({ rect: 'Khối', line: 'Đường', icon: 'Biểu tượng', qr: 'Mã QR', image: 'Ảnh', calendar: 'Lịch tháng', analog: 'Đồng hồ kim', battery: 'Dung lượng pin' }[o.type] || o.type); }

    function snapshot() { state.history.push(JSON.stringify(state.objects, (k, v) => k === 'imageElement' ? undefined : v)); if (state.history.length > 60) state.history.shift(); state.future = []; }
    function restore(serialized) { state.objects = JSON.parse(serialized); hydrateImages(); state.selectedId = null; renderAll(); }
    function undo() { if (!state.history.length) return; state.future.push(JSON.stringify(state.objects)); restore(state.history.pop()); }
    function redo() { if (!state.future.length) return; state.history.push(JSON.stringify(state.objects)); restore(state.future.pop()); }

    function loadTemplate(template) { snapshot(); state.objects = clone(template.objects).map(o => ({ ...o, id: uid() })); state.templateId = template.id; state.selectedId = null; renderAll(); document.querySelectorAll('.studio-template-card').forEach(el => el.classList.toggle('active', el.dataset.id === template.id)); toast(`Đã mở mẫu “${template.name}”`); }

    function renderTemplates() {
        const list = byId('studio-template-list'); list.innerHTML = ''; const q = state.query.toLowerCase(); const filtered = templates.filter(t => (state.filter === 'all' || t.category === state.filter) && t.name.toLowerCase().includes(q)); byId('studio-template-count').textContent = filtered.length;
        filtered.forEach(t => { const button = document.createElement('button'); button.className = `studio-template-card${state.templateId === t.id ? ' active' : ''}`; button.dataset.id = t.id; button.innerHTML = `<canvas width="125" height="64"></canvas><strong>${t.name}</strong><small>${({work:'Công việc',personal:'Cá nhân',info:'Thông tin',life:'Đời sống'})[t.category]}</small>`; button.onclick = () => loadTemplate(t); list.appendChild(button); requestAnimationFrame(() => renderTo(button.querySelector('canvas'), t.objects)); });
    }

    function renderLayers() { const list = byId('studio-layer-list'); list.innerHTML = ''; state.objects.forEach(o => { const b = document.createElement('button'); b.className = `studio-layer${o.id === state.selectedId ? ' active' : ''}`; b.innerHTML = `<span>${objectName(o)}</span><small>${o.type}</small>`; b.onclick = () => selectObject(o.id); list.appendChild(b); }); }

    function renderPixelGallery() {
        const gallery = byId('studio-pixel-gallery');
        gallery.innerHTML = '';
        Object.entries(PIXEL_ART).forEach(([key, art]) => {
            const button = document.createElement('button');
            button.className = 'studio-pixel-choice';
            button.innerHTML = `<canvas width="48" height="48"></canvas><span>${art.name}</span>`;
            button.onclick = () => addPixelArt(key);
            gallery.appendChild(button);
            const preview = { id: '', type: 'pixel', pattern: key, x: 2, y: 2, w: 44, h: 44 };
            const previewContext = button.querySelector('canvas').getContext('2d');
            previewContext.imageSmoothingEnabled = false;
            drawPixelArt(previewContext, preview);
        });
    }

    function renderDynamicGallery() {
        const gallery = byId('studio-dynamic-gallery');
        gallery.innerHTML = '';
        Object.entries(DYNAMIC_WIDGETS).forEach(([key, widget]) => {
            const button = document.createElement('button');
            button.className = 'studio-dynamic-choice';
            button.draggable = true;
            button.dataset.dynamicWidget = key;
            button.innerHTML = `<strong>${widget.name}</strong><span>${widget.sample}</span>`;
            button.onclick = () => addDynamicWidget(key);
            button.addEventListener('dragstart', event => {
                event.dataTransfer.effectAllowed = 'copy';
                event.dataTransfer.setData('application/x-epd-widget', key);
                event.dataTransfer.setData('text/plain', key);
            });
            gallery.appendChild(button);
        });
    }
    function selectObject(id) { state.selectedId = id; renderAll(); }

    function renderProperties() {
        const host = byId('studio-properties'); const o = selected(); if (!o) { host.className = 'studio-empty'; host.textContent = 'Chọn một thành phần trên canvas.'; return; } host.className = ''; const textField = ['text','icon','qr'].includes(o.type) ? `<label class="studio-field"><span>Nội dung</span><textarea data-prop="text">${escapeHtml(o.text || '')}</textarea></label>` : '';
        const fontFields = ['text','icon'].includes(o.type) ? `<div class="studio-grid-2"><label class="studio-field"><span>Cỡ chữ</span><input type="number" min="6" max="90" data-prop="fontSize" value="${o.fontSize || 14}"></label><label class="studio-field"><span>Căn lề</span><select data-prop="align"><option value="left">Trái</option><option value="center">Giữa</option><option value="right">Phải</option></select></label></div><label class="studio-field"><span>Font chữ</span><select data-prop="fontFamily"><option value="Arial">Arial</option><option value="Arial Black">Arial Black</option><option value="Verdana">Verdana</option><option value="Tahoma">Tahoma</option><option value="Trebuchet MS">Trebuchet MS</option><option value="Segoe UI">Segoe UI</option><option value="Helvetica">Helvetica</option><option value="Inter">Inter</option><option value="Roboto">Roboto</option><option value="Open Sans">Open Sans</option><option value="Lato">Lato</option><option value="Montserrat">Montserrat</option><option value="Poppins">Poppins</option><option value="Nunito">Nunito</option><option value="Raleway">Raleway</option><option value="Space Grotesk">Space Grotesk</option><option value="Oswald">Oswald</option><option value="Rajdhani">Rajdhani</option><option value="Chakra Petch">Chakra Petch</option><option value="Exo 2">Exo 2</option><option value="Orbitron">Orbitron</option><option value="Share Tech Mono">Share Tech Mono</option><option value="Audiowide">Audiowide</option><option value="Bebas Neue">Bebas Neue</option><option value="Black Ops One">Black Ops One</option><option value="Georgia">Georgia</option><option value="Times New Roman">Times New Roman</option><option value="Palatino">Palatino</option><option value="Playfair Display">Playfair Display</option><option value="Merriweather">Merriweather</option><option value="Courier New">Courier New</option><option value="Menlo">Menlo</option><option value="Monaco">Monaco</option><option value="VT323">VT323</option><option value="Silkscreen">Silkscreen</option><option value="Press Start 2P">Press Start 2P</option><option value="Impact">Impact</option><option value="Lobster">Lobster</option><option value="Pacifico">Pacifico</option><option value="Caveat">Caveat</option><option value="Dancing Script">Dancing Script</option><option value="Comic Sans MS">Comic Sans MS</option><option value="sans-serif">Sans-serif</option><option value="serif">Serif</option><option value="monospace">Monospace</option></select></label><div class="studio-grid-2"><label class="studio-check"><input type="checkbox" data-prop="bold" ${o.bold ? 'checked' : ''}> Chữ đậm</label><label class="studio-check"><input type="checkbox" data-prop="italic" ${o.italic ? 'checked' : ''}> Chữ nghiêng</label><label class="studio-check"><input type="checkbox" data-prop="underline" ${o.underline ? 'checked' : ''}> Gạch chân</label></div>` : '';
        host.innerHTML = `${textField}<div class="studio-grid-2"><label class="studio-field"><span>X</span><input type="number" data-prop="x" value="${Math.round(o.x)}"></label><label class="studio-field"><span>Y</span><input type="number" data-prop="y" value="${Math.round(o.y)}"></label><label class="studio-field"><span>Rộng</span><input type="number" min="1" data-prop="w" value="${Math.round(o.w)}"></label><label class="studio-field"><span>Cao</span><input type="number" min="1" data-prop="h" value="${Math.round(o.h)}"></label></div>${fontFields}<div class="studio-palette"><button class="studio-swatch" data-color="#000000" title="Đen"></button><button class="studio-swatch" data-color="#ff0000" title="Đỏ"></button><button class="studio-swatch" data-color="#ffffff" title="Trắng"></button></div><div class="studio-action-row" style="margin-top:10px"><button data-layer="up" class="studio-button-ghost">Lên trên</button><button data-layer="down" class="studio-button-ghost">Xuống dưới</button><button data-delete="1" class="studio-button-danger">Xóa</button></div>`;
        const align = host.querySelector('[data-prop="align"]'); if (align) align.value = o.align || 'left';
        const font = host.querySelector('[data-prop="fontFamily"]'); if (font) font.value = o.fontFamily || 'Arial';
        host.querySelectorAll('[data-prop]').forEach(input => input.addEventListener(input.tagName === 'SELECT' || input.type === 'checkbox' ? 'change' : 'input', () => { const prop = input.dataset.prop; o[prop] = input.type === 'checkbox' ? input.checked : ['x','y','w','h','fontSize'].includes(prop) ? Number(input.value) : input.value; render(); renderLayers(); }));
        host.querySelectorAll('[data-color]').forEach(b => b.onclick = () => {
            snapshot();
            if (o.type === 'rect') {
                o.fill = b.dataset.color;
                o.stroke = b.dataset.color;
            } else {
                o.color = b.dataset.color;
            }
            renderAll();
        });
        host.querySelector('[data-delete]').onclick = removeSelected; host.querySelectorAll('[data-layer]').forEach(b => b.onclick = () => moveLayer(b.dataset.layer === 'up' ? 1 : -1));
    }
    function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
    function renderAll() { render(); renderProperties(); renderLayers(); }

    function addObject(type) {
        if (type === 'dynamic') { byId('studio-dynamic-gallery')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); toast('Kéo widget dữ liệu động vào canvas, hoặc chạm để thêm.'); return; }
        if (type === 'pixel') { byId('studio-pixel-gallery')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); toast('Chọn một pixel art hoặc widget trong bảng bên phải.'); return; }
        snapshot(); let o;
        if (type === 'text') o = text('Nhập nội dung', 35, 45, 180, 30, 20, COLORS.black, { bold: true, align: 'center' });
        if (type === 'rect') o = rect(65, 34, 120, 60, COLORS.white, COLORS.black, 2);
        if (type === 'line') o = line(40, 64, 170, 0, COLORS.black, 2);
        if (type === 'icon') o = icon('★', 95, 29, 60, 60, COLORS.red);
        if (type === 'qr') o = qr('https://example.com', 91, 23, 82);
        if (type === 'image') { byId('studio-image-file').click(); return; }
        state.objects.push(o); state.selectedId = o.id; renderAll();
    }
    function addPixelArt(pattern) { snapshot(); const o = { id: uid(), type: 'pixel', pattern, x: 93, y: 32, w: 64, h: 64 }; state.objects.push(o); state.selectedId = o.id; renderAll(); toast(`Đã thêm ${PIXEL_ART[pattern].name}.`); }
    function addDynamicWidget(key, dropX = W / 2, dropY = H / 2) {
        const widget = DYNAMIC_WIDGETS[key];
        if (!widget) return;
        snapshot();
        const o = widget.create();
        o.x = clamp(dropX - o.w / 2, 0, W - o.w);
        o.y = clamp(dropY - o.h / 2, 0, H - o.h);
        state.objects.push(o); state.selectedId = o.id; renderAll();
        toast(`Đã thêm widget “${widget.name}”.`);
    }
    function removeSelected() { if (!selected()) return; snapshot(); state.objects = state.objects.filter(o => o.id !== state.selectedId); state.selectedId = null; renderAll(); }
    function duplicateSelected() { const o = selected(); if (!o) return; snapshot(); const copy = clone(o); copy.id = uid(); copy.x = clamp(copy.x + 8, 0, W - copy.w); copy.y = clamp(copy.y + 8, 0, H - copy.h); state.objects.push(copy); state.selectedId = copy.id; renderAll(); }
    function moveLayer(delta) { const index = state.objects.findIndex(o => o.id === state.selectedId), next = clamp(index + delta, 0, state.objects.length - 1); if (index < 0 || next === index) return; snapshot(); const [o] = state.objects.splice(index, 1); state.objects.splice(next, 0, o); renderAll(); }

    function pointerPosition(event) { const box = canvas.getBoundingClientRect(); return { x: (event.clientX - box.left) * W / box.width, y: (event.clientY - box.top) * H / box.height }; }
    function hitTest(x, y) { for (let i = state.objects.length - 1; i >= 0; i--) { const o = state.objects[i]; const pad = o.type === 'line' ? 5 : 0; if (x >= Math.min(o.x,o.x+o.w)-pad && x <= Math.max(o.x,o.x+o.w)+pad && y >= Math.min(o.y,o.y+o.h)-pad && y <= Math.max(o.y,o.y+o.h)+pad) return o; } return null; }
    canvas.addEventListener('pointerdown', e => { e.preventDefault(); const p = pointerPosition(e), current = selected(); const resizing = current && Math.abs(p.x - (current.x + current.w)) < 8 && Math.abs(p.y - (current.y + current.h)) < 8; const hit = resizing ? current : hitTest(p.x, p.y); if (!hit) { state.selectedId = null; renderAll(); return; } snapshot(); state.selectedId = hit.id; state.dragging = { mode: resizing ? 'resize' : 'move', start: p, original: { x: hit.x, y: hit.y, w: hit.w, h: hit.h } }; canvas.setPointerCapture(e.pointerId); renderAll(); });
    canvas.addEventListener('pointermove', e => { if (!state.dragging) return; const p = pointerPosition(e), o = selected(), d = state.dragging, dx = p.x - d.start.x, dy = p.y - d.start.y; if (d.mode === 'move') { o.x = clamp(d.original.x + dx, 0, W - Math.max(1,o.w)); o.y = clamp(d.original.y + dy, 0, H - Math.max(1,o.h)); } else { o.w = clamp(d.original.w + dx, 4, W - o.x); o.h = clamp(d.original.h + dy, 4, H - o.y); } render(); });
    canvas.addEventListener('pointerup', () => { state.dragging = null; renderAll(); });
    canvas.addEventListener('dragover', event => { if (!event.dataTransfer.types.includes('application/x-epd-widget')) return; event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; canvas.parentElement.classList.add('studio-drop-active'); });
    canvas.addEventListener('dragleave', () => canvas.parentElement.classList.remove('studio-drop-active'));
    canvas.addEventListener('drop', event => { event.preventDefault(); canvas.parentElement.classList.remove('studio-drop-active'); const key = event.dataTransfer.getData('application/x-epd-widget') || event.dataTransfer.getData('text/plain'); const point = pointerPosition(event); addDynamicWidget(key, point.x, point.y); });

    function download(name, blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
    function exportJson() { download(`eink-template-${Date.now()}.json`, new Blob([JSON.stringify({ version: 1, width: W, height: H, objects: state.objects }, null, 2)], { type: 'application/json' })); }
    function currentFormData() {
        return {
            countdownDate: byId('studio-countdown-date')?.value || '',
            events: [1, 2, 3].map(index => byId(`studio-event-${index}`)?.value || ''),
            city: byId('studio-city')?.value || '',
            latitude: byId('studio-lat')?.value || '',
            longitude: byId('studio-lon')?.value || '',
            batteryPercent: byId('studio-battery-percent')?.value || '75'
        };
    }
    function persistStudioState(showToast = false) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ objects: state.objects, weather: state.weather, form: currentFormData() }));
            if (showToast) toast('Đã lưu thiết kế trong trình duyệt này.');
            return true;
        } catch (_) {
            if (showToast) toast('Trình duyệt không cho lưu khi mở bằng file://. Hãy dùng Xuất JSON.', true);
            return false;
        }
    }
    function saveLocal() { persistStudioState(true); }
    function exportPng() { state.selectedId = null; render(); canvas.toBlob(blob => download(`eink-250x128-${Date.now()}.png`, blob), 'image/png'); renderAll(); }
    function buildTransferCanvas() {
        const transfer = document.createElement('canvas');
        transfer.width = W; transfer.height = H;
        const transferContext = transfer.getContext('2d', { willReadFrequently: true });
        transferContext.drawImage(canvas, 0, 0);
        const image = transferContext.getImageData(0, 0, W, H);
        let blackPixels = 0, redPixels = 0;
        for (let i = 0; i < image.data.length; i += 4) {
            const r = image.data[i], g = image.data[i + 1], b = image.data[i + 2];
            const isRed = r > 135 && r > g * 1.45 && r > b * 1.45;
            const luminance = r * 0.299 + g * 0.587 + b * 0.114;
            if (isRed) {
                image.data[i] = 255; image.data[i + 1] = 0; image.data[i + 2] = 0;
                redPixels++;
            } else if (luminance < 180) {
                image.data[i] = 0; image.data[i + 1] = 0; image.data[i + 2] = 0;
                blackPixels++;
            } else {
                image.data[i] = 255; image.data[i + 1] = 255; image.data[i + 2] = 255;
            }
            image.data[i + 3] = 255;
        }
        transferContext.putImageData(image, 0, 0);
        transfer.epdStats = { blackPixels, redPixels };
        return transfer;
    }

    async function sendToDisplay(options = {}) {
        try {
            if (typeof window.uploadNrf52Image !== 'function') throw new Error('Không tìm thấy mô-đun truyền nRF52.');
            const connection = window.epdAutoSyncBridge?.getState?.();
            if (!connection?.connected || connection.protocol !== 'nrf52') {
                if (!options.allowReconnect || typeof window.epdAutoSyncBridge?.reconnect !== 'function')
                    throw new Error('Hãy kết nối thiết bị NRF_EPD_4FB6 trước.');
                toast('Đang kết nối lại để tự đồng bộ…');
                await window.epdAutoSyncBridge.reconnect();
            }
            const size = byId('screen-size');
            if (size) size.value = 'nrf52_2.13_250x128';
            state.selectedId = null;
            render();
            const transferCanvas = buildTransferCanvas();
            const stats = transferCanvas.epdStats;
            if (!stats.blackPixels && !stats.redPixels) throw new Error('Template không có pixel đen hoặc đỏ để gửi.');
            if (typeof window.addLog === 'function') window.addLog(`> Template 250×128: ${stats.blackPixels} pixel đen, ${stats.redPixels} pixel đỏ.`);
            toast(`Đang gửi ${stats.blackPixels} pixel đen + ${stats.redPixels} pixel đỏ…`);
            const ok = await window.uploadNrf52Image(transferCanvas);
            if (!ok) throw new Error('Thiết bị chưa nhận ảnh. Hãy kiểm tra kết nối.');
            toast(options.automatic ? 'Đã tự đồng bộ template của ngày mới.' : 'Đã gửi template lên màn hình.');
            renderAll();
            return true;
        } catch (error) {
            toast(error.message || String(error), true);
            renderAll();
            return false;
        }
    }

    function todayKey() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    function persistAutoSync() {
        try {
            localStorage.setItem(AUTO_SYNC_KEY, JSON.stringify({
                enabled: state.autoSync.enabled,
                lastDate: state.autoSync.lastDate,
                lastSuccess: state.autoSync.lastSuccess
            }));
        } catch (_) { /* The current tab can still keep the schedule in memory. */ }
    }
    function updateAutoSyncUi() {
        const button = byId('studio-auto-sync');
        const status = byId('studio-auto-sync-status');
        if (button) {
            button.textContent = state.autoSync.enabled ? 'Tự đồng bộ: Bật' : 'Tự đồng bộ: Tắt';
            button.classList.toggle('active', state.autoSync.enabled);
            button.setAttribute('aria-pressed', String(state.autoSync.enabled));
            button.disabled = state.autoSync.busy;
        }
        if (!status) return;
        if (state.autoSync.busy) status.textContent = 'Đang dựng và gửi template mới…';
        else if (!state.autoSync.enabled) status.textContent = 'Ảnh là snapshot. Bật Tự đồng bộ để gửi lại khi sang ngày mới.';
        else if (state.autoSync.lastError) status.textContent = `Chưa đồng bộ được: ${state.autoSync.lastError} • sẽ thử lại sau.`;
        else if (state.autoSync.lastSuccess) status.textContent = `Tự đồng bộ mỗi ngày sau 00:00 • lần cuối ${state.autoSync.lastSuccess}.`;
        else status.textContent = 'Tự đồng bộ mỗi ngày sau 00:00 • cần giữ Chrome và Mac mini hoạt động.';
    }
    async function runAutoSync(reason = 'schedule', force = false) {
        if (!state.autoSync.enabled || state.autoSync.busy) return false;
        const date = todayKey();
        if (!force && state.autoSync.lastDate === date) return true;
        if (!force && Date.now() < state.autoSync.nextRetryAt) return false;
        state.autoSync.busy = true;
        state.autoSync.lastError = '';
        updateAutoSyncUi();
        renderAll();
        const ok = await sendToDisplay({ automatic: true, allowReconnect: true });
        state.autoSync.busy = false;
        if (ok) {
            state.autoSync.lastDate = date;
            state.autoSync.lastSuccess = new Date().toLocaleString('vi-VN');
            state.autoSync.nextRetryAt = 0;
            if (typeof window.addLog === 'function') window.addLog(`> Tự đồng bộ Template Studio thành công (${reason}).`);
        } else {
            state.autoSync.lastError = 'Mất kết nối Bluetooth hoặc thiết bị chưa sẵn sàng';
            state.autoSync.nextRetryAt = Date.now() + 60 * 60 * 1000;
            if (typeof window.addLog === 'function') window.addLog('> Tự đồng bộ thất bại; sẽ thử lại sau 1 giờ.');
        }
        persistAutoSync();
        updateAutoSyncUi();
        return ok;
    }
    async function toggleAutoSync() {
        state.autoSync.enabled = !state.autoSync.enabled;
        state.autoSync.lastError = '';
        if (state.autoSync.enabled) persistStudioState(false);
        persistAutoSync();
        updateAutoSyncUi();
        if (state.autoSync.enabled) {
            const connection = window.epdAutoSyncBridge?.getState?.();
            const batteryNote = connection && !connection.batteryAvailable
                ? ' Pin vẫn dùng giá trị thủ công vì firmware không cung cấp Battery Service.' : '';
            toast(`Đã bật tự đồng bộ ngày dương và âm lịch.${batteryNote}`);
            await runAutoSync('bật thủ công', true);
        } else toast('Đã tắt tự đồng bộ.');
    }

    function readImage(file, callback) { const reader = new FileReader(); reader.onload = () => { const img = new Image(); img.onload = () => callback(img, reader.result); img.src = reader.result; }; reader.readAsDataURL(file); }
    function hydrateImages() { state.objects.filter(o => o.type === 'image' && o.src).forEach(o => { const img = new Image(); img.onload = render; img.src = o.src; o.imageElement = img; }); }
    function importJson(file) { const reader = new FileReader(); reader.onload = () => { try { const data = JSON.parse(reader.result); if (!Array.isArray(data.objects) || data.width !== W || data.height !== H) throw new Error('Template phải có kích thước 250×128.'); snapshot(); state.objects = data.objects.map(o => ({ ...o, id: uid() })); hydrateImages(); state.selectedId = null; renderAll(); toast('Đã nhập template JSON.'); } catch (e) { toast(`Không thể nhập: ${e.message}`, true); } }; reader.readAsText(file); }
    function importIcs(file) { const reader = new FileReader(); reader.onload = () => { const textValue = reader.result.replace(/\r?\n[ \t]/g, ''); const events = [...textValue.matchAll(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g)].slice(0,3).map(match => { const body = match[1], summary = body.match(/\nSUMMARY(?:;[^:]*)?:(.*)/)?.[1]?.replace(/\\,/g, ',') || 'Sự kiện'; const raw = body.match(/\nDTSTART(?:;[^:]*)?:(.*)/)?.[1] || ''; const time = raw.match(/T(\d{2})(\d{2})/) ? `${RegExp.$1}:${RegExp.$2}` : ''; return `${time} ${summary}`.trim(); }); events.forEach((event, i) => byId(`studio-event-${i+1}`).value = event); render(); toast(`Đã nhập ${events.length} sự kiện từ lịch.`); }; reader.readAsText(file); }

    async function fetchWeather() { const lat = Number(byId('studio-lat').value), lon = Number(byId('studio-lon').value); if (!Number.isFinite(lat) || !Number.isFinite(lon)) return toast('Tọa độ không hợp lệ.', true); try { toast('Đang lấy dữ liệu thời tiết…'); const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`); if (!response.ok) throw new Error(`HTTP ${response.status}`); const data = await response.json(); const code = data.current.weather_code; const descriptions = {0:'Trời quang',1:'Ít mây',2:'Mây rải rác',3:'Nhiều mây',45:'Có sương mù',48:'Sương mù đóng băng',51:'Mưa phùn nhẹ',53:'Mưa phùn',55:'Mưa phùn dày',61:'Mưa nhẹ',63:'Có mưa',65:'Mưa lớn',80:'Mưa rào nhẹ',81:'Mưa rào',82:'Mưa rào lớn',95:'Có dông'}; state.weather = { city: byId('studio-city').value || 'Vị trí của bạn', temp: Math.round(data.current.temperature_2m), desc: descriptions[code] || 'Thời tiết hiện tại' }; renderAll(); renderTemplates(); toast('Đã cập nhật thời tiết.'); } catch (e) { toast(`Không lấy được thời tiết: ${e.message}`, true); } }

    document.querySelectorAll('.studio-filter').forEach(b => b.onclick = () => { document.querySelectorAll('.studio-filter').forEach(x => x.classList.remove('active')); b.classList.add('active'); state.filter = b.dataset.filter; renderTemplates(); });
    byId('studio-search').oninput = e => { state.query = e.target.value; renderTemplates(); };
    document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => addObject(b.dataset.add));
    byId('studio-undo').onclick = undo; byId('studio-redo').onclick = redo; byId('studio-delete').onclick = removeSelected; byId('studio-duplicate').onclick = duplicateSelected;
    byId('studio-save').onclick = saveLocal; byId('studio-export').onclick = exportJson; byId('studio-png').onclick = exportPng; byId('studio-send').onclick = () => sendToDisplay(); byId('studio-auto-sync').onclick = toggleAutoSync;
    byId('studio-import').onclick = () => byId('studio-import-file').click(); byId('studio-import-file').onchange = e => e.target.files[0] && importJson(e.target.files[0]);
    byId('studio-image-file').onchange = e => e.target.files[0] && readImage(e.target.files[0], (img, src) => { snapshot(); const ratio = img.width / img.height; const w = Math.min(170, ratio * 90), h = w / ratio; const o = { id: uid(), type: 'image', x: (W-w)/2, y: (H-h)/2, w, h, src, imageElement: img }; state.objects.push(o); state.selectedId = o.id; renderAll(); });
    byId('studio-refresh-data').onclick = () => { renderAll(); renderTemplates(); toast('Đã cập nhật dữ liệu thời gian.'); };
    byId('studio-weather').onclick = fetchWeather; byId('studio-ics').onclick = () => byId('studio-ics-file').click(); byId('studio-ics-file').onchange = e => e.target.files[0] && importIcs(e.target.files[0]);
    ['studio-countdown-date','studio-event-1','studio-event-2','studio-event-3','studio-city','studio-battery-percent'].forEach(id => byId(id).addEventListener('input', render));
    window.addEventListener('epd-battery-updated', event => {
        const percent = clamp(Number(event.detail?.percent), 0, 100);
        if (!Number.isFinite(percent)) return;
        byId('studio-battery-percent').value = String(Math.round(percent));
        byId('studio-battery-source').textContent = `Đã đọc trực tiếp từ thiết bị: ${Math.round(percent)}%.`;
        renderAll();
        toast(`Đã cập nhật pin từ thiết bị: ${Math.round(percent)}%.`);
    });
    document.addEventListener('keydown', e => { const active = document.activeElement?.tagName; if (['INPUT','TEXTAREA','SELECT'].includes(active)) return; if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicateSelected(); } else if (e.key === 'Delete' || e.key === 'Backspace') removeSelected(); else if (selected() && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) { e.preventDefault(); snapshot(); const o = selected(), step = e.shiftKey ? 10 : 1; if (e.key === 'ArrowLeft') o.x -= step; if (e.key === 'ArrowRight') o.x += step; if (e.key === 'ArrowUp') o.y -= step; if (e.key === 'ArrowDown') o.y += step; o.x = clamp(o.x, 0, W-o.w); o.y = clamp(o.y, 0, H-o.h); renderAll(); } });

    let saved = null; try { saved = localStorage.getItem(STORAGE_KEY); } catch (_) { /* file:// can disable storage */ }
    let savedForm = null;
    if (saved) { try { const data = JSON.parse(saved); state.objects = data.objects || []; state.weather = data.weather || state.weather; savedForm = data.form || null; hydrateImages(); } catch (_) { state.objects = []; } }
    if (!state.objects.length) state.objects = clone(templates[0].objects).map(o => ({ ...o, id: uid() }));
    const tomorrow = new Date(Date.now() + 7 * 86400000); byId('studio-countdown-date').value = tomorrow.toISOString().slice(0,10);
    if (savedForm) {
        if (savedForm.countdownDate) byId('studio-countdown-date').value = savedForm.countdownDate;
        (savedForm.events || []).slice(0, 3).forEach((value, index) => { byId(`studio-event-${index + 1}`).value = value; });
        if (savedForm.city) byId('studio-city').value = savedForm.city;
        if (savedForm.latitude !== undefined) byId('studio-lat').value = savedForm.latitude;
        if (savedForm.longitude !== undefined) byId('studio-lon').value = savedForm.longitude;
        if (savedForm.batteryPercent !== undefined) byId('studio-battery-percent').value = savedForm.batteryPercent;
    }
    try {
        const autoSyncSaved = JSON.parse(localStorage.getItem(AUTO_SYNC_KEY) || 'null');
        if (autoSyncSaved) {
            state.autoSync.enabled = autoSyncSaved.enabled === true;
            state.autoSync.lastDate = autoSyncSaved.lastDate || '';
            state.autoSync.lastSuccess = autoSyncSaved.lastSuccess || '';
        }
    } catch (_) { /* Keep defaults. */ }
    renderTemplates(); renderPixelGallery(); renderDynamicGallery(); renderAll();
    updateAutoSyncUi();
    window.setInterval(() => {
        if (!document.hidden) render();
        if (state.autoSync.enabled) runAutoSync('kiểm tra đổi ngày');
    }, 30000);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && state.autoSync.enabled) runAutoSync('tab hoạt động lại');
    });
    window.addEventListener('pageshow', () => {
        if (state.autoSync.enabled) setTimeout(() => runAutoSync('mở lại trang'), 1500);
    });
    document.addEventListener('qrcode-ready', () => { renderTemplates(); render(); });
    if (new URLSearchParams(window.location.search).get('studio') === '1') {
        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => document.getElementById('template-studio-tab-button')?.click(), 0);
        });
    }
})();
