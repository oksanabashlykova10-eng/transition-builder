import { describe, expect, it } from 'vitest';
import { createProject } from '../src/project/defaults/createProject';
import { parseProject, validateProject } from '../src/project/validation/validateProject';

describe('project document', () => {
  it('creates a valid transparent 1920 × 1080 project', () => {
    const project = createProject('Проверочный переход');
    expect(validateProject(project)).toEqual({ valid: true, errors: [] });
    expect(project.scene).toMatchObject({ width: 1920, height: 1080 });
    expect(project.scene.background.mode).toBe('transparent');
  });

  it('round-trips through JSON without losing data', () => {
    const project = createProject('Next morning');
    expect(parseProject(JSON.stringify(project))).toEqual(project);
  });

  it('rejects an invalid scene size', () => {
    const project = createProject();
    const invalid = { ...project, scene: { ...project.scene, width: 1280 } };
    expect(validateProject(invalid).valid).toBe(false);
  });
});
