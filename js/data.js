// 旅行数据。新增一趟旅行：复制一份 trip + days + expenseDefinitions + guides，
// 加入 trips / expenseDefinitionsByTrip / guidesByTrip，并更新 footprintStats。

function calculateTripDuration(startDate, endDate, year) {
  const toUtcDate = (monthDay) => {
    const [month, day] = monthDay.split('.').map(Number);
    return Date.UTC(year, month - 1, day);
  };
  const dayCount = Math.round((toUtcDate(endDate) - toUtcDate(startDate)) / 86400000) + 1;
  return `${dayCount}天${Math.max(dayCount - 1, 0)}晚`;
}

const trip = {
  id: 'australia-national-day-2026',
  title: '国庆澳洲游', // 足迹页胶片墙 NO.01 下面的小标题
  startDate: '09.25',
  endDate: '10.07',
  year: 2026,
  travellerCount: 2,
  route: '墨尔本 → 凯恩斯 → 悉尼',
  photo: 'assets/photos/australia-sydney-opera-house-harbour-bridge.jpg' // 足迹页胶片墙 NO.01 大图，图片先转 WebP 再换（见 CLAUDE.md）
};

trip.duration = calculateTripDuration(trip.startDate, trip.endDate, trip.year);

const days = [
  { date: '09.25', number: 1, city: '出发 / 墨尔本', shortTitle: '从香港出发，抵达南半球', title: '香港 → 墨尔本', summary: '11:20 起飞，22:15 抵达墨尔本。到酒店办理入住后直接休息，留足恢复体力的时间。', hotel: 'The Victoria Hotel', hotelAddress: '215 Little Collins Street, Melbourne VIC 3000', hotelImage: 'assets/photos/the-victoria-hotel-melbourne/interior.jpg', tags: ['国际航班', '抵达日'], reminder: '落地较晚，机场到市区交通建议提前确认。', timeline: [{ time: '11:20', title: '香港起飞', note: '国际航班前往墨尔本' }, { time: '22:15', title: '抵达墨尔本', note: '办理入境后前往酒店' }, { time: '深夜', title: '入住休息', note: '为次日 City Walk 恢复体力' }] },
  { date: '09.26', number: 2, city: '墨尔本', shortTitle: 'City Walk · 巷弄与河岸', title: '墨尔本城市 City Walk', summary: '以市场、图书馆、拱廊、涂鸦巷和亚拉河为主，按体力在 NGV 与皇家植物园间二选一。', hotel: 'The Victoria Hotel', hotelAddress: '215 Little Collins Street, Melbourne VIC 3000', hotelImage: 'assets/photos/the-victoria-hotel-melbourne/interior.jpg', tags: ['城市漫步', '咖啡', '轻松'], reminder: '大洋路自驾前一天不宜走得太满，早点休息。', timeline: [{ time: '上午', title: 'Queen Victoria Market', note: '早餐、咖啡与市集闲逛' }, { time: '中午', title: 'CBD 巷弄漫步', note: '州立图书馆、拱廊、Degraves Street' }, { time: '下午', title: '河岸与美术馆', note: 'Flinders Street、联邦广场、NGV 或植物园' }] },
  { date: '09.27', number: 3, city: '大洋路', shortTitle: 'Day 1 · 海岸线自驾', title: '大洋路 Day 1', summary: '墨尔本出发，经 Torquay、Bells Beach、Lorne 与 Apollo Bay，傍晚追十二门徒日落。', hotel: 'Apollo Bay Waterfront Motor Inn', hotelAddress: '173 Great Ocean Road, Apollo Bay VIC 3233', hotelImage: 'assets/photos/apollo-bay-waterfront-motor-inn/exterior.jpg', tags: ['自驾', '海岸线', '日落'], reminder: '沿途补给点有限，在 Torquay 或 Lorne 及时补水和用餐。', timeline: [{ time: '上午', title: '墨尔本出发', note: '前往 Torquay 与 Bells Beach' }, { time: '中午', title: 'Lorne / Apollo Bay', note: '午餐、补给与海边停留' }, { time: '傍晚', title: '十二门徒日落', note: '经 Otway 雨林，抵达 Port Campbell 一带' }] },
  { date: '09.28', number: 4, city: '大洋路 / 墨尔本', shortTitle: 'Day 2 · 峡谷与返程', title: '大洋路 Day 2', summary: '清晨看十二门徒与 Gibson Steps，途经洛克阿德峡谷、The Arch、London Bridge 后返回墨尔本。', hotel: '机场附近住宿', hotelAddress: '待定 · 墨尔本机场附近', tags: ['自驾', '峡谷', '返程'], reminder: '第二天是早班机，今晚务必确认机场交通或凌晨接送。', timeline: [{ time: '清晨', title: '十二门徒 / Gibson Steps', note: '避开人流，感受海岸晨光' }, { time: '上午', title: '洛克阿德峡谷', note: 'The Arch、London Bridge、Bay of Islands' }, { time: '下午', title: '返回墨尔本', note: '还车、整理行李并前往机场附近' }] },
  { date: '09.29', number: 5, city: '凯恩斯', shortTitle: '抵达热带海岸', title: '墨尔本 → 凯恩斯', summary: '06:25 飞往凯恩斯，09:50 抵达。寄存行李后在 Esplanade、Marina 与夜市轻松适应节奏。', hotel: 'DoubleTree by Hilton Hotel Cairns', hotelAddress: '121-123 Esplanade, Cairns City QLD 4870 Australia', hotelImage: 'assets/photos/doubletree-by-hilton-cairns/exterior.jpg', tags: ['国内航班', '抵达日', '休整'], reminder: '这天早起赶机，不建议安排跳伞或出海。', timeline: [{ time: '06:25', title: '墨尔本起飞', note: '国内航班前往凯恩斯' }, { time: '09:50', title: '抵达凯恩斯', note: '前往酒店寄存行李' }, { time: '下午', title: '海滨轻松漫步', note: 'Esplanade Lagoon、Marina 或夜市' }] },
  { date: '09.30', number: 6, city: '凯恩斯', shortTitle: 'Mission Beach 高空体验', title: '凯恩斯美神滩跳伞', summary: '前往 Mission Beach 跳伞；预订总价 3250 元，已由 lkq 预付，拍照服务另计。', hotel: 'DoubleTree by Hilton Hotel Cairns', hotelAddress: '121-123 Esplanade, Cairns City QLD 4870 Australia', hotelImage: 'assets/photos/doubletree-by-hilton-cairns/exterior.jpg', tags: ['跳伞', '天气影响', '预订'], reminder: '若天气取消，可将跳伞调整至 10.03。', timeline: [{ time: '上午', title: '前往 Mission Beach', note: '按供应商集合与接送安排出发' }, { time: '白天', title: '跳伞体验', note: '留意天气与现场拍摄加购规则' }, { time: '傍晚', title: '返回凯恩斯', note: '休息、补水，避免过度饮酒' }] },
  { date: '10.01', number: 7, city: '凯恩斯', shortTitle: '大堡礁一日游', title: '魔幻丽礁号大堡礁一日游', summary: '从码头出海，体验外堡礁浮潜、体验潜、玻璃底船或半潜艇，傍晚回到凯恩斯市区。', hotel: 'DoubleTree by Hilton Hotel Cairns', hotelAddress: '121-123 Esplanade, Cairns City QLD 4870 Australia', hotelImage: 'assets/photos/doubletree-by-hilton-cairns/exterior.jpg', tags: ['大堡礁', '出海', '浮潜'], reminder: '晕船体质提前服药；若可能补跳伞，注意潜水后高空活动间隔。', timeline: [{ time: '早上', title: '前往码头出海', note: '携带防晒、晕船药与防水袋' }, { time: '白天', title: '外堡礁活动', note: '浮潜 / 体验潜 / 玻璃底船等' }, { time: '傍晚', title: '返回凯恩斯', note: '补水、整理当天照片与装备' }] },
  { date: '10.02', number: 8, city: '凯恩斯', shortTitle: '雨林与激流', title: '凯恩斯漂流', summary: '塔利河漂流，这条河的难度等级为 4/5，周围环绕着令人叹为观止的世界遗产雨林，漂流将穿过令人惊叹的3级和4级急流。', hotel: 'DoubleTree by Hilton Hotel Cairns', hotelAddress: '121-123 Esplanade, Cairns City QLD 4870 Australia', hotelImage: 'assets/photos/doubletree-by-hilton-cairns/exterior.jpg', tags: ['漂流', '接送', '户外'], reminder: '漂流税 35 AUD/人，需现场支付，准备信用卡或现金；需要在皮筏上穿安全鞋，例如沙鞋，如果不想湿鞋，可以花$租用鞋子；照片套餐需另外购买。', timeline: [{ time: '10:00', title: '酒店接人', note: '按趣玩自由接送安排上车' }, { time: '11:00', title: '出发前往塔利河', note: '车程约2小时，经过甘蔗农场和雨林小溪' }, { time: '13:00', title: '抵达塔利河，午餐时间', note: '将享用简便午餐（自费），而后将在40分钟内抵达塔利峡谷顶部' }, { time: '14:30', title: '开启漂流', note: '穿戴装备+漂流安全培训' }, { time: '18:00', title: '结束漂流', note: '到终点换衣服，前往费鲁加酒店享用乡村酒吧晚餐' }, { time: '20:00', title: '返程', note: '晚餐后驱车返回' }, { time: '22:00', title: '抵达酒店', note: '预计抵达酒店时间' }] },
  { date: '10.03', number: 9, city: '凯恩斯 / 悉尼', shortTitle: '机动休整 · 晚飞悉尼', title: '凯恩斯 → 悉尼', summary: '上午预留给跳伞或天气备选，下午取行李前往机场，19:10 飞抵悉尼。', hotel: 'Meriton Suites Mascot Central', hotelAddress: '8 Jackson Drive, Mascot NSW 2020', hotelImage: 'assets/photos/meriton-suites-mascot-central/exterior.jpg', tags: ['机动日', '国内航班', '晚抵达'], reminder: '22:05 抵达悉尼后不安排夜间活动，直接入住。', timeline: [{ time: '上午', title: '机动 / 休整', note: '作为跳伞天气备选，或市区轻松补给' }, { time: '下午', title: '前往凯恩斯机场', note: '取行李、预留充足值机时间' }, { time: '19:10', title: '飞往悉尼', note: '22:05 抵达后前往酒店' }] },
  { date: '10.04', number: 10, city: '悉尼', shortTitle: '海港观鲸', title: '悉尼观鲸日', summary: '从 Circular Quay 搭乘 ORCA 出海观鲸，官方产品 11:00 出发，实付 302.47 澳元。', hotel: 'Meriton Suites Mascot Central', hotelAddress: '8 Jackson Drive, Mascot NSW 2020', hotelImage: 'assets/photos/meriton-suites-mascot-central/exterior.jpg', tags: ['观鲸', '悉尼港', '出海'], reminder: '出海前不要吃太撑；晕船体质提前服用晕船药。', timeline: [{ time: '上午', title: '前往 Circular Quay', note: '预留码头确认与登船时间' }, { time: '11:00', title: 'ORCA 观鲸出发', note: '海上观鲸体验' }, { time: '下午', title: '海港慢游', note: '根据体力安排环形码头或市区咖啡' }] },
  { date: '10.05', number: 11, city: '悉尼', shortTitle: '日出皮划艇与慢时光', title: '悉尼港日出皮划艇', summary: '清晨参加悉尼港日出皮划艇，上午回酒店补觉，下午可安排咖啡、购物与海港散步。', hotel: 'Meriton Suites Mascot Central', hotelAddress: '8 Jackson Drive, Mascot NSW 2020', hotelImage: 'assets/photos/meriton-suites-mascot-central/exterior.jpg', tags: ['皮划艇', '日出', '休整'], reminder: '带防水袋、速干衣和保暖外套，前一晚尽量早睡。', timeline: [{ time: '清晨', title: '日出皮划艇', note: '集合点以产品安排为准' }, { time: '上午', title: '回酒店休息', note: '补眠与整理衣物' }, { time: '下午', title: '自由活动', note: '咖啡、购物、海港散步或完全休整' }] },
  { date: '10.06', number: 12, city: '悉尼', shortTitle: '留白的一天', title: '悉尼休息 / 机动日', summary: '睡到自然醒，完成市区补给、购物和整理行李；可选 Bondi、Manly Ferry、QVB 或海港咖啡。', hotel: '机场附近住宿', hotelAddress: '待定 · 悉尼机场附近', tags: ['机动日', '购物', '整理行李'], reminder: '次日早班国际航班，不建议安排蓝山等远距离项目。', timeline: [{ time: '上午', title: '自然醒与补给', note: '整理行李、购买伴手礼' }, { time: '下午', title: '轻松备选', note: 'Bondi 短途散步 / Manly Ferry / QVB' }, { time: '晚上', title: '前往机场附近', note: '确认次日出发时间与证件' }] },
  { date: '10.07', number: 13, city: '悉尼 / 返程', shortTitle: '带着海风回家', title: '悉尼 → 香港', summary: '08:40 从悉尼起飞，15:10 抵达香港。国际航班建议提前至少 3 小时抵达机场。', hotel: '—', hotelAddress: '旅程结束', tags: ['国际航班', '返程', '收尾'], reminder: '护照、签证、航班订单与退税材料提前放在随身包。', timeline: [{ time: '清晨', title: '前往悉尼机场', note: '预留值机、安检与出境时间' }, { time: '08:40', title: '悉尼起飞', note: '国际航班返程' }, { time: '15:10', title: '抵达香港', note: '国庆澳洲游圆满收尾' }] }
];

