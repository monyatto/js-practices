const today = new Date()
let month = today.getMonth() + 1
let year = today.getFullYear()

for (let i = 0; i < process.argv.length; ++i) {
  if (process.argv[i] === '-y') {
    year = process.argv[i + 1]
  } else if (process.argv[i] === '-m') {
    month = process.argv[i + 1]
  }
}

console.log(`      ${month}月 ${year}`)
console.log('日 月 火 水 木 金 土 ')

const lastDay = new Date(year, month, 0).getDate()
const firstDay = new Date(year, month - 1, 1).getDay()

if (firstDay !== 7) {
  for (let i = 1; i <= firstDay; i++) {
    process.stdout.write('   ')
  }
}

for (let i = 1; i <= lastDay; i++) {
  let space = ''
  if (i < 10) {
    space = ' '
  }
  process.stdout.write(`${space}${i}`)
  const date = new Date(year, month - 1, i)
  if (date.getDay() === 6 && date.getDate() !== lastDay) {
    console.log()
  } else {
    process.stdout.write(' ')
  }
}
console.log('\n')
