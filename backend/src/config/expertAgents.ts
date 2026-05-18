import { ExpertAgent } from '../types/coordination';

export const EXPERT_AGENTS_POOL: ExpertAgent[] = [
  {
    id: 'analyst',
    name: '数据分析专家',
    description: '擅长数据分析、统计建模和可视化呈现',
    skills: ['数据分析', '统计分析', '数据可视化', '报表生成'],
    model_id: 'deepseek-chat',
    capabilities: ['数据分析', '统计检验', '趋势分析'],
    status: 'idle',
  },
  {
    id: 'strategy',
    name: '战略规划师',
    description: '擅长战略规划和商业决策分析',
    skills: ['战略分析', '市场研究', '竞争分析', '商业洞察'],
    model_id: 'deepseek-chat',
    capabilities: ['战略规划', '市场分析', '竞争情报'],
    status: 'idle',
  },
  {
    id: 'researcher',
    name: '研究员',
    description: '擅长学术研究和知识整合',
    skills: ['学术研究', '文献综述', '深度分析', '知识整理'],
    model_id: 'deepseek-chat',
    capabilities: ['文献检索', '知识整合', '学术写作'],
    status: 'idle',
  },
];

export const recommendAgentsForTask = (taskDescription: string, requiredSkills?: string[]): ExpertAgent[] => {
  const keywords = taskDescription.toLowerCase();
  
  return EXPERT_AGENTS_POOL.filter(agent => 
    agent.skills.some(skill => keywords.includes(skill.toLowerCase()))
  );
};

export const getAgentById = (agentId: string): ExpertAgent | undefined => {
  return EXPERT_AGENTS_POOL.find(agent => agent.id === agentId);
};