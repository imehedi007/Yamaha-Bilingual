import { query } from '@/lib/server/mysql';

type QueryRow = Record<string, unknown>;

export interface PersonaPayload {
  behavior: number;
  destination_id: number | null;
  destination: string;
  destination_meta: {
    personality?: string;
    scene?: string;
  };
  aspiration_id: number | null;
  aspiration: string;
  aspiration_meta: {
    color?: string;
    final_color?: string;
  };
}

interface CandidateBike extends QueryRow {
  bike_id: number;
  model_name: string;
  type: string;
  description: string | null;
  image_url: string | null;
  colors: string[] | string | null;
  weight_percent: number;
  priority_order: number;
}

const FIXED_IDENTITY_BLOCK = [
  'Create a premium, ultra-realistic lifestyle portrait of the exact same person shown in the reference image.',
  'Preserve the exact face, hairstyle, facial hair, age, and identity with a strong 1:1 resemblance.',
  'Use realistic anatomy, seamless skin tones, and natural integration between the reference face and the generated body.',
].join(' ');

const FIXED_COMPOSITION_BLOCK = [
  'Use a vertical 3:4 campaign composition.',
  'Show the rider from head to toe with the full motorcycle visible.',
  'The rider should stand beside or lightly lean on the motorcycle with confident body language.',
  'Keep the face unobstructed and do not place a helmet on the head.',
].join(' ');

const FIXED_REALISM_BLOCK = [
  'Use ultra photorealistic commercial motorcycle photography.',
  'Preserve realistic Yamaha proportions, real materials, authentic lighting, shadows, and reflections.',
  'No cartoon styling, no illustration look, no distorted limbs, and no duplicate body parts.',
].join(' ');

