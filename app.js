const discord = require('discord.js') //import the discord.js library
const client = new discord.Client() //create a discord Client object for the bot

const { GoogleSpreadsheet } = require('google-spreadsheet'); //import library for the Google Sheets V4 API

require('dotenv').config() //import library to use environment variable to store sensitive information like the bot token

const prefix = '?' //the bot's default command prefix

let form_url = "" //the Google Forms url to be sent to the user
let form_user_id = "" //the user's discord ID
let form_user_promotion = "" //the user's IWD promotion
let form_user_name = "" //the user's discord username
let sheet_url = ""
let is_wwe = ""

let inForm
let formTrig
let formChannel

client.on('ready',()=>{
    console.log(`${client.user.tag} : Login Successful!`) //Print to console if successfully logged in
})

client.on('message',(msg)=>{
    if(msg.author.bot) return //if the author of a message is a bot, ignore it
    if(inForm && (msg.author.id == formTrig.id))
        setForm(msg)
    else if(msg.content.substring(0,prefix.length) == prefix)//if the message starts with the prefix, it is a command that needs to be processed and executed by the bot
        processCommand(msg) //function to process and execute the user's command
})

/**
 * 
 * @param {discord.Message} message The message identified as a command
 */
function processCommand(message){
    let content = message.content.split(' ') //string array containing the contents of the message
    let command = content[0]//the first word is the command (Eg. ?help or ?predictions)
    command = command.slice(prefix.length)//strip the first word of the prefix

    switch (command) {
        case 'ping': //if the message was the ping command (?ping), execute ping()
            ping(message)
            break;
        
        case 'predictions': //if the message was the predictions command (?predictions), execute predictions()
            predictions(message)
            break;

        case 'picks': //if the message was the predictions command (?predictions), execute predictions()
            picks(message);
            break;

        case 'setform':
            setForm(message);
            break;
        
        case 'live':
            live(message);
            break;
    }
}

/**
 * 
 * @param {discord.Message} message The message identified as a command
 */
function ping(message){ //function to find the bot's ping (latency time)
    let time = Date.now() //get the current time (Unix timestamp)
    message.reply(`Pong! \`${time-message.createdAt.getTime()}ms\``) //Send the difference between the current time and the time at which the message was sent
}

// /**
//  * 
//  * @param {discord.Message} message The message identified as a command
//  */
// function setForm(message){ //function to set the details required to construct a google forms URL
//     let content = message.content.substring(' ')
//     if(content.length < 5) //the setForm command needs to have 4 arguments
//         return
//     form_url = content[1] //the id of the Google Form
//     form_user_id = content[2] //id of the discord user ID field for pre-filling
//     form_user_promotion = content[3] //id of the IWD user promotion field for pre-filling
//     form_user_name = content[4] //id of the discord user name field for pre-filling
// }

/**
 * 
 * @param {discord.Message} message 
 */
function setForm(message){
    console.log(message.content.toUpperCase())
    if(!inForm){
        formChannel = message.channel
        formTrig = message.author
        inForm = true

        let embed = new discord.MessageEmbed()
        .setColor("#FFD700")
        .setTitle("**WWE PPV?**")
        .setDescription("Is the form for a WWE PPV? (y/n)")
        formChannel.send(embed)
    }
    else if(is_wwe == "" && (message.content.toUpperCase() == "Y" || message.content.toUpperCase() == "N" )){
        is_wwe = (message.content.toUpperCase() == "Y")
        let embed = new discord.MessageEmbed()
        .setColor("#FFD700")
        .setTitle("**Form URL**")
        .setDescription(`Enter the Google Form's URL - Just the random letters part
        (If the URL is \`https://www.docs.google.com/forms/d/e/ABC123/\` , just enter \`ABC123\``)
        formChannel.send(embed)
    }
    else if(form_url == ""){
        form_url = message.content
        let embed = new discord.MessageEmbed()
        .setColor("#FFD700")
        .setTitle("**Discord User ID prefill number**")
        .setDescription(`Enter the Google Form prefill number for the Discord User ID question
        (The random string of numbers after the **first** occurance of the word \`entry\` in the form's URL)`)
        formChannel.send(embed)
    }
    else if(form_user_id == ""){
        form_user_id = message.content
        let embed = new discord.MessageEmbed()
        .setColor("#FFD700")
        .setTitle("**Discord Promotion prefill number**")
        .setDescription(`Enter the Google Form prefill number for the "Discord User Promotion" question
        (The random string of numbers after the **second** occurance of the word \`entry\` in the form's URL)`)
        formChannel.send(embed)
    }
    else if(form_user_promotion == ""){
        form_user_promotion = message.content
        let embed = new discord.MessageEmbed()
        .setColor("#FFD700")
        .setTitle("**Discord Username prefill number**")
        .setDescription(`Enter the Google Form prefill number for the Discord Username question
        (The random string of numbers after the third occurance of the word \`entry\` in the form's URL)`)
        formChannel.send(embed)
    }
    else if(form_user_name == ""){
        form_user_name = message.content
        let embed = new discord.MessageEmbed()
        .setColor("#FFD700")
        .setTitle("**Google Sheet URL**")
        .setDescription(`Enter the URL of the Google Sheet used to store the picks - Just the random letters part
        (If the URL is \`https://www.docs.google.com/spreadsheets/d/ABC123/\` , just enter \`ABC123\``)
        formChannel.send(embed)
    }
    else if(sheet_url == ""){
        sheet_url = message.content
        let embed = new discord.MessageEmbed()
        .setColor("#FFD700")
        .setTitle("Form Set!")
        .setDescription(`Google Form URL : ${form_url}
        User ID Prefill : ${form_user_id}
        IWD Promotion Prefill : ${form_user_promotion}
        Username Prefill : ${form_user_name}
        Google Sheet URL : ${sheet_url}
        Event Type : ${!is_wwe?"Non":""} WWE Event`)
        formChannel.send(embed)

        formChannel = ""
        formTrig = ""
        inForm = false
    }
}

