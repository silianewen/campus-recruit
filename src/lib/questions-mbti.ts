// 49-question MBTI-style personality assessment.
// 4 dimensions × 12-13 questions each: E/I, S/N, T/F, J/P (totals 13+12+12+12 = 49).
// Each question's answer maps +1 to one pole; the dominant pole per dimension
// determines that letter of the 4-letter type.

export interface MbtiQuestion {
  id: number
  dimension: 'EI' | 'SN' | 'TF' | 'JP'
  text: string
  options: { key: string; text: string; pole: 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P' }[]
}

export const MBTI_QUESTIONS: MbtiQuestion[] = [
  // ==================== EI (13 questions) ====================
  {
    id: 1, dimension: 'EI',
    text: '周末你更倾向怎么过？',
    options: [
      { key: 'a', text: '约朋友聚会、逛街、社交活动', pole: 'E' },
      { key: 'b', text: '一个人在家看书、看剧、充电', pole: 'I' },
    ],
  },
  {
    id: 2, dimension: 'EI',
    text: '小组讨论时你通常：',
    options: [
      { key: 'a', text: '主动发言、引导话题方向', pole: 'E' },
      { key: 'b', text: '先听完别人观点再补充', pole: 'I' },
    ],
  },
  {
    id: 3, dimension: 'EI',
    text: '面对陌生人多的场合：',
    options: [
      { key: 'a', text: '容易认识新朋友、聊得来', pole: 'E' },
      { key: 'b', text: '会有点累，需要回去独处恢复', pole: 'I' },
    ],
  },
  {
    id: 4, dimension: 'EI',
    text: '工作中遇到困难时你倾向：',
    options: [
      { key: 'a', text: '找人讨论、头脑风暴', pole: 'E' },
      { key: 'b', text: '自己先想清楚再请教别人', pole: 'I' },
    ],
  },
  {
    id: 5, dimension: 'EI',
    text: '以下哪种更让你有能量：',
    options: [
      { key: 'a', text: '参加一场热闹的分享会', pole: 'E' },
      { key: 'b', text: '安静地写代码/做手工', pole: 'I' },
    ],
  },
  {
    id: 6, dimension: 'EI',
    text: '你倾向于被介绍给一群新同事：',
    options: [
      { key: 'a', text: '一进来就挨个自我介绍', pole: 'E' },
      { key: 'b', text: '先旁观，等熟悉了再聊', pole: 'I' },
    ],
  },
  {
    id: 7, dimension: 'EI',
    text: '你更喜欢的沟通方式：',
    options: [
      { key: 'a', text: '电话 / 面谈 / 视频', pole: 'E' },
      { key: 'b', text: '文字消息 / 邮件', pole: 'I' },
    ],
  },
  {
    id: 8, dimension: 'EI',
    text: '会议中你通常：',
    options: [
      { key: 'a', text: '主动发表观点、引导讨论', pole: 'E' },
      { key: 'b', text: '倾听为主，会后单独反馈', pole: 'I' },
    ],
  },
  {
    id: 9, dimension: 'EI',
    text: '长时间独处后的感受：',
    options: [
      { key: 'a', text: '想找人聊聊换换心情', pole: 'E' },
      { key: 'b', text: '挺享受的、可以继续', pole: 'I' },
    ],
  },
  {
    id: 10, dimension: 'EI',
    text: '你在团队里更常扮演的角色：',
    options: [
      { key: 'a', text: '主动协调、推进事情', pole: 'E' },
      { key: 'b', text: '专注自己负责的那块', pole: 'I' },
    ],
  },
  {
    id: 11, dimension: 'EI',
    text: '面对陌生议题的讨论：',
    options: [
      { key: 'a', text: '先说几句试试水温', pole: 'E' },
      { key: 'b', text: '等想清楚了再发言', pole: 'I' },
    ],
  },
  {
    id: 12, dimension: 'EI',
    text: '你更享受：',
    options: [
      { key: 'a', text: '热闹的聚会、认识新朋友', pole: 'E' },
      { key: 'b', text: '安静的咖啡馆角落', pole: 'I' },
    ],
  },
  {
    id: 13, dimension: 'EI',
    text: '项目庆功宴你会：',
    options: [
      { key: 'a', text: '主动组织、活跃气氛', pole: 'E' },
      { key: 'b', text: '安静参加、聊几个人', pole: 'I' },
    ],
  },
  // ==================== SN (12 questions) ====================
  {
    id: 14, dimension: 'SN',
    text: '你更关注：',
    options: [
      { key: 'a', text: '眼前的事实和具体数据', pole: 'S' },
      { key: 'b', text: '未来的可能性和整体方向', pole: 'N' },
    ],
  },
  {
    id: 15, dimension: 'SN',
    text: '描述一件事时你倾向：',
    options: [
      { key: 'a', text: '举具体例子、数字、细节', pole: 'S' },
      { key: 'b', text: '讲概念、比喻、背后的意义', pole: 'N' },
    ],
  },
  {
    id: 16, dimension: 'SN',
    text: '你更信任：',
    options: [
      { key: 'a', text: '经验证过的方法', pole: 'S' },
      { key: 'b', text: '创新思路和直觉', pole: 'N' },
    ],
  },
  {
    id: 17, dimension: 'SN',
    text: '阅读时你更看重：',
    options: [
      { key: 'a', text: '能立即用到、能解决问题', pole: 'S' },
      { key: 'b', text: '打开视野、引发新思考', pole: 'N' },
    ],
  },
  {
    id: 18, dimension: 'SN',
    text: '对一个项目你更关心：',
    options: [
      { key: 'a', text: '当前阶段怎么落地', pole: 'S' },
      { key: 'b', text: '长期愿景和潜在影响', pole: 'N' },
    ],
  },
  {
    id: 19, dimension: 'SN',
    text: '读说明书 vs 探索玩法：',
    options: [
      { key: 'a', text: '我先读说明书', pole: 'S' },
      { key: 'b', text: '我更喜欢自己摸索', pole: 'N' },
    ],
  },
  {
    id: 20, dimension: 'SN',
    text: '对"新出的产品"：',
    options: [
      { key: 'a', text: '等用过的人说好了再买', pole: 'S' },
      { key: 'b', text: '第一时间想体验', pole: 'N' },
    ],
  },
  {
    id: 21, dimension: 'SN',
    text: '会议讨论方案时你倾向：',
    options: [
      { key: 'a', text: '看现有约束和风险', pole: 'S' },
      { key: 'b', text: '想象各种可能性', pole: 'N' },
    ],
  },
  {
    id: 22, dimension: 'SN',
    text: '你更喜欢的工作：',
    options: [
      { key: 'a', text: '明确流程、按部就班', pole: 'S' },
      { key: 'b', text: '有探索空间、可发挥创意', pole: 'N' },
    ],
  },
  {
    id: 23, dimension: 'SN',
    text: '记忆事物的方式：',
    options: [
      { key: 'a', text: '具体细节、当时画面', pole: 'S' },
      { key: 'b', text: '整体感觉、当时的氛围', pole: 'N' },
    ],
  },
  {
    id: 24, dimension: 'SN',
    text: '你更看重一段文字的：',
    options: [
      { key: 'a', text: '字面意思和事实', pole: 'S' },
      { key: 'b', text: '言外之意和隐喻', pole: 'N' },
    ],
  },
  {
    id: 25, dimension: 'SN',
    text: '面对"如果 X 怎么办"：',
    options: [
      { key: 'a', text: '回到 X 的当前事实', pole: 'S' },
      { key: 'b', text: '顺着推演各种未来', pole: 'N' },
    ],
  },
  // ==================== TF (12 questions) ====================
  {
    id: 26, dimension: 'TF',
    text: '做决定时你更依赖：',
    options: [
      { key: 'a', text: '逻辑分析、利弊权衡', pole: 'T' },
      { key: 'b', text: '价值观、对人的影响', pole: 'F' },
    ],
  },
  {
    id: 27, dimension: 'TF',
    text: '和朋友意见冲突时：',
    options: [
      { key: 'a', text: '摆事实讲道理', pole: 'T' },
      { key: 'b', text: '先照顾对方感受再讨论', pole: 'F' },
    ],
  },
  {
    id: 28, dimension: 'TF',
    text: '批评别人时你倾向：',
    options: [
      { key: 'a', text: '直接指出问题点', pole: 'T' },
      { key: 'b', text: '先肯定再委婉建议', pole: 'F' },
    ],
  },
  {
    id: 29, dimension: 'TF',
    text: '你更欣赏哪种同事：',
    options: [
      { key: 'a', text: '客观理性、能拍板', pole: 'T' },
      { key: 'b', text: '善解人意、团队粘合剂', pole: 'F' },
    ],
  },
  {
    id: 30, dimension: 'TF',
    text: '遇到不公时你第一反应：',
    options: [
      { key: 'a', text: '分析原因、寻求制度改进', pole: 'T' },
      { key: 'b', text: '心疼当事人、提供情感支持', pole: 'F' },
    ],
  },
  {
    id: 31, dimension: 'TF',
    text: '同事犯错时：',
    options: [
      { key: 'a', text: '指出问题、协助改正', pole: 'T' },
      { key: 'b', text: '先安慰、再私下提醒', pole: 'F' },
    ],
  },
  {
    id: 32, dimension: 'TF',
    text: '评价一个决定更看重：',
    options: [
      { key: 'a', text: '是否理性、收益清晰', pole: 'T' },
      { key: 'b', text: '是否让相关人感到公平', pole: 'F' },
    ],
  },
  {
    id: 33, dimension: 'TF',
    text: '你更不喜欢的评价是：',
    options: [
      { key: 'a', text: '"你这人太感情用事"', pole: 'T' },
      { key: 'b', text: '"你这人太冷漠"', pole: 'F' },
    ],
  },
  {
    id: 34, dimension: 'TF',
    text: '团队出现冲突时：',
    options: [
      { key: 'a', text: '摆出利弊、强调客观标准', pole: 'T' },
      { key: 'b', text: '倾听各方感受、寻求共识', pole: 'F' },
    ],
  },
  {
    id: 35, dimension: 'TF',
    text: '评价一件艺术品时：',
    options: [
      { key: 'a', text: '关注结构、技巧、表达力', pole: 'T' },
      { key: 'b', text: '关注情感共鸣、触动点', pole: 'F' },
    ],
  },
  {
    id: 36, dimension: 'TF',
    text: '听到朋友分手：',
    options: [
      { key: 'a', text: '分析原因、给出建议', pole: 'T' },
      { key: 'b', text: '陪伴倾听、表达支持', pole: 'F' },
    ],
  },
  {
    id: 37, dimension: 'TF',
    text: '哪种让你更满足：',
    options: [
      { key: 'a', text: '把复杂问题解清楚', pole: 'T' },
      { key: 'b', text: '帮到一个人走出低谷', pole: 'F' },
    ],
  },
  // ==================== JP (12 questions) ====================
  {
    id: 38, dimension: 'JP',
    text: '你对旅行的态度：',
    options: [
      { key: 'a', text: '提前规划好每一天行程', pole: 'J' },
      { key: 'b', text: '看心情、走到哪算哪', pole: 'P' },
    ],
  },
  {
    id: 39, dimension: 'JP',
    text: '面对截止日期：',
    options: [
      { key: 'a', text: '提前完成、不喜欢压线', pole: 'J' },
      { key: 'b', text: 'deadline 驱动、临阵爆发', pole: 'P' },
    ],
  },
  {
    id: 40, dimension: 'JP',
    text: '你的桌面/工作区：',
    options: [
      { key: 'a', text: '分类整齐、井井有条', pole: 'J' },
      { key: 'b', text: '随性摆放、但自己找得到', pole: 'P' },
    ],
  },
  {
    id: 41, dimension: 'JP',
    text: '开始一个新项目时：',
    options: [
      { key: 'a', text: '先列计划、拆任务', pole: 'J' },
      { key: 'b', text: '先开干、边做边调整', pole: 'P' },
    ],
  },
  {
    id: 42, dimension: 'JP',
    text: '你更享受：',
    options: [
      { key: 'a', text: '事情有定论、可以收尾', pole: 'J' },
      { key: 'b', text: '保持开放、有多种可能性', pole: 'P' },
    ],
  },
  {
    id: 43, dimension: 'JP',
    text: '面对突发变化：',
    options: [
      { key: 'a', text: '不喜欢、尽量按原计划', pole: 'J' },
      { key: 'b', text: '适应性强、跟着变化走', pole: 'P' },
    ],
  },
  {
    id: 44, dimension: 'JP',
    text: '开会迟到：',
    options: [
      { key: 'a', text: '我会非常不安', pole: 'J' },
      { key: 'b', text: '偶尔会、问题不大', pole: 'P' },
    ],
  },
  {
    id: 45, dimension: 'JP',
    text: '做选择题：',
    options: [
      { key: 'a', text: '想清楚再选', pole: 'J' },
      { key: 'b', text: '凭感觉、可调整', pole: 'P' },
    ],
  },
  {
    id: 46, dimension: 'JP',
    text: '对你来说，最难受的是：',
    options: [
      { key: 'a', text: '事情悬而未决', pole: 'J' },
      { key: 'b', text: '失去选择自由', pole: 'P' },
    ],
  },
  {
    id: 47, dimension: 'JP',
    text: '整理房间：',
    options: [
      { key: 'a', text: '有固定流程、一气呵成', pole: 'J' },
      { key: 'b', text: '看心情、想到再弄', pole: 'P' },
    ],
  },
  {
    id: 48, dimension: 'JP',
    text: '面对模糊任务：',
    options: [
      { key: 'a', text: '先要清楚定义、再动手', pole: 'J' },
      { key: 'b', text: '边做边澄清', pole: 'P' },
    ],
  },
  {
    id: 49, dimension: 'JP',
    text: '你更欣赏的人：',
    options: [
      { key: 'a', text: '按部就班、有始有终', pole: 'J' },
      { key: 'b', text: '灵活应变、拥抱变化', pole: 'P' },
    ],
  },
]

export interface MbtiScores {
  E: number; I: number; S: number; N: number; T: number; F: number; J: number; P: number
}

export function scoreMbti(answers: Record<number, string>): { scores: MbtiScores; type: string } {
  const scores: MbtiScores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }
  for (const q of MBTI_QUESTIONS) {
    const chosen = answers[q.id]
    const opt = q.options.find((o) => o.key === chosen)
    if (opt) scores[opt.pole] += 1
  }
  const type =
    (scores.E >= scores.I ? 'E' : 'I') +
    (scores.S >= scores.N ? 'S' : 'N') +
    (scores.T >= scores.F ? 'T' : 'F') +
    (scores.J >= scores.P ? 'J' : 'P')
  return { scores, type }
}