const graduationDays = [
  { date: '06.05', number: 1, city: '西安', title: '抵达西安 · 回民街与洒金桥', summary: '12:30 从广州白云机场起飞，15:10 抵达西安咸阳机场；傍晚入住后，沿回民街与洒金桥慢慢开启毕业旅行。', hotel: '云和夜泊', hotelAddress: '西安碑林区文艺北路190号', hotelImage: 'assets/photos/yunheyebo-hotel-xian/exterior.jpg', tags: ['飞机', '抵达日', '夜市'], reminder: '落地后先办理入住、放好行李；回民街热门摊位可错峰前往。', timeline: [{ time: '12:30', title: '广州白云 T1 起飞', note: '飞往西安咸阳 T2' }, { time: '15:10', title: '抵达西安', note: '前往酒店办理入住' }, { time: '傍晚', title: '回民街 & 洒金桥', note: '逛吃西安第一晚' }] },
  { date: '06.06', number: 2, city: '西安', title: '华山一日', summary: '从西安出发前往华山，按当天体力安排索道与徒步路线，感受西岳的险峻山势。', hotel: '云和夜泊', hotelAddress: '西安碑林区文艺北路190号', hotelImage: 'assets/photos/yunheyebo-hotel-xian/exterior.jpg', tags: ['华山', '徒步', '索道'], reminder: '山上温差大、台阶多，准备防晒、薄外套和舒适防滑的鞋。', timeline: [{ time: '清晨', title: '西安出发', note: '预留往返华山的交通时间' }, { time: '白天', title: '华山登高', note: '根据体力安排北峰、西峰与长空栈道等路线' }, { time: '晚上', title: '返回西安', note: '早些休息，为次日城市行程留体力' }] },
  { date: '06.07', number: 3, city: '西安', title: '省博 · 大唐不夜城 · 旅拍', summary: '白天参观陕西历史博物馆，傍晚前往大唐不夜城完成旅拍与夜游，感受古都的昼夜两种气质。', hotel: '云和夜泊', hotelAddress: '西安碑林区文艺北路190号', hotelImage: 'assets/photos/yunheyebo-hotel-xian/exterior.jpg', tags: ['省博', '旅拍', '夜游'], reminder: '省博与旅拍都建议提前预约；晚间人流较多，随身物品要轻便。', timeline: [{ time: '上午', title: '陕西历史博物馆', note: '按预约时段入馆参观' }, { time: '下午', title: '旅拍准备', note: '整理妆造与拍摄路线' }, { time: '晚上', title: '大唐不夜城', note: '旅拍、夜景与街区漫步' }] },
  { date: '06.08', number: 4, city: '张掖', title: '西安 → 张掖 · 七彩丹霞', summary: '08:30 从西安北站出发，14:40 抵达张掖西站；安顿后前往七彩丹霞，欣赏日落时分的层叠山色。', hotel: '华辰国际酒店', hotelAddress: '张掖甘州区东大街20号', hotelImage: 'assets/photos/huachen-international-hotel-zhangye/exterior.jpg', tags: ['动车', '七彩丹霞', '日落'], reminder: '丹霞景区日晒强、风也大，备好防晒与保暖外套。', timeline: [{ time: '08:30', title: '西安北站出发', note: '动车前往张掖西站' }, { time: '14:40', title: '抵达张掖', note: '前往酒店寄存或办理入住' }, { time: '傍晚', title: '七彩丹霞', note: '看日落与彩色丘陵' }] },
  { date: '06.09', number: 5, city: '张掖', title: '平山湖大峡谷', summary: '用一天走进平山湖大峡谷，在峡谷地貌与戈壁景观之间徒步、拍照，体验张掖另一面的辽阔。', hotel: '华辰国际酒店', hotelAddress: '张掖甘州区东大街20号', hotelImage: 'assets/photos/huachen-international-hotel-zhangye/exterior.jpg', tags: ['大峡谷', '徒步', '戈壁'], reminder: '峡谷路段日照直、补给少，带足水、防晒和适合步行的鞋。', timeline: [{ time: '上午', title: '前往平山湖', note: '按包车或当地交通安排出发' }, { time: '白天', title: '大峡谷徒步', note: '跟随景区路线欣赏峡谷地貌' }, { time: '傍晚', title: '返回张掖市区', note: '休整、整理当天照片' }] },
  { date: '06.10', number: 6, city: '张掖', title: '马蹄寺石窟群', summary: '探访马蹄寺石窟群，在祁连山北麓的寺院、石窟与草原风光间度过一天。', hotel: '华辰国际酒店', hotelAddress: '张掖甘州区东大街20号', hotelImage: 'assets/photos/huachen-international-hotel-zhangye/exterior.jpg', tags: ['马蹄寺', '石窟', '祁连山'], reminder: '寺院参观请注意着装与礼仪；高原日晒明显，墨镜和防晒很有用。', timeline: [{ time: '上午', title: '前往马蹄寺', note: '从张掖市区向祁连山北麓出发' }, { time: '白天', title: '石窟与山寺', note: '按景区开放路线参观' }, { time: '傍晚', title: '回到张掖', note: '为雪山行程整理装备' }] },
  { date: '06.11', number: 7, city: '张掖', title: '巴尔斯雪山', summary: '前往巴尔斯雪山，沿途感受高山草甸、雪峰与河谷景观；晚间入住山顶民宿，留住旅程最特别的一夜。', hotel: '巴尔斯圣山山顶民宿', hotelAddress: '甘肃省张掖市肃南裕固族自治县大河乡西岔河村166号', hotelImage: 'assets/photos/bars-snow-mountain-homestay/exterior.jpg', tags: ['雪山', '高原', '民宿'], reminder: '山顶昼夜温差很大，带好冲锋衣、保暖层和高热量零食。', timeline: [{ time: '上午', title: '前往巴尔斯雪山', note: '按当地交通与天气安排出发' }, { time: '白天', title: '雪山观景', note: '高山草甸、雪峰与河谷拍照' }, { time: '晚上', title: '入住山顶民宿', note: '观景大床房，提前保暖休息' }] },
  { date: '06.12', number: 8, city: '兰州 / 返程', title: '张掖 → 兰州 → 广州', summary: '11:09 从张掖西站乘高铁前往兰州西站，14:31 抵达；晚间从兰州中川 T3 起飞，带着西北的记忆返程。', hotel: '—', hotelAddress: '旅程结束', tags: ['高铁', '飞机', '返程'], reminder: '兰州中转时间较长，提前确认车站到机场的路线、值机时间与行李安排。', timeline: [{ time: '11:09', title: '张掖西站出发', note: '高铁前往兰州西站' }, { time: '14:31', title: '抵达兰州西站', note: '中转、用餐并前往中川机场' }, { time: '22:00', title: '兰州中川 T3 起飞', note: '次日 01:10 抵达广州白云 T1' }] }
];