function formClosed(){ //function to reset all google form ids to an empty string
    form_url = ""
    form_user_id = ""
    form_user_promotion = ""
    form_user_name = ""
    sheet_url = ""
    is_wwe = ""
}

/**
 * 
 * @param {discord.Message} message The message identified as a command
 */
function predictions(message){ //function to construct and send a google form url to the author of the ?predictions command
    if(form_url == ""){
        message.reply("Predictions is closed! Sorry!")
        return
    }
    
    let user_id = message.author.id //message author's discord id
    let user_name = message.author.username //message author's discord username
    let user_promotion = ""
    let roleArr = [] //array to store all discord roles held by the message author
    message.member.roles.cache.array().forEach((val)=>{
        roleArr.push(val.name)
    })
    //if the author belongs to one of IWD's promotions, have it set to user_promotion. Else, the promotion is considered "Independant"
    if(roleArr.includes("High Flyers"))
        user_promotion = "High_Flyers"
    else if(roleArr.includes("SubmissionSpecialists"))
        user_promotion = "Submission_Specialists"
    else if(roleArr.includes("Technical Wizards"))
        user_promotion = "Technical_Wizards"
    else
        user_promotion = "Independant"
    let url = `https://docs.google.com/forms/d/e/${form_url}/viewform?usp=pp_url&entry.${form_user_id}=${user_id}&entry.${form_user_promotion}=${user_promotion}&entry.${form_user_name}=${user_name}` //construct a Google Form URL using a template literal
    
    let embed = new discord.MessageEmbed()
    .setColor("#FFD700")
    .setTitle("IWD Predictions Form")
    .setDescription(`Here's the link for the form!\n<${url}>`)

    message.author.send(embed) //send the URL to the message author as a DM
}

/**
 * 
 * @param {discord.Message} message 
 */
async function picks(message){
    
    if(sheet_url == ""){
        message.reply("Viewing your picks is not available right now. Sorry!")
        return
    }
    
    const doc = new GoogleSpreadsheet('1BOR5sPBoOeoCfoU4HL7W9lXQaC56Pcyv9P7zuPk5SQ0')
    await doc.useServiceAccountAuth(require('./auth.json'))
    await doc.loadInfo()
    const sheet = doc.sheetsByIndex[0]
    const rows = await sheet.getRows()

    const isShow = message.content.split(' ')[1] == 'show'

    let author_row = -1
    
    for(let i=rows.length-1; i>=0; i--)
        if(rows[i]._rawData[1] == message.author.id){
            author_row = i
            break;
        }
  
    let embed = new discord.MessageEmbed().setColor("#FFD700")
    if(author_row == -1){
        embed.setDescription(`${message.author.tag}'s picks : 
        \`Picks Not Found! Get your predictions form by using the ?predictions command in #botspam and fill it in!\``)
        message.reply(embed)
    }
    if(isShow){
        if(author_row == -1){
        embed.setDescription(`${message.author.tag}'s picks : 
        \`Picks Not Found! Get your predictions form by using the ?predictions command in #botspam and fill it in!\``)
        }
        else{
        embed.setDescription(`${message.author.tag}'s picks : 
        \`[${(rows[author_row]._rawData.slice(5,rows[author_row]._rawData.length)).toString().replace(/,/g,', ')}]\``)
        }
        message.reply(embed)
    }
    else{
        if(author_row == -1){
        embed.setDescription(`Your picks : 
        \`Picks Not Found! Get your predictions form by using the ?predictions command in #botspam and fill it in!\``)
        }
        else{
        embed.setDescription(`${message.author.tag}'s picks : 
        \`[${(rows[author_row]._rawData.slice(4,rows[author_row]._rawData.length)).toString().replace(/,/g,', ')}]\``)
        }
        message.author.send(embed)
    }
        
    //console.log(rows[author_row]._rawData.slice(5,rows[author_row]._rawData.length))
}

/**
 * 
 * @param {discord.Message} message 
 */
async function live(message){
    let roleArr = message.member.roles.cache.array()
    let isEligible = false
    for(let i = 0; i < roleArr.length; i++)
        if((roleArr[i].name.includes("VIP") || roleArr[i].name.includes("Level 15")))
            isEligible = true

    if(!isEligible)
        return
    
    // if(sheet_url == ""){
    //     message.reply("Live score viewing is not available at the moment. Sorry!")
    //     return
    // }
    let start = Date.now()
    const doc = new GoogleSpreadsheet('1BOR5sPBoOeoCfoU4HL7W9lXQaC56Pcyv9P7zuPk5SQ0')
    await doc.useServiceAccountAuth(require('./auth.json'))
    await doc.loadInfo()
    const sheet = doc.sheetsByIndex[1]
    const rows = await sheet.getRows()
    let end = Date.now()

    console.log(end-start)

    let author_row = -1
    
    for(let i=rows.length-1; i>=0; i--)
        if(rows[i]._rawData[2] == message.author.id){
            author_row = i
            break;
        }
    
    if(author_row == -1){
        message.reply("Score not found!")
        return
    }


    let embed = new discord.MessageEmbed()
    .setColor("#FFD700")
    .setTitle("Live Score")
    .setDescription(`${message.author.tag}'s Live Score : ${rows[author_row]._rawData[0]}`)

    message.channel.send(embed)
}

client.login(`${process.env.BOT_TOKEN}`) // log in the bot