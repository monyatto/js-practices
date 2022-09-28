const sqlite3 = require('sqlite3')
const db = new sqlite3.Database('memos.db')
const enquirer = require('enquirer')
const commander = require('commander')
let reader = require('readline')

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

const CREATE_TABLE_SQL = 'CREATE TABLE IF NOT EXISTS memos (id integer primary key autoincrement, title text, content text)'

class Database {
  static getMemos () {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run(CREATE_TABLE_SQL)
        db.all('SELECT * FROM memos', function (err, rows) {
          if (err) {
            reject(err)
          }
          resolve(rows.map((row) => new Memo(row.id, row.title, row.content)))
        })
      })
    })
  }

  static getTitles () {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run(CREATE_TABLE_SQL)
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
      db.run(CREATE_TABLE_SQL)
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
      db.run(CREATE_TABLE_SQL)
      db.run('insert into memos(title,content) values(?,?)', lines[0], joinedLines)
    })
  }
}

class MemoCommand {
  static main () {
    if (options.read) {
      MemoCommand.#readOption()
    } else if (options.list) {
      MemoCommand.#listOption()
    } else if (options.delete) {
      MemoCommand.#deleteOption()
    } else {
      process.stdin.resume()
      process.stdin.setEncoding('utf8')

      const lines = []
      reader = reader.createInterface({
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

  static async #listOption () {
    const titles = await Database.getTitles()
    if (titles.length === 0) {
      MemoCommand.#noData()
    } else {
      titles.forEach(function (title) {
        console.log(title)
      })
    }
  }

  static async #readOption () {
    const memos = await Database.getMemos()
    if (memos.length === 0) {
      MemoCommand.#noData()
    } else {
      const question = {
        type: 'select',
        name: 'read',
        message: 'Choose a note you want to see:',
        choices: memos,
        result (titles) {
          return this.focused.content
        }
      }
      const answer = await enquirer.prompt(question)
      console.log(answer.read)
    }
  }

  static async #deleteOption () {
    const memos = await Database.getMemos()
    if (memos.length === 0) {
      MemoCommand.#noData()
    } else {
      const question = {
        type: 'select',
        name: 'delete',
        message: 'Choose a note you want to delete:',
        choices: memos,
        result (titles) {
          return this.focused.id
        }
      }
      const answer = await enquirer.prompt(question)
      Database.deleteMemo(answer.delete)
    }
  }

  static #noData () {
    console.log('There is no note. please add a note.')
  }
}

MemoCommand.main()