function parseJsonRecord<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === 'object') return value as T;

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function parseColorList(value: unknown): string[] {
  const parsed = parseJsonRecord<string[] | string>(value, []);
  if (Array.isArray(parsed)) {
    return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  if (typeof parsed === 'string' && parsed.trim().length > 0) {
    return [parsed];
  }

  return [];
}

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function resolveColorMatch(availableColors: string[], aspirationColor: string) {
  if (!availableColors.length) {
    return {
      matchedColor: aspirationColor || 'Original Yamaha finish',
      hasMatch: false,
    };
  }

  const normalizedAspiration = normalizeToken(aspirationColor);
  if (!normalizedAspiration) {
    return {
      matchedColor: availableColors[0],
      hasMatch: false,
    };
  }

  const direct = availableColors.find((color) => normalizeToken(color) === normalizedAspiration);
  if (direct) {
    return { matchedColor: direct, hasMatch: true };
  }

  const partial = availableColors.find((color) => normalizeToken(color).includes(normalizedAspiration));
  if (partial) {
    return { matchedColor: partial, hasMatch: true };
  }

  return {
    matchedColor: availableColors[0],
    hasMatch: false,
  };
}

export function parsePersonaPayload(persona: string): PersonaPayload {
  const parsed = JSON.parse(persona) as Partial<PersonaPayload>;
  const destinationId = Number(parsed.destination_id);
  const aspirationId = Number(parsed.aspiration_id);

  return {
    behavior: Number(parsed.behavior),
    destination_id: Number.isFinite(destinationId) ? destinationId : null,
    destination: parsed.destination || 'Scenic Route',
    destination_meta: parsed.destination_meta || {},
    aspiration_id: Number.isFinite(aspirationId) ? aspirationId : null,
    aspiration: parsed.aspiration || 'Signature Presence',
    aspiration_meta: parsed.aspiration_meta || {},
  };
}

export async function selectBikeForPersona(persona: PersonaPayload) {
  const candidates = await query<CandidateBike[]>(`
    SELECT
      b.id AS bike_id,
      b.model_name,
      b.type,
      b.description,
      b.image_url,
      b.colors,
      m.weight_percent,
      m.priority_order
    FROM option_bike_mappings m
    JOIN bikes b ON b.id = m.bike_id
    WHERE m.option_id = ? AND m.is_active = TRUE
    ORDER BY m.priority_order ASC, m.id ASC
  `, [persona.behavior]);

  if (!candidates.length) {
    const fallback = await query<CandidateBike[]>(`
      SELECT
        id AS bike_id,
        model_name,
        type,
        description,
        image_url,
        colors,
        100 AS weight_percent,
        1 AS priority_order
      FROM bikes
      ORDER BY created_at ASC
      LIMIT 1
    `);

    if (!fallback.length) {
      throw new Error('No bikes are configured.');
    }

    const fallbackColors = parseColorList(fallback[0].colors);
    const fallbackColor = resolveColorMatch(fallbackColors, persona.aspiration_meta.color || '');

    return {
      bike: {
        id: fallback[0].bike_id,
        model_name: fallback[0].model_name,
        type: fallback[0].type,
        description: fallback[0].description,
        image_url: fallback[0].image_url,
        colors: fallbackColors,
      },
      resolvedColor: fallbackColor.matchedColor,
      selectionMeta: {
        strategy: 'fallback_first_bike',
        candidates: [],
      },
    };
  }

  const counts = await query<Array<{ bike_id: number; assigned_count: number }>>(`
    SELECT bike_id, COUNT(*) AS assigned_count
    FROM generations
    WHERE behavior_option_id = ?
    GROUP BY bike_id
  `, [persona.behavior]);

  const countMap = new Map(counts.map((row) => [Number(row.bike_id), Number(row.assigned_count)]));
  const totalAssigned = counts.reduce((sum, row) => sum + Number(row.assigned_count), 0);
  const aspirationColor = persona.aspiration_meta.color || '';

  const scored = candidates.map((candidate) => {
    const availableColors = parseColorList(candidate.colors);
    const colorResolution = resolveColorMatch(availableColors, aspirationColor);
    const assignedCount = countMap.get(candidate.bike_id) || 0;
    const expectedAfterNext = ((totalAssigned + 1) * candidate.weight_percent) / 100;
    const deficit = expectedAfterNext - assignedCount;
    const colorBonus = colorResolution.hasMatch ? 0.15 : 0;
    const finalScore = deficit + colorBonus + candidate.weight_percent / 10000 - candidate.priority_order / 100000;

    return {
      candidate,
      availableColors,
      colorResolution,
      assignedCount,
      deficit,
      finalScore,
    };
  });

  scored.sort((left, right) => {
    if (right.finalScore !== left.finalScore) {
      return right.finalScore - left.finalScore;
    }

    if (right.candidate.weight_percent !== left.candidate.weight_percent) {
      return right.candidate.weight_percent - left.candidate.weight_percent;
    }

    return left.candidate.priority_order - right.candidate.priority_order;
  });

  const winner = scored[0];

  return {
    bike: {
      id: winner.candidate.bike_id,
      model_name: winner.candidate.model_name,
      type: winner.candidate.type,
      description: winner.candidate.description,
      image_url: winner.candidate.image_url,
      colors: winner.availableColors,
    },
    resolvedColor: winner.colorResolution.matchedColor,
    selectionMeta: {
      strategy: 'weighted_distribution_with_color_bonus',
      aspiration_color: aspirationColor || null,
      total_behavior_generations: totalAssigned,
      candidates: scored.map((entry) => ({
        bike_id: entry.candidate.bike_id,
        model_name: entry.candidate.model_name,
        weight_percent: entry.candidate.weight_percent,
        priority_order: entry.candidate.priority_order,
        assigned_count: entry.assignedCount,
        matched_color: entry.colorResolution.matchedColor,
        color_match: entry.colorResolution.hasMatch,
        deficit: Number(entry.deficit.toFixed(4)),
        final_score: Number(entry.finalScore.toFixed(4)),
      })),
    },
  };
}

export function buildImagePrompt(args: {
  bikeModel: string;
  bikeColor: string;
  destinationScene: string;
  destinationMood: string;
  aspiration: string;
}) {
  const destinationScene = args.destinationScene || 'a premium scenic road';
  const destinationMood = args.destinationMood || 'confident, premium, and cinematic';
  const aspiration = args.aspiration || 'signature rider energy';

  return [
    FIXED_IDENTITY_BLOCK,
    FIXED_COMPOSITION_BLOCK,
    `Environment: ${destinationScene}.`,
    `Mood: ${destinationMood}.`,
    `Aspirational tone: ${aspiration}.`,
    `Vehicle: a realistic Yamaha ${args.bikeModel} in ${args.bikeColor}.`,
    'Wardrobe: premium biker streetwear with a polished Yamaha lifestyle aesthetic.',
    FIXED_REALISM_BLOCK,
  ].join(' ');
}
