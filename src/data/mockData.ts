import type { Crew } from './types';

const crewNames = [
  { team: 'Молния', driver: 'Виктор Соrokин', navigator: 'Анна Петрова' },
  { team: 'Торнадо', driver: 'Дмитрий Волков', navigator: 'Мария Иванова' },
  { team: 'Стихия', driver: 'Алексей Кузнецов', navigator: 'Елена Смирнова' },
  { team: 'Ураган', driver: 'Сергей Попов', navigator: 'Ольга Козлова' },
  { team: 'Фантом', driver: 'Иван Новиков', navigator: 'Наталья Соколова' },
  { team: 'Вихрь', driver: 'Павел Морозов', navigator: 'Юлия Борисова' },
  { team: 'Метеор', driver: 'Роман Зеленов', navigator: 'Полина Кarpова' },
  { team: 'Конкорд', driver: 'Никита Тихонов', navigator: 'Виктория Лукьянова' },
  { team: ' Younker', driver: 'Антон Семёнов', navigator: 'Полина Беляева' },
  { team: 'Экзит', driver: 'Денис Фролов', navigator: 'Галина Чёрная' },
  { team: 'Валкайрия', driver: 'Константин Орлов', navigator: 'Людмила Степанова' },
  { team: 'Драгон', driver: 'Фёдор Горбачёв', navigator: 'Надежда القасим' },
  { team: 'Тайфун', driver: 'Геннадий Рогозин', navigator: 'Ирина Калинина' },
  { team: 'Нейтрон', driver: 'Станислав Петров', navigator: 'Светлана Ломова' },
  { team: 'Аист', driver: 'Виталий Касаткин', navigator: 'Валентина Шарова' },
  { team: 'Пульсар', driver: 'Олег Шестаков', navigator: 'Дарья Кириллова' },
  { team: 'Кнайт', driver: 'Марк Резниченко', navigator: 'Людмила Вашенко' },
  { team: 'Аэро', driver: 'Степан Матвеев', navigator: 'Ксения Гаврилова' },
  { team: 'Фаэнон', driver: 'Георг Беrestин', navigator: 'Анастасия Овчарова' },
];

const colors = [
  { color: '#FF3366', glow: 'rgba(255, 51, 102, 0.6)' },
  { color: '#00D4FF', glow: 'rgba(0, 212, 255, 0.6)' },
  { color: '#FFD600', glow: 'rgba(255, 214, 0, 0.6)' },
  { color: '#00FF88', glow: 'rgba(0, 255, 136, 0.6)' },
  { color: '#FF6B35', glow: 'rgba(255, 107, 53, 0.6)' },
  { color: '#A855F7', glow: 'rgba(168, 85, 247, 0.6)' },
  { color: '#06B6D4', glow: 'rgba(6, 182, 212, 0.6)' },
  { color: '#F43F5E', glow: 'rgba(244, 63, 94, 0.6)' },
  { color: '#10B981', glow: 'rgba(16, 185, 129, 0.6)' },
  { color: '#F59E0B', glow: 'rgba(245, 158, 11, 0.6)' },
  { color: '#3B82F6', glow: 'rgba(59, 130, 246, 0.6)' },
  { color: '#EC4899', glow: 'rgba(236, 72, 153, 0.6)' },
  { color: '#14B8A6', glow: 'rgba(20, 184, 166, 0.6)' },
  { color: '#EF4444', glow: 'rgba(239, 68, 68, 0.6)' },
  { color: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.6)' },
  { color: '#F97316', glow: 'rgba(249, 115, 22, 0.6)' },
  { color: '#22C55E', glow: 'rgba(34, 197, 94, 0.6)' },
  { color: '#0EA5E9', glow: 'rgba(14, 165, 233, 0.6)' },
  { color: '#D946EF', glow: 'rgba(217, 70, 239, 0.6)' },
];

const factPercentages = [
  95, 78, 112, 67, 88, 102, 55, 91, 73, 85,
  118, 62, 97, 45, 108, 83, 71, 93, 76
];

function generateWeeklyHistory(crewIndex: number, currentFact: number, target: number): { week: number; connectedPoints: number; salesVolume: number; skuCount: number }[] {
  const weeks: { week: number; connectedPoints: number; salesVolume: number; skuCount: number }[] = [];
  const totalWeeks = 12;
  const variance = 0.3 + (crewIndex % 3) * 0.1;

  for (let w = 1; w <= totalWeeks; w++) {
    const randomFactor = 0.7 + Math.random() * 0.6;
    const weekTarget = Math.round(target * (w / totalWeeks) * randomFactor);
    const weekFact = Math.round(weekTarget * (currentFact / target) * (0.85 + Math.random() * variance));

    weeks.push({
      week: w,
      connectedPoints: Math.max(0, weekFact),
      salesVolume: Math.round(weekFact * (50 + Math.random() * 150)),
      skuCount: Math.min(weekFact * 3, Math.round(10 + Math.random() * 40)),
    });
  }
  return weeks;
}

export function generateMockData(): Crew[] {
  return crewNames.map((crew, index) => {
    const connectedTarget = 25 + Math.floor(Math.random() * 15);
    const salesTarget = connectedTarget * 120 + Math.floor(Math.random() * 500);
    const skuTarget = 40 + Math.floor(Math.random() * 30);

    const factPct = factPercentages[index] / 100;

    const connectedFact = Math.round(connectedTarget * factPct);
    const salesFact = Math.round(salesTarget * factPct * (0.9 + Math.random() * 0.2));
    const skuFact = Math.round(skuTarget * factPct * (0.85 + Math.random() * 0.3));

    return {
      id: index + 1,
      teamName: crew.team,
      driver: {
        name: crew.driver,
        avatar: `https://i.pravatar.cc/150?img=${(index * 3) % 70 + 1}`,
      },
      navigator: {
        name: crew.navigator,
        avatar: `https://i.pravatar.cc/150?img=${(index * 3 + 1) % 70 + 1}`,
      },
      color: colors[index].color,
      glowColor: colors[index].glow,
      metrics: {
        connectedPoints: { target: connectedTarget, fact: connectedFact },
        salesVolume: { target: salesTarget, fact: salesFact },
        skuCount: { target: skuTarget, fact: skuFact },
      },
      weeklyHistory: generateWeeklyHistory(index, connectedFact, connectedTarget),
      checkpoint1: factPct > 0.3,
      checkpoint2: factPct > 0.65,
    };
  });
}

export const mockCrews = generateMockData();
