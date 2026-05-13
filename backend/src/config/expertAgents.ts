import { ExpertAgent } from '../types/coordination';

export const EXPERT_AGENTS_POOL: ExpertAgent[] = [
  {
    id: 'agent-data-collector',
    name: '数据搬运工',
    description: '擅长联网检索和数据收集，能够快速找到各类统计数据、行业报告和量化指标',
    skills: ['数据检索', '数据分析', '信息挖掘', '网络搜索'],
    model_id: 'deepseek-v3',
    capabilities: ['联网搜索', '数据提取', '统计分析', '报告生成'],
    status: 'idle',
    estimated_time: 120,
  },
  {
    id: 'agent-case-analyst',
    name: '案例分析狮',
    description: '专注于企业案例研究和商业分析，能够深入剖析商业模式和成功实践',
    skills: ['案例研究', '商业分析', '市场调研', '竞争分析'],
    model_id: 'claude-3.5-sonnet',
    capabilities: ['案例挖掘', '商业洞察', '模式识别', '趋势分析'],
    status: 'idle',
    estimated_time: 180,
  },
  {
    id: 'agent-trend-predictor',
    name: '趋势预言家',
    description: '擅长基于当前信号预测未来趋势，具备批判性思维和前瞻性分析能力',
    skills: ['趋势预测', '批判性思维', '战略规划', '风险评估'],
    model_id: 'claude-3-opus',
    capabilities: ['趋势分析', '情景推演', '风险评估', '战略建议'],
    status: 'idle',
    estimated_time: 150,
  },
  {
    id: 'agent-report-writer',
    name: '首席撰稿人',
    description: '专业长文写作专家，能够将复杂信息整合为结构清晰、逻辑严谨的专业报告',
    skills: ['长文写作', '排版整合', '内容策划', '编辑润色'],
    model_id: 'deepseek-v3',
    capabilities: ['报告撰写', '内容整合', '逻辑梳理', '语言优化'],
    status: 'idle',
    estimated_time: 240,
  },
  {
    id: 'agent-code-expert',
    name: '代码工程师',
    description: '精通各类编程语言，能够处理代码生成、调试、优化等技术任务',
    skills: ['代码生成', '代码调试', '代码审查', '技术文档'],
    model_id: 'deepseek-r1',
    capabilities: ['编程', '调试', '代码审查', '技术写作'],
    status: 'idle',
    estimated_time: 90,
  },
  {
    id: 'agent-fact-checker',
    name: '事实核查员',
    description: '严谨的事实核查专家，擅长验证信息准确性和数据来源',
    skills: ['事实核查', '数据验证', '信息确认', '质量把控'],
    model_id: 'deepseek-r1',
    capabilities: ['信息验证', '数据校验', '来源追踪', '质量控制'],
    status: 'idle',
    estimated_time: 60,
  },
  {
    id: 'agent-creative-writer',
    name: '创意写手',
    description: '富有创造力的写作专家，擅长创意文案、营销内容和创意表达',
    skills: ['创意写作', '文案策划', '内容营销', '品牌传播'],
    model_id: 'deepseek-v3',
    capabilities: ['创意构思', '文案撰写', '品牌故事', '营销内容'],
    status: 'idle',
    estimated_time: 120,
  },
  {
    id: 'agent-summarizer',
    name: '总结大师',
    description: '擅长提炼核心信息和关键点，能够快速生成高质量的摘要和总结',
    skills: ['总结归纳', '要点提炼', '结论汇总', '信息压缩'],
    model_id: 'deepseek-moe',
    capabilities: ['摘要生成', '要点提取', '内容精简', '核心总结'],
    status: 'idle',
    estimated_time: 45,
  },
];

export const getAgentById = (agentId: string): ExpertAgent | undefined => {
  return EXPERT_AGENTS_POOL.find((agent) => agent.id === agentId);
};

export const getAgentsBySkill = (skill: string): ExpertAgent[] => {
  return EXPERT_AGENTS_POOL.filter((agent) =>
    agent.skills.some((s) => s.toLowerCase().includes(skill.toLowerCase()))
  );
};

export const getAvailableAgents = (): ExpertAgent[] => {
  return EXPERT_AGENTS_POOL.filter((agent) => agent.status === 'idle');
};

export const recommendAgentsForTask = (
  requiredSkills: string[],
  excludeBusy: boolean = true
): ExpertAgent[] => {
  const pool = excludeBusy ? getAvailableAgents() : EXPERT_AGENTS_POOL;

  const scoredAgents = pool.map((agent) => {
    const matchScore = requiredSkills.reduce((score, skill) => {
      const hasSkill = agent.skills.some(
        (s) => s.toLowerCase().includes(skill.toLowerCase())
      );
      return score + (hasSkill ? 1 : 0);
    }, 0);

    return {
      agent,
      score: matchScore,
    };
  });

  return scoredAgents
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.agent);
};