function prepareDays(tripDays) {
  tripDays.forEach((day, index) => {
    day.index = index;
    day.dayLabel = String(day.number).padStart(2, '0');
    day.dateCity = day.city.split(' / ').pop();
  });
  return tripDays;
}

prepareDays(days);
prepareDays(graduationDays);

const graduationTrip = {
  id: 'graduation-trip-northwest-2025',
  title: '212毕业旅行', // 足迹页胶片墙 NO.02 下面的小标题
  startDate: '06.05',
  endDate: '06.12',
  year: 2025,
  travellerCount: 4,
  route: '西安 → 张掖 → 兰州',
  photo: 'assets/photos/china-graduation-trip-cover.jpg', // 足迹页胶片墙 NO.02 大图，图片先转 WebP 再换（见 CLAUDE.md）
  days: graduationDays
};

graduationTrip.duration = calculateTripDuration(graduationTrip.startDate, graduationTrip.endDate, graduationTrip.year);
trip.days = days;
// 足迹页胶片墙的照片和编号顺序 = 这个数组的顺序（新增旅行会自动排到 NO.03、NO.04...）
const trips = [trip, graduationTrip];

const travellerCount = 2;
const australiaExpenseDefinitions = [
  { id: 'accommodation', name: '住宿', color: '#ba6e48', icon: 'assets/icons/expense-stay-transparent-v1.png', details: [{ title: '墨尔本', note: 'The Victoria Hotel · 2晚', amount: 2348 }, { title: '阿波罗湾', note: 'Apollo Bay Waterfront Motor Inn · 1晚', amount: 975.98 }, { title: '凯恩斯', note: 'DoubleTree by Hilton Hotel Cairns · 4晚（还没a）', amount: 5668 }, { title: '悉尼', note: 'Meriton Suites Mascot Central · 3晚（还没a）', amount: 4104 }] },
  { id: 'transport', name: '交通', color: '#375342', icon: 'assets/icons/expense-transport-transparent-v1.png', details: [{ title: '机票', note: '往返机票和澳洲境内机票', amount: 9368, quantity: travellerCount, suffix: '/人' }, { title: '租车', note: '租车两天+保险（还没a）', amount: 1386.64 }] },
  { id: 'activities', name: '活动项目', color: '#c49538', icon: 'assets/icons/expense-ticket-transparent-v1.png', details: [{ title: '凯恩斯跳伞', note: '携程预订', amount: 3250 }, { title: '魔幻丽礁号', note: '趣玩预订', amount: 2744 }, { title: '塔利河漂流', note: '趣玩预订', amount: 2076 }, { title: '悉尼观鲸', note: 'Ocean Extreme官网预订', amount: 1436.61 }, { title: '日出皮划艇', note: 'Ozpaddle Sydney官网预订', amount: 1529.96 }] },
  { id: 'food', name: '美食', color: '#f0cf98', icon: 'assets/icons/expense-food-transparent-v1.png', details: [{ title: '每日餐饮与咖啡', note: '按 13 天行程预留', amount: 3000, quantity: travellerCount, suffix: '/人' }] },
  { id: 'shopping', name: '购物', color: '#c8bd83', icon: 'assets/icons/expense-shopping-transparent-v1.png', details: [{ title: '伴手礼与个人购物', note: '行程预留', amount: 2000, quantity: travellerCount, suffix: '/人' }] }
];

