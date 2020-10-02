require('dotenv').config()
const Telegraf = require('telegraf')
const BOT_TOKEN = process.env.BOT_TOKEN
const bot = new Telegraf(BOT_TOKEN)
const session = require('telegraf/session')
const keys = require('./keys.json')
const fs = require('fs')
//Session
bot.use(session())
//Global Variable
//Commands
bot.command("login", (ctx) => {
    LogIn(ctx)
})
bot.command("logout", (ctx) => {
    ctx.telegram.sendMessage(ctx.chat.id, "Logged Out!", {
        reply_markup: {
            remove_keyboard: true
        }
    })
    ctx.session.logged = 0
    ctx.session.GetFile = 0
})
bot.command('getfile', (ctx) => {
    if (ctx.session.logged == 1) {
        CreateListArray(ctx)
        ctx.session.GetFile = 1
    } else {
        ctx.telegram.sendMessage(ctx.chat.id, "Log in first!", {
            reply_markup: {
                remove_keyboard: true
            }
        })
    }
})
bot.command('removefile', (ctx) => {
    if (ctx.session.logged == 1) {
        CreateListArray(ctx)
        ctx.session.RemoveFile = 1
    } else {
        ctx.telegram.sendMessage(ctx.chat.id, "Log in first!", {
            reply_markup: {
                remove_keyboard: true
            }
        })
    }
})
bot.command('test', ctx => {

})
//Event Handler
bot.on('text', (ctx, next) => {
    if (ctx.session.SetPass == 1) {
        keys.users[ctx.chat.id] = { name: ctx.message.from.first_name, username: ctx.message.from.username, password: ctx.message.text, files: [] }
        keys.ids.push(ctx.chat.id)
        SyncKeys()
        ctx.session.SetPass = 0
        ctx.telegram.sendMessage(ctx.chat.id, "Account Created!", {
            reply_markup: {
                remove_keyboard: true
            }
        })
        ctx.session.logged = 1
    }
    if (ctx.session.GetPass == 1) {
        if (ctx.message.text == keys.users[ctx.chat.id].password) {
            ctx.telegram.sendMessage(ctx.chat.id, "Successfully Logged!", {
                reply_markup: {
                    remove_keyboard: true
                }
            })
            ctx.session.logged = 1
        } else {
            ctx.telegram.sendMessage(ctx.chat.id, "Wrong Password!\nUse /login command again.", {
                reply_markup: {
                    remove_keyboard: true
                }
            })
        }
        ctx.session.GetPass = 0
    }
    if (ctx.session.NameMode == 1) {
        keys.users[ctx.chat.id].files.push({ name: ctx.message.text, id: ctx.session.FileId })
        SyncKeys()
        ctx.telegram.sendMessage(ctx.chat.id, "File Added To List!", {
            reply_markup: {
                remove_keyboard: true
            }
        })
        ctx.session.NameMode = 0
    }
    if (ctx.session.GetFile == 1) {
        if (ctx.message.text == "Next Items ➡️") {
            ctx.session.arrayP = (ctx.session.arrayP + 1) % ctx.session.array.length
            ctx.telegram.sendMessage(ctx.chat.id, "Your List:", {
                reply_markup: {
                    keyboard: ctx.session.array[ctx.session.arrayP],
                    one_time_keyboard: true,
                    resize_keyboard: true
                }
            })
        }
        if (ctx.message.text == "Jump To Top ⬆️") {
            ctx.session.arrayP = 0
            ctx.telegram.sendMessage(ctx.chat.id, "Your List:", {
                reply_markup: {
                    keyboard: ctx.session.array[ctx.session.arrayP],
                    one_time_keyboard: true,
                    resize_keyboard: true
                }
            })
        }
        for (i = 0; i < keys.users[ctx.chat.id].files.length; i++) {
            if (ctx.message.text == keys.users[ctx.chat.id].files[i].name) {
                ctx.session.GetFile = 0
                try {
                    ctx.telegram.sendDocument(ctx.chat.id, keys.users[ctx.chat.id].files[i].id, {
                        reply_markup: {
                            remove_keyboard: true,
                            resize_keyboard: true
                        }
                    })
                } catch (err) {
                    console.log("Miss Type")
                }
                try {
                    ctx.telegram.sendVideo(ctx.chat.id, keys.users[ctx.chat.id].files[i].id, {
                        reply_markup: {
                            remove_keyboard: true,
                            resize_keyboard: true
                        }
                    })
                } catch (err) {
                    console.log("Miss Type")
                }
                try {
                    ctx.telegram.sendPhoto(ctx.chat.id, keys.users[ctx.chat.id].files[i].id, {
                        reply_markup: {
                            remove_keyboard: true,
                            resize_keyboard: true
                        }
                    })
                } catch (err) {
                    console.log("Miss Type")
                }
            }
        }
    }
    if (ctx.session.RemoveFile == 1) {
        if (ctx.message.text == "Next Items ➡️") {
            ctx.session.arrayP = (ctx.session.arrayP + 1) % ctx.session.array.length
            ctx.telegram.sendMessage(ctx.chat.id, "Your List:", {
                reply_markup: {
                    keyboard: ctx.session.array[ctx.session.arrayP],
                    one_time_keyboard: true,
                    resize_keyboard: true
                }
            })
        }
        if (ctx.message.text == "Jump To Top ⬆️") {
            ctx.session.arrayP = 0
            ctx.telegram.sendMessage(ctx.chat.id, "Your List:", {
                reply_markup: {
                    keyboard: ctx.session.array[ctx.session.arrayP],
                    one_time_keyboard: true,
                    resize_keyboard: true
                }
            })
        }
        for (i = 0; i < keys.users[ctx.chat.id].files.length; i++) {
            if (ctx.message.text == keys.users[ctx.chat.id].files[i].name) {
                ctx.session.RemoveFile = 0
                keys.users[ctx.chat.id].files.splice(i, 1)
                SyncKeys()
                ctx.telegram.sendMessage(ctx.chat.id, "Item Removed!!", {
                    reply_markup: {
                        remove_keyboard: true
                    }
                })
            }
        }
    }
    next()
})
bot.on(["document", "video"], (ctx) => {
    ctx.session.GetFile = 0
    if (ctx.session.logged == 1) {
        ctx.session.FileId = ctx.message[ctx.updateSubTypes[0]].file_id
        ctx.session.NameMode = 1
        ctx.telegram.sendMessage(ctx.chat.id, "Please provide a name for your file", {
            reply_markup: {
                remove_keyboard: true
            }
        })
    } else {
        ctx.telegram.sendMessage(ctx.chat.id, "Log in first!", {
            reply_markup: {
                remove_keyboard: true
            }
        })
    }

})
bot.on("photo", (ctx) => {
    ctx.session.GetFile = 0
    if (ctx.session.logged == 1) {
        ctx.session.FileId = ctx.message.photo.pop().file_id
        ctx.session.NameMode = 1
        ctx.telegram.sendMessage(ctx.chat.id, "Please provide a name for your file", {
            reply_markup: {
                remove_keyboard: true
            }
        })
    } else {
        ctx.telegram.sendMessage(ctx.chat.id, "Log in first!", {
            reply_markup: {
                remove_keyboard: true
            }
        })
    }
})
//Functions
function LogIn(ctx) {
    if (keys.users[ctx.chat.id]) {
        ctx.telegram.sendMessage(ctx.chat.id, "Please enter your password:", {
            reply_markup: {
                remove_keyboard: true
            }
        })
        ctx.session.GetPass = 1
    } else {
        ctx.telegram.sendMessage(ctx.chat.id, "You are not registred yet.\nNow send a password for your account:", {
            reply_markup: {
                remove_keyboard: true
            }
        })
        ctx.session.SetPass = 1
    }
}
function SyncKeys() {
    fs.writeFile('./keys.json', JSON.stringify(keys), function (err) {
        if (err) throw err;
        console.log('Updated!');
    });
}
function CreateListArray(ctx) {
    let ListCount = 5
    let mode = keys.users[ctx.chat.id].files.length % ListCount
    let floor = Math.floor(keys.users[ctx.chat.id].files.length / ListCount)
    ctx.session.arrayP = 0
    ctx.session.array = []
    for (i = 0; i < floor; i++) {
        ctx.session.array.push([])
        for (j = (i * ListCount); j < (i + 1) * ListCount; j++) {
            ctx.session.array[i].push([{ text: keys.users[ctx.chat.id].files[j].name }])
        }
        ctx.session.array[i].push([{ text: "Next Items ➡️" }])
    }
    if (mode == 0) {
        ctx.session.array[floor - 1].pop()
        ctx.session.array[floor - 1].push([{ text: "Jump To Top ⬆️" }])
    }
    if (mode > 0) {
        ctx.session.array.push([])
        for (k = floor * ListCount; k < keys.users[ctx.chat.id].files.length; k++) {
            ctx.session.array[floor].push([{ text: keys.users[ctx.chat.id].files[k].name }])
        }
        ctx.session.array[floor].push([{ text: "Jump To Top ⬆️" }])
    }
    ctx.telegram.sendMessage(ctx.chat.id, "Your List:", {
        reply_markup: {
            keyboard: ctx.session.array[ctx.session.arrayP],
            one_time_keyboard: true,
            resize_keyboard: true
        }
    })
}
//Launch
bot.launch()