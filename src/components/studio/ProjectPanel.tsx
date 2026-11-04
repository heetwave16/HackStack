'use client';

import { useEffect, useState } from 'react';
import { History, Link2, Save, Send, Users } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { HackStackInput, HackStackOutput } from '@/types/hackstack';
import { supabaseBrowser } from '@/lib/supabase-browser';

interface ProjectPanelProps {
  user: User | null;
  input: HackStackInput;
  output: HackStackOutput;
  projectId: string | null;
  onProjectSaved: (id: string) => void;
  onProjectLoaded: (project: { id: string; input: HackStackInput; output: HackStackOutput }) => void;
  onNotice: (text: string) => void;
}

type SavedProject = {
  id: string;
  project_name: string;
  created_at: string;
  idea: string;
  stack: string;
  features: string[];
  result: HackStackOutput;
};

export default function ProjectPanel({ user, input, output, projectId, onProjectSaved, onProjectLoaded, onNotice }: ProjectPanelProps) {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || !supabaseBrowser) {
      setProjects([]);
      return;
    }
    const supabase = supabaseBrowser;
    void supabase.rpc('accept_my_project_invites');
    void supabase
      .from('projects')
      .select('id, project_name, idea, stack, features, result, created_at')
      .order('updated_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setProjects((data ?? []) as SavedProject[]);
      });
  }, [user, projectId]);

  if (!user || !supabaseBrowser) {
    return <p className="border-t border-line pt-5 text-xs leading-relaxed text-fg-3">Sign in above to save projects, invite teammates, and keep a private build history.</p>;
  }
  const supabase = supabaseBrowser;
  const currentUser = user;

  async function saveProject() {
    setBusy(true);
    const payload = {
      owner_id: currentUser.id,
      project_name: output.projectName,
      idea: input.idea,
      stack: input.stack,
      features: input.features,
      result: output
    };
    const query = projectId
      ? supabase.from('projects').update(payload).eq('id', projectId).select('id').single()
      : supabase.from('projects').insert(payload).select('id').single();
    const { data, error } = await query;
    setBusy(false);
    if (error) {
      onNotice(error.message);
      return;
    }
    onProjectSaved(data.id);
    onNotice(projectId ? 'Project updated in Supabase.' : 'Project saved to Supabase.');
  }

  async function createShareLink() {
    if (!projectId) {
      await saveProject();
      return;
    }
    const token = crypto.randomUUID().replaceAll('-', '');
    const { error } = await supabase.from('project_share_links').insert({
      project_id: projectId,
      created_by: currentUser.id,
      token
    });
    if (error) onNotice(error.message);
    else {
      await navigator.clipboard.writeText(`${window.location.origin}/share/${token}`);
      onNotice('Private share link copied.');
    }
  }

  async function invite() {
    if (!projectId || !inviteEmail.trim()) return;
    const { error } = await supabase.from('project_invites').insert({
      project_id: projectId,
      invited_by: currentUser.id,
      email: inviteEmail.trim().toLowerCase()
    });
    if (error) onNotice(error.message);
    else {
      setInviteEmail('');
      onNotice('Invitation recorded. Send the teammate the project link.');
    }
  }

  return (
    <section className="flex flex-col gap-4 border-t border-line pt-5">
      <div className="flex items-center justify-between">
        <h2 className="eyebrow">Project desk</h2>
        <span className="font-mono text-[10px] text-accent">{projects.length} saved</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => void saveProject()} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-md border border-line bg-surface-1 px-2 py-2 text-xs text-fg-2 hover:border-line-strong hover:text-fg disabled:opacity-50">
          <Save className="h-3.5 w-3.5" /> {busy ? 'Saving' : 'Save'}
        </button>
        <button type="button" onClick={() => void createShareLink()} className="inline-flex items-center justify-center gap-2 rounded-md border border-line bg-surface-1 px-2 py-2 text-xs text-fg-2 hover:border-line-strong hover:text-fg">
          <Link2 className="h-3.5 w-3.5" /> Share
        </button>
      </div>
      <div className="flex gap-2">
        <input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="teammate@email.com" className="min-w-0 flex-1 rounded-md border border-line bg-surface-0 px-2.5 py-2 text-xs text-fg outline-none focus:border-accent" />
        <button type="button" disabled={!projectId || !inviteEmail.trim()} onClick={() => void invite()} className="rounded-md border border-line px-2.5 text-fg-2 hover:border-line-strong hover:text-fg disabled:opacity-40" aria-label="Invite teammate">
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
      {projects.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-fg-3"><History className="h-3 w-3" /> Recent projects</p>
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => onProjectLoaded({ id: project.id, input: { idea: project.idea, stack: project.stack, features: project.features }, output: project.result })}
              className="truncate text-left text-xs text-fg-2 hover:text-accent"
            >
              {project.project_name}
            </button>
          ))}
        </div>
      )}
      <p className="flex items-center gap-2 text-[10px] leading-relaxed text-fg-3"><Users className="h-3 w-3 shrink-0" /> Invite teammates or copy a private link when the build is ready for review.</p>
    </section>
  );
}
