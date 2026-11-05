// @vitest-environment jsdom

import { act, createElement, type ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { User } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectPanel from '@/components/studio/ProjectPanel';
import { FALLBACK_HACKSTACK_RESULT } from '@/types/hackstack';

const mocks = vi.hoisted(() => ({
  fetchProjects: vi.fn(),
  saveProject: vi.fn(),
  update: vi.fn(),
  rpc: vi.fn()
}));

vi.mock('@/lib/supabase-browser', () => {
  const saveQuery = { select: () => ({ single: mocks.saveProject }) };
  return {
    supabaseBrowser: {
      rpc: mocks.rpc,
      from: () => ({
        select: () => ({ order: () => ({ limit: mocks.fetchProjects }) }),
        update: (payload: unknown) => {
          mocks.update(payload);
          return { eq: () => saveQuery };
        },
        insert: () => saveQuery
      })
    }
  };
});

type Props = ComponentProps<typeof ProjectPanel>;

function project(version: number, id = 'project-a') {
  return {
    id,
    project_name: `Project V${version}`,
    created_at: '2026-01-01T00:00:00Z',
    idea: `Idea V${version}`,
    stack: 'Next.js',
    features: [`Feature V${version}`],
    result: { ...FALLBACK_HACKSTACK_RESULT, projectName: `Project V${version}`, tagline: `Tagline V${version}` }
  };
}

type QueryResult = { data: ReturnType<typeof project>[] | null; error: { message: string } | null };

function deferredQuery() {
  let resolve!: (value: QueryResult) => void;
  const promise = new Promise<QueryResult>((done) => { resolve = done; });
  return { promise, resolve };
}

describe('ProjectPanel recent projects', () => {
  let container: HTMLDivElement;
  let root: Root | null;
  let props: Props;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    const initial = project(1);
    props = {
      user: { id: 'user-a' } as User,
      input: { idea: initial.idea, stack: initial.stack, features: initial.features },
      output: initial.result,
      projectId: initial.id,
      onProjectSaved: vi.fn(),
      onProjectLoaded: vi.fn(),
      onNotice: vi.fn()
    };
  });

  afterEach(async () => {
    await act(async () => { root?.unmount(); });
    container.remove();
    vi.unstubAllGlobals();
  });

  async function render() {
    await act(async () => { root!.render(createElement(ProjectPanel, props)); });
  }

  function button(label: string): HTMLButtonElement {
    const match = Array.from(container.querySelectorAll('button')).find((node) => node.textContent?.trim() === label);
    expect(match).toBeDefined();
    return match!;
  }

  it('refetches after saving the same project ID and restores the new snapshot', async () => {
    const v1 = project(1);
    const v2 = project(2);
    mocks.fetchProjects
      .mockResolvedValueOnce({ data: [v1], error: null })
      .mockResolvedValueOnce({ data: [v2], error: null });
    mocks.saveProject.mockResolvedValue({ data: { id: v1.id }, error: null });
    await render();
    expect(button('Project V1')).toBeDefined();

    props = {
      ...props,
      input: { idea: v2.idea, stack: v2.stack, features: v2.features },
      output: v2.result
    };
    await render();
    expect(mocks.fetchProjects).toHaveBeenCalledTimes(1);
    await act(async () => { button('Save').click(); });

    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ result: v2.result, idea: v2.idea }));
    expect(props.onProjectSaved).toHaveBeenCalledWith(v1.id);
    expect(mocks.fetchProjects).toHaveBeenCalledTimes(2);
    await act(async () => { button('Project V2').click(); });
    expect(props.onProjectLoaded).toHaveBeenCalledWith({
      id: v2.id,
      input: { idea: v2.idea, stack: v2.stack, features: v2.features },
      output: v2.result
    });
    expect(container.textContent).not.toContain('Project V1');
  });

  it('ignores an obsolete fetch after the user changes', async () => {
    const oldRequest = deferredQuery();
    mocks.fetchProjects
      .mockReturnValueOnce(oldRequest.promise)
      .mockResolvedValueOnce({ data: [project(2, 'project-b')], error: null });
    await render();
    props = { ...props, user: { id: 'user-b' } as User };
    await render();
    await act(async () => { oldRequest.resolve({ data: [project(1)], error: null }); });

    expect(button('Project V2')).toBeDefined();
    expect(container.textContent).not.toContain('Project V1');
    expect(props.onNotice).not.toHaveBeenCalled();
  });

  it('ignores an obsolete fetch failure after unmount', async () => {
    const request = deferredQuery();
    mocks.fetchProjects.mockReturnValue(request.promise);
    await render();
    await act(async () => { root!.unmount(); });
    root = null;
    await act(async () => { request.resolve({ data: null, error: { message: 'Late failure' } }); });

    expect(props.onNotice).not.toHaveBeenCalled();
  });

  it.each(['query error', 'rejected request'])('surfaces a recent-project %s', async (failure) => {
    if (failure === 'query error') {
      mocks.fetchProjects.mockResolvedValue({ data: null, error: { message: 'Fetch failed' } });
    } else {
      mocks.fetchProjects.mockRejectedValue(new Error('Fetch failed'));
    }
    await render();

    expect(props.onNotice).toHaveBeenCalledWith('Could not load recent projects: Fetch failed');
    expect(container.textContent).not.toContain('Recent projects');
  });
});
