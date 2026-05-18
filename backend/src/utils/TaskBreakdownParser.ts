import { SubTask, TaskType } from '../types/coordination';

export class TaskBreakdownParser {
  static parse(userRequest: string): SubTask[] {
    return this.breakdownTask(userRequest);
  }

  static breakdownTask(userRequest: string): SubTask[] {
    const tasks: SubTask[] = [];
    
    const taskPatterns = [
      { regex: /任务[ABCDE]、?\s*(.+?)(?=任务[ABCDE]、|。|；|$)/g },
      { regex: /(\d+)\. (.+?)(?=\d+\. |。|；|$)/g },
    ];

    for (const { regex } of taskPatterns) {
      const matches = [...userRequest.matchAll(regex)];
      if (matches.length > 1) {
        matches.forEach((match, index) => {
          const cleanMatch = match[1].replace(/^[任务ABCDE]、?\s*/, '').trim();
          if (cleanMatch && cleanMatch.length > 5) {
            tasks.push(this.createSubTask(cleanMatch, index + 1));
          }
        });
        return tasks;
      }
    }

    if (tasks.length === 0) {
      tasks.push(this.createSubTask(userRequest, 1));
    }

    return tasks;
  }

  static regenerateSubTask(taskDescription: string): SubTask {
    return this.createSubTask(taskDescription, 1);
  }

  private static createSubTask(description: string, priority: number): SubTask {
    const estimatedType = this.detectTaskType(description);
    const requiredSkills = this.extractSkills(description);

    return {
      id: `task-${Date.now()}-${priority}`,
      title: this.generateTitle(description),
      description,
      required_skills: requiredSkills,
      estimated_type: estimatedType,
      dependencies: [],
      status: 'pending',
    };
  }

  private static detectTaskType(description: string): TaskType {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('分析') || lowerDesc.includes('统计')) {
      return 'analysis';
    }
    if (lowerDesc.includes('写作') || lowerDesc.includes('报告')) {
      return 'report-writing';
    }
    if (lowerDesc.includes('预测') || lowerDesc.includes('趋势')) {
      return 'trend-prediction';
    }
    if (lowerDesc.includes('案例') || lowerDesc.includes('研究')) {
      return 'case-study';
    }
    if (lowerDesc.includes('总结') || lowerDesc.includes('概括')) {
      return 'summarization';
    }
    if (lowerDesc.includes('收集') || lowerDesc.includes('调研')) {
      return 'data-collection';
    }
    if (lowerDesc.includes('解释') || lowerDesc.includes('说明')) {
      return 'detailed-explanation';
    }
    if (lowerDesc.includes('创意') || lowerDesc.includes('文案')) {
      return 'creative-writing';
    }
    
    return 'analysis';
  }

  private static extractSkills(description: string): string[] {
    const skillKeywords = ['数据分析', '市场分析', '战略规划', '文案写作', '报告撰写', '趋势预测'];
    return skillKeywords.filter(skill => description.includes(skill));
  }

  private static generateTitle(description: string): string {
    return description.length > 20 ? description.substring(0, 20) + '...' : description;
  }

  static generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}