export const MBTI_DESCRIPTIONS: Record<string, { name: string; summary: string }> = {
  INTJ: { name: '建筑师', summary: '战略型思考者，独立、有长远眼光，擅长将复杂想法转化为可执行计划。' },
  INTP: { name: '逻辑学家', summary: '安静的思考者，对知识有强烈好奇，喜欢理论分析和抽象模型。' },
  ENTJ: { name: '指挥官', summary: '果断、有领导力，擅长制定战略并推动团队执行。' },
  ENTP: { name: '辩论家', summary: '思维敏捷、创意无限，喜欢挑战常规、提出新想法。' },
  INFJ: { name: '提倡者', summary: '理想主义、有洞察力，关心他人成长，追求意义与价值。' },
  INFP: { name: '调停者', summary: '温柔、富有同理心，内心有强烈价值观，适合需要创造和共情的工作。' },
  ENFJ: { name: '主人公', summary: '富有感染力的领导者，善于凝聚团队、激发他人潜力。' },
  ENFP: { name: '竞选者', summary: '热情洋溢、富有创意，擅长把想法变成有感染力的故事。' },
  ISTJ: { name: '物流师', summary: '可靠、有条理，注重事实和责任，是团队中最稳的执行者。' },
  ISFJ: { name: '守卫者', summary: '温暖、细心、乐于助人，擅长在后台默默支撑团队。' },
  ESTJ: { name: '总经理', summary: '务实、果断，擅长把规则和流程落实到执行。' },
  ESFJ: { name: '执政官', summary: '体贴、合作意识强，擅长营造和谐高效的团队氛围。' },
  ISTP: { name: '鉴赏家', summary: '冷静、动手能力强，擅长在压力下找到高效解法。' },
  ISFP: { name: '探险家', summary: '敏感、审美独到，喜欢用自己的节奏探索世界。' },
  ESTP: { name: '企业家', summary: '机敏、行动派，擅长在动态环境中抓住机会。' },
  ESFP: { name: '表演者', summary: '热情、感染力强，擅长把气氛带动起来、活跃团队。' },
}