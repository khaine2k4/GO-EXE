function pad2(n) {
  return String(n).padStart(2, '0')
}

function toIsoDate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function daysInMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

const cursor = new Date(2026, 4, 1); // May 2026
const monthStart = startOfMonth(cursor)
const totalDays = daysInMonth(cursor)
const startWeekday = (monthStart.getDay() + 6) % 7 // Monday=0

const grid = []
for (let i = 0; i < startWeekday; i++) {
  grid.push({ iso: `blank-${i}`, day: 0, disabled: true })
}
for (let day = 1; day <= totalDays; day++) {
  const d = new Date(cursor.getFullYear(), cursor.getMonth(), day)
  const iso = toIsoDate(d)
  grid.push({ iso, day, disabled: false })
}

console.log("Total grid items:", grid.length);
console.log("Grid layout (7 items per row):");
for (let i = 0; i < grid.length; i += 7) {
  const row = grid.slice(i, i + 7).map(cell => cell.day === 0 ? " " : cell.day.toString().padStart(2, " "));
  console.log(row.join(" | "));
}
