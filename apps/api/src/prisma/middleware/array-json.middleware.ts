/**
 * Prisma Middleware: Array to JSON String Conversion
 *
 * Note: This middleware is deprecated as Prisma v5+ does not support $use
 * Kept for reference only - JSON conversion is now done manually in service layers
 *
 * SQLite에서 배열 타입을 지원하지 않기 때문에,
 * 배열 필드를 JSON 문자열로 자동 변환하는 미들웨어입니다.
 *
 * 적용 대상:
 * - UserPlace.labels (String[])
 * - UserPlace.photos (String[])
 * - Review.photos (String[])
 */

// 배열 필드 정의
interface ArrayFields {
  [model: string]: string[];
}

const ARRAY_FIELDS: ArrayFields = {
  userPlace: ['labels', 'photos'],
  review: ['photos'],
};

/**
 * 배열을 JSON 문자열로 변환
 */
function arrayToJson(value: unknown): string {
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value === 'string') {
    // 이미 JSON 문자열인 경우 그대로 반환
    return value;
  }
  // null이나 undefined는 빈 배열로 처리
  return JSON.stringify([]);
}

/**
 * JSON 문자열을 배열로 변환
 */
function jsonToArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    // 이미 배열인 경우 그대로 반환
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // JSON 파싱 실패 시 빈 배열 반환
      return [];
    }
  }
  // null이나 undefined는 빈 배열로 처리
  return [];
}

/**
 * 배열 필드를 JSON으로 변환 (쓰기 작업)
 */
function convertArrayFieldsToJson(model: string, data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const fields = ARRAY_FIELDS[model];
  if (!fields) {
    return data;
  }

  const converted = { ...data };
  for (const field of fields) {
    if (field in converted) {
      (converted as Record<string, unknown>)[field] = arrayToJson(
        (converted as Record<string, unknown>)[field],
      );
    }
  }

  return converted;
}

/**
 * JSON을 배열 필드로 변환 (읽기 작업)
 */
function convertJsonFieldsToArray(model: string, result: unknown): unknown {
  if (!result) {
    return result;
  }

  const fields = ARRAY_FIELDS[model];
  if (!fields) {
    return result;
  }

  // 단일 객체 처리
  if (typeof result === 'object' && !Array.isArray(result)) {
    const converted = { ...result };
    for (const field of fields) {
      if (field in converted) {
        (converted as Record<string, unknown>)[field] = jsonToArray(
          (converted as Record<string, unknown>)[field],
        );
      }
    }
    return converted;
  }

  // 배열 처리 (findMany 등)
  if (Array.isArray(result)) {
    return result.map((item) => {
      if (typeof item === 'object' && item !== null) {
        const converted = { ...item };
        for (const field of fields) {
          if (field in converted) {
            (converted as Record<string, unknown>)[field] = jsonToArray(
              (converted as Record<string, unknown>)[field],
            );
          }
        }
        return converted;
      }
      return item;
    });
  }

  return result;
}

/**
 * Prisma 미들웨어 함수
 * Note: This middleware is deprecated as Prisma v5+ does not support $use
 * Kept for reference only - JSON conversion is now done manually
 */
type MiddlewareParams = {
  model?: string;
  action: string;
  args: {
    data?: unknown;
    create?: unknown;
    update?: unknown;
  };
};

type MiddlewareNext = (params: MiddlewareParams) => Promise<unknown>;

export const arrayJsonMiddleware = async (params: MiddlewareParams, next: MiddlewareNext): Promise<unknown> => {
  const { model, action, args } = params;

  if (!model) {
    return next(params);
  }

  const modelName = model.toLowerCase();

  // 쓰기 작업: 배열 → JSON
  if (['create', 'update', 'upsert', 'createMany', 'updateMany'].includes(action)) {
    if (args.data) {
      args.data = convertArrayFieldsToJson(modelName, args.data);
    }

    // upsert의 경우 create와 update 모두 변환
    if (action === 'upsert') {
      if (args.create) {
        args.create = convertArrayFieldsToJson(modelName, args.create);
      }
      if (args.update) {
        args.update = convertArrayFieldsToJson(modelName, args.update);
      }
    }
  }

  // 쿼리 실행
  const result = await next(params);

  // 읽기 작업: JSON → 배열
  if (['findUnique', 'findFirst', 'findMany', 'create', 'update', 'upsert'].includes(action)) {
    return convertJsonFieldsToArray(modelName, result);
  }

  return result;
};