const graduationExpenseDefinitions = [
  { id: 'accommodation', name: '住宿', color: '#ba6e48', icon: 'assets/icons/expense-stay-transparent-v1.png', details: [
    { title: '西安', note: '云和夜泊 · 3晚', amount: 2709.68 },
    { title: '张掖', note: '华辰国际酒店 · 3晚', amount: 1310.65 },
    { title: '张掖', note: '巴尔斯雪山山顶民宿 · 1晚', amount: 2376 }
  ] },
  { id: 'transport', name: '交通', color: '#375342', icon: 'assets/icons/expense-transport-transparent-v1.png', details: [
    { title: '机票', amount: 5493 },
    { title: '高铁', amount: 1934 },
    { title: '租车', note: '张掖自驾租车+油费', amount: 1134 },
    { title: '雪山包车', amount: 500 },
    { title: '华山包车', amount: 748 },
    { title: '打车', amount: 715.56 },
    { title: '城际', note: '兰州西到中川机场东', amount: 20, quantity: 4, suffix: '/人' },
    { title: '停车费', note: '停车费+过路费', amount: 85 }
  ] },
  { id: 'activities', name: '活动项目', color: '#c49538', icon: 'assets/icons/expense-ticket-transparent-v1.png', details: [
    { title: '华山', note: '西上西下套票+保险', amount: 525, quantity: 4, suffix: '/人' },
    { title: '长空栈道', note: 'xal+lkq', amount: 30, quantity: 4, suffix: '/人' },
    { title: '西安城墙', note: '门票', amount: 54, quantity: 4, suffix: '/人' },
    { title: '旅拍', note: 'lw 256；xal 266', amount: 296, quantity: 4, suffix: '/人' },
    { title: '七彩丹霞', note: '门票', amount: 91.97, quantity: 4, suffix: '/人' },
    { title: '平山湖大峡谷', note: '浅度游', amount: 130, quantity: 4, suffix: '/人' },
    { title: '马蹄寺', note: 'lw没走北寺石窟，仅52', amount: 87, quantity: 4, suffix: '/人' },
    { title: '巴尔斯圣山', note: '门票', amount: 195, quantity: 4, suffix: '/人' }
  ] },
  { id: 'food', name: '美食', color: '#f0cf98', icon: 'assets/icons/expense-food-transparent-v1.png', details: [
    { title: '志亮蒸饺', amount: 71 }, { title: '费萨尔烤肉', amount: 179 }, { title: '马安安油泼面', amount: 31 },
    { title: '窄巷子陕菜', amount: 419 }, { title: '绿豆饼', note: '原味、山楂味、玫瑰味', amount: 70 },
    { title: '老店铺泡馍烧烤', note: '羊肉泡馍、牛肉炒馍、水盆羊肉', amount: 134 }, { title: '摆府', amount: 145 },
    { title: '羊家将冰煮羊', amount: 224 }, { title: '和顺源', amount: 29 }, { title: '灵芝谷补给', amount: 80 },
    { title: '甘州美食城', amount: 204 }, { title: '水果', note: '新乐超市鑫汇店', amount: 34.99 },
    { title: '焦大头牛肉小饭', amount: 33.5 }, { title: '东乡手抓一卜拉打包店', amount: 231 },
    { title: '采购', note: '零食+火锅食材', amount: 398.59 }, { title: '筷上瘾', amount: 51 },
    { title: '早饭', amount: 26 }, { title: '胧庭', amount: 328 }, { title: '兰州牛肉面', amount: 28, quantity: 4, suffix: '/人' }
  ] },
  { id: 'shopping', name: '购物', color: '#c8bd83', icon: 'assets/icons/expense-shopping-transparent-v1.png', details: [
    { title: '水木和足道', note: 'xal 215', amount: 148, quantity: 4, suffix: '/人' },
    { title: '洗头', amount: 43, quantity: 4, suffix: '/人' }
  ] }
];

