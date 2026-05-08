// 日期工具函数 - 支持周导航功能

export const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

/**
 * 获取当前周的 ISO 周编号 (如 2025-W19)
 * 周一作为一周开始
 */
export function getCurrentWeekKey() {
  return getWeekKey(new Date())
}

/**
 * 获取指定日期的 ISO 周编号
 * @param {Date} date
 * @returns {string} 如 "2025-W19"
 */
export function getWeekKey(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  // 校准到本周一
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))

  // 获取该年第一周的周四，确保 ISO 周规则
  const week1 = new Date(d.getFullYear(), 0, 4)
  const week1Day = (week1.getDay() + 6) % 7 // 周一=0
  const week1Start = new Date(week1)
  week1Start.setDate(week1.getDate() - week1Day)

  const weekNum = Math.ceil(((d.getTime() - week1Start.getTime()) / 86400000 + 1) / 7)

  return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`
}

/**
 * 从周 key 获取周一的日期
 * @param {string} weekKey - 如 "2025-W19"
 * @returns {Date}
 */
export function getMondayFromWeekKey(weekKey) {
  const [year, weekStr] = weekKey.split('-W')
  const week = parseInt(weekStr, 10)

  // 找到该年的第一周周一
  const week1 = new Date(parseInt(year, 10), 0, 4)
  const week1Day = (week1.getDay() + 6) % 7
  const week1Monday = new Date(week1)
  week1Monday.setDate(week1.getDate() - week1Day + 1)

  const monday = new Date(week1Monday)
  monday.setDate(week1Monday.getDate() + (week - 1) * 7)

  return monday
}

/**
 * 获取周的日期范围
 * @param {string} weekKey - 如 "2025-W19"
 * @returns {{ start: string, end: string, startDate: Date, endDate: Date }}
 *         start/end 为 "YYYY-MM-DD" 格式字符串
 */
export function getWeekRange(weekKey) {
  const monday = getMondayFromWeekKey(weekKey)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return {
    start: formatDate(monday),
    end: formatDate(sunday),
    startDate: monday,
    endDate: sunday
  }
}

/**
 * 获取某周的所有 7 天日期对象数组
 * @param {string} weekKey - 如 "2025-W19"
 * @returns {Array<{ date: string, day: string, dayIndex: number, displayDate: string }>}
 *         date: "YYYY-MM-DD"
 *         day: "周一" ~ "周日"
 *         dayIndex: 0 ~ 6
 *         displayDate: "5/5"
 */
export function getWeekDays(weekKey) {
  const monday = getMondayFromWeekKey(weekKey)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const month = d.getMonth() + 1
    const day = d.getDate()

    return {
      date: formatDate(d),
      day: WEEKDAYS[i],
      dayIndex: i,
      displayDate: `${month}/${day}`
    }
  })
}

/**
 * 获取上一周的 weekKey
 */
export function getPrevWeekKey(weekKey) {
  const monday = getMondayFromWeekKey(weekKey)
  monday.setDate(monday.getDate() - 7)
  return getWeekKey(monday)
}

/**
 * 获取下一周的 weekKey
 */
export function getNextWeekKey(weekKey) {
  const monday = getMondayFromWeekKey(weekKey)
  monday.setDate(monday.getDate() + 7)
  return getWeekKey(monday)
}

/**
 * 判断指定 weekKey 是否为当前周
 */
export function isCurrentWeek(weekKey) {
  return weekKey === getCurrentWeekKey()
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 获取今天的日期字符串 (YYYY-MM-DD)
 */
export function getTodayString() {
  return formatDate(new Date())
}

/**
 * 判断指定日期是否为今天
 */
export function isToday(dateString) {
  return dateString === getTodayString()
}

/**
 * 格式化周范围为可读字符串
 * @param {string} weekKey - 如 "2025-W19"
 * @returns {string} 如 "2025年5月5日 - 5月11日"
 */
export function formatWeekRange(weekKey) {
  const { startDate, endDate } = getWeekRange(weekKey)

  const startMonth = startDate.getMonth() + 1
  const startDay = startDate.getDate()
  const endMonth = endDate.getMonth() + 1
  const endDay = endDate.getDate()
  const year = startDate.getFullYear()

  if (startMonth === endMonth) {
    return `${year}年${startMonth}月${startDay}日 - ${endDay}日`
  }
  return `${year}年${startMonth}月${startDay}日 - ${endMonth}月${endDay}日`
}