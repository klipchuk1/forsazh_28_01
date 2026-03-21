-- ============================================================
-- ФОРСАЖ: Add video_url column & update avatars/videos
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add video_url column if not exists
ALTER TABLE crews ADD COLUMN IF NOT EXISTS video_url TEXT NOT NULL DEFAULT '';


-- 2. Fix 7 placeholder crews — rename "Экипаж N" to real names
-- and set driver/navigator names + avatars + video_url

-- ID 1: Кремлёвский утёс
UPDATE crews SET
  team_name = 'Кремлёвский утёс',
  driver_name = 'Холодов Андрей',
  navigator_name = 'Исмагилов Артём',
  driver_avatar = '/avatars/kholodov.jpg',
  navigator_avatar = '/avatars/ismagilov.jpg',
  video_url = '/videos/crew-1.mp4'
WHERE id = 1;

-- ID 2: Спасская башня
UPDATE crews SET
  team_name = 'Спасская башня',
  driver_name = 'Кузнецов Александр',
  navigator_name = 'Тазиев Руслан',
  driver_avatar = '/avatars/kuznetsov.jpg',
  navigator_avatar = '/avatars/taziev.jpg',
  video_url = '/videos/crew-2.mp4'
WHERE id = 2;

-- ID 3: Царицынский бастион
UPDATE crews SET
  team_name = 'Царицынский бастион',
  driver_name = 'Шугуров Артём',
  navigator_name = 'Радаева Ирина',
  driver_avatar = '/avatars/shugurov.jpg',
  navigator_avatar = '/avatars/radaeva.jpg',
  video_url = '/videos/crew-3.mp4'
WHERE id = 3;

-- ID 7: Армавирский сокол
UPDATE crews SET
  team_name = 'Армавирский сокол',
  driver_name = 'Синявский Александр',
  navigator_name = 'Машуров Олег',
  driver_avatar = '/avatars/sinyavinskiy.jpg',
  navigator_avatar = '/avatars/mashurov.jpg',
  video_url = '/videos/crew-7.mp4'
WHERE id = 7;

-- ID 8: Морской бриз
UPDATE crews SET
  team_name = 'Морской бриз',
  driver_name = 'Ганин Анатолий',
  navigator_name = 'Бойчук Пётр',
  driver_avatar = '/avatars/ganin.jpg',
  navigator_avatar = '/avatars/boychuk.jpg',
  video_url = '/videos/crew-8.mp4'
WHERE id = 8;

-- ID 16: Байкальский лёд
UPDATE crews SET
  team_name = 'Байкальский лёд',
  driver_name = 'Копылевич Александр',
  navigator_name = 'Ровенский Алексей',
  driver_avatar = '/avatars/kopylevich.jpg',
  navigator_avatar = '/avatars/rovenskiy.jpg',
  video_url = '/videos/crew-16.mp4'
WHERE id = 16;

-- ID 17: Ледовый шторм
UPDATE crews SET
  team_name = 'Ледовый шторм',
  driver_name = 'Колесников Дмитрий',
  navigator_name = 'Тихонов Вячеслав',
  driver_avatar = '/avatars/kolesnikov.jpg',
  navigator_avatar = '/avatars/tikhonov.jpg',
  video_url = '/videos/crew-17.mp4'
WHERE id = 17;


-- 3. Update avatars for remaining 12 crews (by ID)

UPDATE crews SET
  driver_avatar = '/avatars/yakimenko.jpg',
  navigator_avatar = '/avatars/pavlenko.jpg'
WHERE id = 18; -- Амурский тигр

UPDATE crews SET
  driver_avatar = '/avatars/feler.jpg',
  navigator_avatar = '/avatars/yakhontov.jpg'
WHERE id = 6; -- Армавирский щит

UPDATE crews SET
  driver_avatar = '/avatars/borka.jpg',
  navigator_avatar = '/avatars/mizinova.jpg'
WHERE id = 14; -- Ворошиловская батарея

UPDATE crews SET
  driver_avatar = '/avatars/polyanichenko.jpg',
  navigator_avatar = '/avatars/siryk.jpg'
WHERE id = 19; -- Дальневосточный гром

UPDATE crews SET
  driver_avatar = '/avatars/denisov.jpg',
  navigator_avatar = '/avatars/trepyshko.jpg'
WHERE id = 12; -- Енисейский порог

UPDATE crews SET
  driver_avatar = '/avatars/petrakov.jpg',
  navigator_avatar = '/avatars/tatsenko.jpg'
WHERE id = 4; -- Казачий острог

UPDATE crews SET
  driver_avatar = '/avatars/dyukov.jpg',
  navigator_avatar = '/avatars/zavgorodniy.jpg'
WHERE id = 9; -- Крымская весна

UPDATE crews SET
  driver_avatar = '/avatars/sasin.jpg',
  navigator_avatar = '/avatars/lavrentsov.jpg'
WHERE id = 5; -- Кубанская застава

UPDATE crews SET
  driver_avatar = '/avatars/lager.jpg',
  navigator_avatar = '/avatars/salimgarieva.jpg'
WHERE id = 10; -- Морской бастион

UPDATE crews SET
  driver_avatar = '/avatars/niyasov.jpg',
  navigator_avatar = '/avatars/safonov.jpg'
WHERE id = 13; -- Приморский дракон

UPDATE crews SET
  driver_avatar = '/avatars/onishko.jpg',
  navigator_avatar = '/avatars/khaldeeva.jpg'
WHERE id = 15; -- Русский остров

UPDATE crews SET
  driver_avatar = '/avatars/legkov.jpg',
  navigator_avatar = '/avatars/polyakov.jpg'