function formatExpenseAmount(value) {
  const cents = Math.round((Number(value) + Number.EPSILON) * 100);
  const integer = Math.floor(cents / 100);
  const decimal = String(cents % 100).padStart(2, '0');
  return decimal === '00' ? String(integer) : `${integer}.${decimal}`;
}

function buildExpenseSummary(definitions, travellers) {
  const expensesWithTotals = definitions.map((category) => {
    const details = category.details.map((detail) => {
      const quantity = detail.quantity || 1;
      return Object.assign({}, detail, {
        amountLabel: detail.amount ? `${formatExpenseAmount(detail.amount)}${detail.suffix || ''}` : '',
        pending: !detail.amount,
        total: (detail.amount || 0) * quantity
      });
    });
    const total = details.reduce((sum, detail) => sum + detail.total, 0);
    return Object.assign({}, category, { details, total });
  });
  const total = expensesWithTotals.reduce((sum, category) => sum + category.total, 0);
  const pending = total === 0;
  return {
    total: pending ? '' : formatExpenseAmount(total),
    perPerson: pending ? '' : formatExpenseAmount(total / travellers),
    pending,
    expenses: expensesWithTotals.map((category) => Object.assign({}, category, {
      amountLabel: category.total ? formatExpenseAmount(category.total) : '',
      pending: !category.total,
      width: total ? Math.max(4, Math.round(category.total / total * 100)) : 0
    }))
  };
}

