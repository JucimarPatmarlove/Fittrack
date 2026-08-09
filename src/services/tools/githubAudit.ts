/// <reference types="node" />
// ════════════════════════════════════════════════════════════════
// FitTrack V7 — Arsenal MCP: GitHub Audit (Engenheiro de Segurança)
// ════════════════════════════════════════════════════════════════
//
// Lê dados do repositório GitHub via REST API v3.
// Usado para: auditoria de commits, leitura de código, issues.
// ════════════════════════════════════════════════════════════════

const GITHUB_API = 'https://api.github.com';

interface GitHubAuditParams {
  action: 'recent_commits' | 'file_content' | 'open_issues';
  file_path?: string;
  branch?: string;
}

/**
 * Executa uma operação de leitura no repositório GitHub do FitTrack.
 */
export async function executeGitHubAudit(params: GitHubAuditParams): Promise<string> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || 'JucimarPatmarlove/Fittrack';

  if (!token) {
    console.warn('[GitHub Audit] Token ausente. Ferramenta desativada.');
    return 'Auditoria GitHub não disponível (token não configurado). Responde sem dados do repositório.';
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `Bearer ${token}`,
    'User-Agent': 'FitTrack-AI-Coach',
  };

  const { action, file_path, branch = 'main' } = params;

  try {
    switch (action) {
      case 'recent_commits': {
        const res = await fetch(`${GITHUB_API}/repos/${repo}/commits?sha=${branch}&per_page=5`, {
          headers,
        });
        if (!res.ok) return `Erro GitHub (${res.status}). Verifica o token.`;
        const commits = (await res.json()) as Array<{
          sha: string;
          commit: { message: string; author: { name: string; date: string } };
        }>;
        const formatted = commits
          .map(
            (c, i) =>
              `[${i + 1}] ${c.sha.slice(0, 7)} — ${c.commit.message.split('\n')[0]}\n` +
              `    Autor: ${c.commit.author.name} | ${new Date(c.commit.author.date).toLocaleDateString('pt-PT')}`,
          )
          .join('\n\n');
        return `Últimos 5 commits na branch "${branch}":\n\n${formatted}`;
      }

      case 'file_content': {
        if (!file_path) return 'Parâmetro file_path é obrigatório para ler um ficheiro.';
        const res = await fetch(`${GITHUB_API}/repos/${repo}/contents/${file_path}?ref=${branch}`, {
          headers,
        });
        if (!res.ok) {
          if (res.status === 404)
            return `Ficheiro "${file_path}" não encontrado na branch "${branch}".`;
          return `Erro GitHub (${res.status}) ao ler "${file_path}".`;
        }
        const file = (await res.json()) as { content?: string; size: number; name: string };
        if (!file.content) return `Ficheiro "${file_path}" está vazio ou é demasiado grande.`;
        // GitHub devolve conteúdo em base64
        const decoded = Buffer.from(file.content, 'base64').toString('utf-8');
        // Limitar a 3000 chars para não exceder o contexto
        const truncated =
          decoded.length > 3000
            ? decoded.slice(0, 3000) + '\n\n[... ficheiro truncado a 3000 caracteres ...]'
            : decoded;
        return `Conteúdo de "${file.name}" (${file.size} bytes, branch: ${branch}):\n\`\`\`\n${truncated}\n\`\`\``;
      }

      case 'open_issues': {
        const res = await fetch(`${GITHUB_API}/repos/${repo}/issues?state=open&per_page=10`, {
          headers,
        });
        if (!res.ok) return `Erro GitHub (${res.status}) ao listar issues.`;
        const issues = (await res.json()) as Array<{
          number: number;
          title: string;
          labels: Array<{ name: string }>;
          created_at: string;
          user: { login: string };
        }>;
        if (issues.length === 0) return 'Nenhuma issue aberta no repositório. Tudo limpo!';
        const formatted = issues
          .map(
            (issue) =>
              `[#${issue.number}] ${issue.title}\n` +
              `    Labels: ${issue.labels.map((l) => l.name).join(', ') || 'nenhuma'} | ` +
              `Aberta por: ${issue.user.login} | ${new Date(issue.created_at).toLocaleDateString('pt-PT')}`,
          )
          .join('\n\n');
        return `Issues abertas (${issues.length}):\n\n${formatted}`;
      }

      default:
        return `Ação "${action}" não reconhecida. Válidas: recent_commits, file_content, open_issues.`;
    }
  } catch (error) {
    console.error('[GitHub Audit] Falha:', error);
    return 'Falha na ligação ao GitHub. Responde sem dados do repositório.';
  }
}
