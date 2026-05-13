import { ParsedTask, TaskParseResult } from '../types/coordination';

const DEBUG = process.env.NODE_ENV !== 'production';

export class TaskParser {
  static parseTaskFromPrompt(prompt: string): TaskParseResult {
    const trimmedPrompt = prompt.trim();
    if (DEBUG) console.log('[TaskParser] Input prompt:', trimmedPrompt.substring(0, 200));

    const taskLabels = ['任务A', '任务B', '任务C', '任务D', '任务1', '任务2', '任务3', '任务4', '任务甲', '任务乙', '任务丙', '任务丁'];

    const hasTaskStructure = taskLabels.some(label =>
      trimmedPrompt.includes(label)
    );

    if (!hasTaskStructure) {
      if (DEBUG) console.log('[TaskParser] No task structure detected');
      return {
        success: false,
        tasks: [],
        mainQuestion: trimmedPrompt,
        error: '未检测到任务结构，请使用"任务A、任务B、任务C"格式描述'
      };
    }

    if (DEBUG) console.log('[TaskParser] Task structure detected, extracting tasks...');
    const parsedTasks = this.extractAllTasks(trimmedPrompt);
    if (DEBUG) console.log('[TaskParser] Extracted tasks:', parsedTasks.length, parsedTasks);

    const mainQuestion = this.extractMainQuestion(trimmedPrompt, parsedTasks);
    if (DEBUG) console.log('[TaskParser] Extracted main question:', mainQuestion);

    if (parsedTasks.length === 0) {
      if (DEBUG) console.log('[TaskParser] Failed to parse any tasks');
      return {
        success: false,
        tasks: [],
        mainQuestion: trimmedPrompt,
        error: '未能识别出具体任务'
      };
    }

    if (DEBUG) console.log('[TaskParser] Successfully parsed', parsedTasks.length, 'tasks');
    return {
      success: true,
      tasks: parsedTasks,
      mainQuestion: mainQuestion || trimmedPrompt
    };
  }

  private static extractAllTasks(prompt: string): ParsedTask[] {
    const tasks: ParsedTask[] = [];
    const taskLabels = ['任务A', '任务B', '任务C', '任务D', '任务1', '任务2', '任务3', '任务4', '任务甲', '任务乙', '任务丙', '任务丁'];

    const sortedLabels = taskLabels.sort((a, b) => b.length - a.length);
    if (DEBUG) console.log('[TaskParser] Searching for task labels in prompt');

    for (const label of sortedLabels) {
      const labelIndex = prompt.indexOf(label);
      if (labelIndex === -1) continue;

      if (DEBUG) console.log(`[TaskParser] Found label "${label}" at index ${labelIndex}`);

      let startIndex = labelIndex + label.length;
      let endIndex = -1;

      for (const nextLabel of sortedLabels) {
        if (nextLabel === label) continue;
        const nextIndex = prompt.indexOf(nextLabel, startIndex);
        if (nextIndex !== -1 && (endIndex === -1 || nextIndex < endIndex)) {
          endIndex = nextIndex;
          if (DEBUG) console.log(`[TaskParser] Next label "${nextLabel}" found at ${nextIndex}`);
        }
      }

      let description = '';
      if (endIndex !== -1) {
        description = prompt.substring(startIndex, endIndex).trim();
      } else {
        description = prompt.substring(startIndex).trim();
      }

      description = description
        .replace(/^[:：.\s]+/, '')
        .replace(/^[^\u4e00-\u9fa5a-zA-Z]+/, '')
        .trim();

      if (DEBUG) console.log(`[TaskParser] Task "${label}" description:`, description.substring(0, 100));

      if (description.length > 0) {
        tasks.push({
          name: label,
          description: description
        });
      }
    }

    if (tasks.length === 0) {
      if (DEBUG) console.log('[TaskParser] Primary extraction failed, trying fallback');
      const fallbackTasks = this.fallbackParse(prompt);
      if (fallbackTasks.length > 0) {
        if (DEBUG) console.log('[TaskParser] Fallback extraction succeeded:', fallbackTasks.length, 'tasks');
        return fallbackTasks;
      }
    }

    return tasks;
  }

  private static fallbackParse(prompt: string): ParsedTask[] {
    const tasks: ParsedTask[] = [];

    if (DEBUG) console.log('[TaskParser] Running fallback parse');

    const patterns = [
      /(?:任务|task)[:：]\s*([\s\S]*?)(?=(?:任务|task)|$)/gi,
      /任务\s*([A-Da-d\d])[:：.\s]*(.+?)(?=(?:任务\s*[A-Da-d\d])|$)/gi,
    ];

    for (const pattern of patterns) {
      const matches = [...prompt.matchAll(new RegExp(pattern.source, pattern.flags))];
      if (DEBUG) console.log(`[TaskParser] Pattern "${pattern.source}" matched ${matches.length} times`);

      if (matches.length > 0) {
        for (const match of matches) {
          if (match[1] && match[2]) {
            if (DEBUG) console.log(`[TaskParser] Fallback match: ${match[1]} -> ${match[2].substring(0, 50)}`);
            tasks.push({
              name: `任务${match[1]}`,
              description: match[2].trim()
            });
          } else if (match[1]) {
            const parts = match[1].split(/[，,、\n]+/);
            for (const part of parts) {
              const cleaned = part.trim().replace(/^[A-Da-d\d][.：:)\s]*/, '');
              if (cleaned.length > 5) {
                tasks.push({
                  name: `任务${String.fromCharCode(65 + tasks.length)}`,
                  description: cleaned
                });
              }
            }
          }
        }
        if (tasks.length > 0) return tasks;
      }
    }

    return tasks;
  }

  private static extractMainQuestion(prompt: string, tasks: ParsedTask[]): string {
    if (tasks.length === 0) return prompt;

    const firstTask = tasks[0];
    const firstTaskFull = '任务' + firstTask.name.replace('任务', '');

    const firstTaskIndex = prompt.indexOf(firstTaskFull);
    if (firstTaskIndex === -1) {
      const altIndex = prompt.indexOf(firstTask.name);
      if (altIndex !== -1) {
        return prompt.substring(0, altIndex).trim();
      }
    }

    const mainQuestionEnd = firstTaskIndex;
    let mainQuestion = prompt.substring(0, mainQuestionEnd).trim();

    mainQuestion = mainQuestion
      .replace(/^[:：.\s]+/, '')
      .replace(/请帮我?[^，,、\s]*/g, '')
      .replace(/^分析/i, '')
      .trim();

    const questionIndicators = ['如何', '怎么', '为什么', '是什么', '请问', '我想知道', '能否', '是否', '?', '？'];
    for (const indicator of questionIndicators) {
      const idx = mainQuestion.indexOf(indicator);
      if (idx !== -1 && idx > 5) {
        mainQuestion = mainQuestion.substring(idx);
        break;
      }
    }

    if (mainQuestion.length < 5 && tasks.length > 0) {
      return `针对以下问题提供分析：${tasks.map(t => t.description).join('、')}`;
    }

    return mainQuestion;
  }
}