WHERE id = 11; -- Хакасский беркут


-- 4. Set video_url for all crews uniformly as crew-{id}.mp4
UPDATE crews SET video_url = '/videos/crew-' || id || '.mp4'
WHERE video_url = '' OR video_url IS NULL;


-- 5. Verify: all crews should have video_url, avatars, and real names
SELECT id, team_name, video_url, driver_name, navigator_name, driver_avatar, navigator_avatar
FROM crews ORDER BY sort_order, id;


-- 6. Re-create the RPC function with correct metric names and totalScore/finishTarget
CREATE OR REPLACE FUNCTION get_crews_full()
RETURNS JSON AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT
      c.id,
      c.team_name AS "teamName",
      json_build_object('name', c.driver_name, 'avatar', c.driver_avatar) AS driver,
      json_build_object('name', c.navigator_name, 'avatar', c.navigator_avatar) AS navigator,
      c.color,
      c.glow_color AS "glowColor",
      c.video_url AS "videoUrl",
      c.checkpoint1,
      c.checkpoint2,
      -- totalScore = sum of all fact values
      (
        COALESCE((SELECT fact FROM crew_metrics WHERE crew_id = c.id AND metric = 'distribution'), 0) +
        COALESCE((SELECT fact FROM crew_metrics WHERE crew_id = c.id AND metric = 'contracts'), 0) +
        COALESCE((SELECT fact FROM crew_metrics WHERE crew_id = c.id AND metric = 'liga_pro'), 0) +
        COALESCE((SELECT fact FROM crew_metrics WHERE crew_id = c.id AND metric = 'contacts'), 0)
      ) AS "totalScore",
      -- finishTarget = sum of all target values
      (
        COALESCE((SELECT target FROM crew_metrics WHERE crew_id = c.id AND metric = 'distribution'), 0) +
        COALESCE((SELECT target FROM crew_metrics WHERE crew_id = c.id AND metric = 'contracts'), 0) +
        COALESCE((SELECT target FROM crew_metrics WHERE crew_id = c.id AND metric = 'liga_pro'), 0) +
        COALESCE((SELECT target FROM crew_metrics WHERE crew_id = c.id AND metric = 'contacts'), 0)
      ) AS "finishTarget",
      json_build_object(
        'distribution', json_build_object(
          'target', COALESCE((SELECT target FROM crew_metrics WHERE crew_id = c.id AND metric = 'distribution'), 0),
          'fact', COALESCE((SELECT fact FROM crew_metrics WHERE crew_id = c.id AND metric = 'distribution'), 0)
        ),
        'contracts', json_build_object(
          'target', COALESCE((SELECT target FROM crew_metrics WHERE crew_id = c.id AND metric = 'contracts'), 0),
          'fact', COALESCE((SELECT fact FROM crew_metrics WHERE crew_id = c.id AND metric = 'contracts'), 0)
        ),
        'ligaPro', json_build_object(
          'target', COALESCE((SELECT target FROM crew_metrics WHERE crew_id = c.id AND metric = 'liga_pro'), 0),
          'fact', COALESCE((SELECT fact FROM crew_metrics WHERE crew_id = c.id AND metric = 'liga_pro'), 0)
        ),
        'contacts', json_build_object(
          'target', COALESCE((SELECT target FROM crew_metrics WHERE crew_id = c.id AND metric = 'contacts'), 0),
          'fact', COALESCE((SELECT fact FROM crew_metrics WHERE crew_id = c.id AND metric = 'contacts'), 0)
        )
      ) AS metrics,
      (
        SELECT COALESCE(json_agg(
          json_build_object(
            'week', wh.week,
            'connectedPoints', wh.connected_points,
            'salesVolume', wh.sales_volume,
            'skuCount', wh.sku_count
          ) ORDER BY wh.week
        ), '[]'::json)
        FROM weekly_history wh WHERE wh.crew_id = c.id
      ) AS "weeklyHistory",
      json_build_object(
        'warmup', json_build_object(
          'target', COALESCE((SELECT target FROM crew_segment_scores WHERE crew_id = c.id AND segment_key = 'warmup'), 0),
          'fact', COALESCE((SELECT fact FROM crew_segment_scores WHERE crew_id = c.id AND segment_key = 'warmup'), 0)
        ),
        'lap1', json_build_object(
          'target', COALESCE((SELECT target FROM crew_segment_scores WHERE crew_id = c.id AND segment_key = 'lap1'), 0),
          'fact', COALESCE((SELECT fact FROM crew_segment_scores WHERE crew_id = c.id AND segment_key = 'lap1'), 0)
        ),
        'lap2', json_build_object(
          'target', COALESCE((SELECT target FROM crew_segment_scores WHERE crew_id = c.id AND segment_key = 'lap2'), 0),
          'fact', COALESCE((SELECT fact FROM crew_segment_scores WHERE crew_id = c.id AND segment_key = 'lap2'), 0)
        ),
        'lap3', json_build_object(
          'target', COALESCE((SELECT target FROM crew_segment_scores WHERE crew_id = c.id AND segment_key = 'lap3'), 0),
          'fact', COALESCE((SELECT fact FROM crew_segment_scores WHERE crew_id = c.id AND segment_key = 'lap3'), 0)
        )
      ) AS "segmentScores",
      (
        SELECT COALESCE(json_agg(
          json_build_object(
            'label', ca.award_label,
            'category', ca.category,
            'place', ca.place,
            'month', ca.month
          )
        ), '[]'::json)
        FROM crew_awards ca WHERE ca.crew_id = c.id
      ) AS awards
    FROM crews c
    ORDER BY c.sort_order, c.id
  ) t;
$$ LANGUAGE sql STABLE;