const australiaGuides = [
  { id: 'prep', title: '行前准备', subtitle: '证件、物品、签证等清单，\n出发前做好充足准备。', details: ['护照、澳签、返程机票和酒店订单提前存好电子版。', '大洋路自驾准备中国驾照原件与 NAATI 英文翻译件。', '携带澳标转换头、防晒用品、薄外套和常用药品。'], icon: 'assets/icons/prep-card-icon-transparent-v1.png', image: 'assets/illustrations/prep-card-illustration-transparent-v1.jpg', theme: 'guide-prep' },
  { id: 'transport', title: '交通指南', subtitle: '飞机、火车、地铁，\n轻松搞定当地交通。', details: ['国际及澳洲境内航班建议提前完成线上值机并预留托运行李时间。', '大洋路路段较长，取车时检查保险、油量和还车规则。', '墨尔本、凯恩斯与悉尼机场往返酒店的路线可提前收藏。'], icon: 'assets/icons/transport-card-icon-transparent-v1.png', image: 'assets/illustrations/transport-card-illustration-transparent-v1.jpg', theme: 'guide-transport' },
  { id: 'food', title: '美食推荐', subtitle: '当地特色美食盘点，\n不负每一餐好时光。', details: ['墨尔本可安排市场早餐、巷弄咖啡与河岸餐厅。', '凯恩斯 Marina 和夜市适合出海或活动结束后的轻松晚餐。', '悉尼可结合海港行程安排咖啡、早午餐与海鲜。'], icon: 'assets/icons/food-card-icon-transparent-v1.png', image: 'assets/illustrations/australia-food-cluster-transparent-v1.jpg', theme: 'guide-food' }
];

