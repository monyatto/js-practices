const sqlite3 = require('sqlite3')
const db = new sqlite3.Database('memos.db')
const { Select } = require('enquirer')
const commander = require('commander')

commander
  .option('-l, --list', 'list memos')
  .option('-r, --read', 'read select memo')
  .option('-d, --delete', 'delete select memo')

commander.parse(process.argv)
const options = commander.opts()

class Memo {
  constructor (id, title, content) {
    this.id = id
    this.title = title
    this.content = content
  }
}

class Database {
  static getMemos () {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('CREATE TABLE IF NOT EXISTS memos (id integer primary key autoincrement, title text, content text)')
        db.all('SELECT * FROM memos', function (err, rows) {
          if (err) {
            reject(err)
          }
          const memos = []
          rows.forEach(function (row) {
            const memo = new Memo(row.id, row.title, row.content)
            memos.push(memo)
          })
          resolve(memos)
        })
      })
    })
  }

  static getTitles () {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('CREATE TABLE IF NOT EXISTS memos (id integer primary key autoincrement, title text, content text)')
        db.all('SELECT title FROM memos', function (err, rows) {
          if (err) {
            reject(err)
          }
          const titles = []
          rows.forEach(function (row) {
            titles.push(row.title)
          })
          resolve(titles)
        })
      })
    })
  }

  static deleteMemo (id) {
    db.serialize(() => {
      db.run('CREATE TABLE IF NOT EXISTS memos (id integer primary key autoincrement, title text, content text)')
      db.run(`DELETE FROM memos WHERE id = ${id}`, err => {
        if (err) {
          return console.error(err.message)
        }
      })
    })
  }

  static createMemo (lines) {
    let joinedLines = []
    joinedLines = lines.join('\n')
    db.serialize(() => {
      db.run('CREATE TABLE IF NOT EXISTS memos (id integer primary key autoincrement, title text, content text)')
      db.run('insert into memos(title,content) values(?,?)', lines[0], joinedLines)
    })
  }
}

function main () {
  if (options.read) {
    readOption()
  } else if (options.list) {
    listOption()
  } else if (options.delete) {
    deleteOption()
  } else {
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    const lines = []
    const reader = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })

    reader.on('line', (line) => {
      lines.push(line)
    })

    reader.on('close', () => {
      Database.createMemo(lines)
    })
  }
}

async function listOption () {
  const titles = await Database.getTitles()
  if (titles.length === 0) {
    noData()
  } else {
    titles.forEach(function (title) {
      console.log(title)
    })
  }
}

async function readOption () {
  const memos = await Database.getMemos()
  if (memos.length === 0) {
    noData()
  } else {
    const prompt = new Select({
      name: 'read',
      message: 'Choose a note you want to see:',
      choices: memos,
      result (titles) {
        return this.focused.content
      }
    })
    prompt.run()
      .then(answer => console.log(answer))
      .catch(console.error)
  }
}

async function deleteOption () {
  const memos = await Database.getMemos()
  if (memos.length === 0) {
    noData()
  } else {
    const prompt = new Select({
      name: 'delete',
      message: 'Choose a note you want to delete:',
      choices: memos,
      result (titles) {
        return this.focused.id
      }
    })
    prompt.run()
      .then(answer => Database.deleteMemo(answer))
      .catch(console.error)
  }
}

function noData () {
  console.log('There is no note. plese add a note.')
}

main()
