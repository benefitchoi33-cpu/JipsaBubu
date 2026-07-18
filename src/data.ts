import { DailyTask, NTimesTask, WeeklyTask, MonthlyRotationItem } from './types';

export const DAYS_OF_WEEK = ['월', '화', '수', '목', '금', '토', '일'] as const;

export const INITIAL_DAILY_SUBMISSIONS: DailyTask[] = [
  {
    id: 'daily_1',
    name: '환기 및 이불 정리',
    checks: { '월': false, '화': false, '수': false, '목': false, '금': false, '토': false, '일': false }
  },
  {
    id: 'daily_2',
    name: '설거지 및 싱크대 물기 제거',
    checks: { '월': false, '화': false, '수': false, '목': false, '금': false, '토': false, '일': false }
  },
  {
    id: 'daily_3',
    name: '바닥에 떨어진 물건 정리',
    checks: { '월': false, '화': false, '수': false, '목': false, '금': false, '토': false, '일': false }
  },
  {
    id: 'daily_4',
    name: '욕실 사용 후 물기 제거 (스퀴지)',
    checks: { '월': false, '화': false, '수': false, '목': false, '금': false, '토': false, '일': false }
  }
];

export const INITIAL_N_TIMES_TASKS: NTimesTask[] = [
  {
    id: 'ntimes_1',
    name: '청소기 - 머리카락 및 부분 먼지',
    targetCount: 2,
    completedCount: 0,
    note: '주 2회'
  },
  {
    id: 'ntimes_2',
    name: '가스레인지 / 인덕션 상판 닦기',
    targetCount: 2,
    completedCount: 0,
    note: '주 2회'
  },
  {
    id: 'ntimes_3',
    name: '음식물 쓰레기 비우기',
    targetCount: 2,
    completedCount: 0,
    note: '주 2회'
  },
  {
    id: 'ntimes_4',
    name: '분리수거 버리기',
    targetCount: 2,
    completedCount: 0,
    note: '주 2회'
  },
  {
    id: 'ntimes_5',
    name: '변기 청소',
    targetCount: 1,
    completedCount: 0,
    note: '주 1회'
  }
];

export const INITIAL_WEEKLY_TASKS: WeeklyTask[] = [
  {
    id: 'weekly_1',
    category: '욕실 가볍게',
    name: '세면대 배수구 청소 + 수전 물때 닦기',
    completed: false
  },
  {
    id: 'weekly_2',
    category: '전체 바닥',
    name: '집안 전체 구석구석 청소기 돌리기',
    completed: false
  },
  {
    id: 'weekly_3',
    category: '전체 바닥',
    name: '집안 전체 물걸레질 하기',
    completed: false
  },
  {
    id: 'weekly_4',
    category: '먼지 관리',
    name: '가구, 선반, 가전 위 쌓인 먼지 닦기',
    completed: false
  },
  {
    id: 'weekly_5',
    category: '세탁 관리',
    name: '의류 빨래 및 건조된 옷 개어서 정리',
    completed: false
  },
  {
    id: 'weekly_6',
    category: '주방 관리',
    name: '싱크대 배수구 거름망 소독 및 청소',
    completed: false
  }
];

export const INITIAL_MONTHLY_TASKS: MonthlyRotationItem[] = [
  {
    id: 'monthly_1',
    category: '욕실 전체',
    name: '욕실 바닥 물청소, 벽면 타일 및 곰팡이 제거',
    isSelected: false,
    completed: false
  },
  {
    id: 'monthly_2',
    category: '침실',
    name: '침구 전체 세탁 (이불 및 베개커버 교체)',
    isSelected: false,
    completed: false
  },
  {
    id: 'monthly_3',
    category: '주방',
    name: '냉장고 유통기한 확인 및 내부 선반 닦기',
    isSelected: false,
    completed: false
  },
  {
    id: 'monthly_4',
    category: '가전',
    name: '세탁조 청소 또는 공기청정기/에어컨 필터 청소',
    isSelected: false,
    completed: false
  },
  {
    id: 'monthly_5',
    category: '기타',
    name: '현관 바닥 닦기 또는 집안 거울/창틀 먼지 제거',
    isSelected: false,
    completed: false
  }
];

// Helper to get start and end date of current week (Mon-Sun)
export function getWeekDates(date: Date = new Date()) {
  const currentDay = date.getDay(); // 0 is Sunday, 1 is Monday ...
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(date);
  monday.setDate(date.getDate() + distanceToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    start: formatDate(monday),
    end: formatDate(sunday)
  };
}

export const INITIAL_RELATIONSHIP_QUESTS = [
  { id: 'rel_1', name: '함께 동네 가볍게 산책하며 도란도란 대화하기 🚶‍♂️🚶‍♀️', completed: false, xp: 40 },
  { id: 'rel_2', name: '주 1회 서로의 취향 존중하며 알콩달콩 미니 데이트 ☕', completed: false, xp: 50 },
  { id: 'rel_3', name: '맛있는 특별 보양 요리 함께 만들거나 야식에 캔맥주 🍺', completed: false, xp: 40 },
  { id: 'rel_4', name: '오늘 하루 수고한 서로에게 시원한 안마와 감사 카드 쓰기 💌', completed: false, xp: 30 },
  { id: 'rel_5', name: '대청소 마친 후 소파에 나란히 앉아 재밌는 영화 감상 🎬', completed: false, xp: 30 }
];