const graduationGuides = [
  { id: 'prep', title: '行前准备', subtitle: '证件、物品、签证等清单，\n出发前做好充足准备。', details: ['身份证、车票机票、酒店订单和景区预约信息建议统一存好电子版。', '华山、峡谷和雪山行程都需要舒适防滑鞋；准备防晒、墨镜、帽子与补水装备。', '巴尔斯雪山夜间温度低，冲锋衣、保暖层和常用药要放在随身包。'], icon: 'assets/icons/prep-card-icon-transparent-v1.png', image: 'assets/illustrations/prep-card-illustration-transparent-v1.jpg', theme: 'guide-prep' },
  { id: 'transport', title: '交通指南', subtitle: '火车、地铁、公交，\n轻松搞定当地交通。', details: ['6月5日广州白云 T1 飞往西安咸阳 T2；落地后直接前往碑林区酒店。', '6月8日西安北站 08:30 出发、14:40 抵达张掖西站；丹霞当天尽量轻装。', '6月12日张掖西站至兰州西站后转兰州中川 T3，建议提前确认车站到机场交通。'], icon: 'assets/icons/transport-card-icon-transparent-v1.png', image: 'assets/illustrations/transport-card-illustration-transparent-v1.jpg', theme: 'guide-transport' },
  { id: 'food', title: '美食推荐', subtitle: '当地特色美食盘点，\n不负每一餐好时光。', details: ['回民街与洒金桥建议错峰慢逛，优先选择现做、排队有序的店铺。', '张掖峡谷和雪山行程补给不稳定，白天备水、能量棒与简单零食。', '兰州中转可按时间安排一碗牛肉面，再前往机场办理返程。'], icon: 'assets/icons/food-card-icon-transparent-v1.png', image: 'assets/illustrations/australia-food-cluster-transparent-v1.jpg', theme: 'guide-food' }
];

const expenseDefinitionsByTrip = {
  [trip.id]: australiaExpenseDefinitions,
  [graduationTrip.id]: graduationExpenseDefinitions
};

const guidesByTrip = {
  [trip.id]: australiaGuides,
  [graduationTrip.id]: graduationGuides
};

const footprintStats = [
  { id: 'countries', icon: 'assets/icons/globe.svg', value: '2', label: '国家/地区', interactive: true, detail: '澳大利亚\n中国' },
  { id: 'cities', icon: 'assets/icons/building.svg', value: '6', label: '座城市', interactive: true, detail: '墨尔本、凯恩斯、悉尼\n西安、张掖、兰州' },
  { id: 'trips', icon: 'assets/icons/suitcase.svg', value: '2', label: '次旅行', interactive: true },
  { id: 'days', icon: 'assets/icons/calendar-accent.svg', value: '21', label: '天数', interactive: true }
];
