/*{
  weekday: 'narrow' | 'short' | 'long',
  era: 'narrow' | 'short' | 'long',
  year: 'numeric' | '2-digit',
  month: 'numeric' | '2-digit' | 'narrow' | 'short' | 'long',
  day: 'numeric' | '2-digit',
  hour: 'numeric' | '2-digit',
  minute: 'numeric' | '2-digit',
  second: 'numeric' | '2-digit',
  timeZoneName: 'short' | 'long',

  // Time zone to express it in
  timeZone: 'Asia/Shanghai',
  // Force 12-hour or 24-hour
  hour12: true | false,

  // Rarely-used options
  hourCycle: 'h11' | 'h12' | 'h23' | 'h24',
  formatMatcher: 'basic' | 'best fit'
}*/

function checkDate(date) {
  if (date instanceof Date) return date;
  return new Date(date);
}

const localeDayAndMonthFormat = new Intl.DateTimeFormat('default', {
  month: 'long', day: '2-digit'
});
export function localeDayAndMonth(date) {
  date = checkDate(date);
  return localeDayAndMonthFormat.format(date);
}

const localeTimeFormat = new Intl.DateTimeFormat('default', {
  hour: '2-digit', minute: '2-digit'
});
export function localeTime(date) {
  date = checkDate(date);
  return localeTimeFormat.format(date);
}

const localeDayFormat = new Intl.DateTimeFormat('default', {
  weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric'
});
export function localeDay(date) {
  date = checkDate(date);
  return localeDayFormat.format(date);
}

const localeFullFormat = new Intl.DateTimeFormat('default', {
  weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
});
export function localeFull(date) {
  date = checkDate(date);
  return localeFullFormat.format(date);
}

export function utcDay(date) {
  date = checkDate(date);
  return new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()))
    .toISOString().split('T')[0];
}
