import {
  CURRENT_SCHEMA_VERSION,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  type TransitionProject,
} from '../model/project';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export function validateProject(value: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(value)) return { valid: false, errors: ['Проект должен быть объектом.'] };
  if (value.schemaVersion !== CURRENT_SCHEMA_VERSION) errors.push('Неподдерживаемая версия проекта.');
  if (!isRecord(value.metadata) || typeof value.metadata.name !== 'string') errors.push('Не указано название проекта.');
  if (!isRecord(value.scene)) {
    errors.push('Отсутствуют настройки сцены.');
  } else if (value.scene.width !== SCENE_WIDTH || value.scene.height !== SCENE_HEIGHT) {
    errors.push('Логический размер сцены должен быть 1920 × 1080.');
  }
  if (!Array.isArray(value.layers)) errors.push('Список слоёв повреждён.');
  if (!Array.isArray(value.assets)) errors.push('Список ассетов повреждён.');
  if (!isRecord(value.timing)) errors.push('Отсутствуют настройки времени.');

  return { valid: errors.length === 0, errors };
}

export function parseProject(json: string): TransitionProject {
  const value: unknown = JSON.parse(json);
  const result = validateProject(value);
  if (!result.valid) throw new Error(result.errors.join(' '));
  return value as TransitionProject;
}
