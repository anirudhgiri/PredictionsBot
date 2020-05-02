const discord = require('discord.js') //import the discord.js library
const client = new discord.Client() //create a discord Client object for the bot

const { GoogleSpreadsheet } = require('google-spreadsheet'); //import library for the Google Sheets V4 API

require('dotenv').config() //import library to use environment variable to store sensitive information like the bot token

let score_url_doc = new GoogleSpreadsheet(`${process.env.SCORE_URL}`)
let score_url_sheets = []
let score_url_rows = []

let current_doc
let current_sheets = []
let current_rows = []

let prefix = '?' //the bot's default command prefix

let form_url = "" //the Google Forms url to be sent to the user
let form_user_id = "" //the user's discord ID
let form_user_promotion = "" //the user's IWD promotion
let form_user_name = "" //the user's discord username
let sheet_url = "" //the URL of the Google Sheet used to store the picks
let is_wwe = "" //if the PPV being held is a WWE PPV or Non-WWE PPV

let inForm //if ?setform is currently triggered
let formTrig //the user that triggered ?setform
let formChannel //the channel where ?setform was triggered

client.on('ready',async function(){
    await updateURLDoc() //update the spreadsheet used to store the URLs to score sheets
    console.log(`${client.user.tag} : Login Successful!`) //Print to console if successfully logged in
    client.user.setActivity(`${prefix}help`)//set the activity to the help command
})

client.on('message',(msg)=>{
    if(msg.author.bot) return //if the author of a message is a bot, ignore it
    if(inForm && (msg.author.id == formTrig.id)) //if this is a message for ?setform
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
        case 'help': //if the message was the help command (?help), execute help()
            help(message)
             break;

        case 'ping': //if the message was the ping command (?ping), execute ping()
            ping(message)
            break;
        
        case 'predictions': //if the message was the predictions command (?predictions), execute predictions()
            predictions(message)
            break;

        case 'picks': //if the message was the picks command (?picks [show]), execute picks()
            picks(message);
            break;

        case 'setform': //if the message was the setform command (?setform), execute setForm()
            if(message.member.roles.cache.has(process.env.ADMIN_ROLE_ID))
            setForm(message);
            break;
        
        case 'live': //if the message was the live command (?live), execute live()
            live(message);
            break;

        case 'score': //if the message was the score command (?score), execute score()
            score(message);
            break;

        case 'updatescore': //if the message was the updatescore command (?updatescore), execute updatescore()
            if(message.member.roles.cache.has(process.env.ADMIN_ROLE_ID))
            updateURLDoc();
            break;
        
        case 'closeform': //if the message was the closeform command (?closeform), execute closeform()
            if(message.member.roles.cache.has(process.env.ADMIN_ROLE_ID))
            formClosed();
            break;
    }
}

/**
 * Help command that displays general information and lists out available commands
 * @param {discord.Message} message The message identified as a command
 */
function help(message){
    let embed = new discord.MessageEmbed()
    .setColor("#FFD700")
    .setTitle("DanaBot V1.0.0")
    .setDescription(`Prefix : \`${prefix}\`
    Ping : \` \`ms
    ---*Commands*---
    \`${prefix}ping\` : Ping time in milliseconds
    \`${prefix}predictions\` : To recieve a link to the predictions form
    \`${prefix}picks\` : To recieve a DM of your prediction picks
    \`${prefix}picks show\` : To recieve your prediction picks as a regular message
    \`${prefix}score\` : To view your prediction score, rank and tiebreaker accuracy
    \`${prefix}live\` (VIP Only) : To view your prediction score live
    `)
    message.channel.send(embed).then((msg) => {
        embed.setDescription(`Prefix : \`${prefix}\`
        Ping : \`${msg.createdTimestamp - message.createdTimestamp}\`ms
        ---*Commands*---
        \`${prefix}ping\` : Ping time in milliseconds
        \`${prefix}predictions\` : To recieve a link to the predictions form
        \`${prefix}picks\` : To recieve a DM of your prediction picks
        \`${prefix}picks show\` : To recieve your prediction picks as a regular message
        \`${prefix}score\` : To view your prediction score, rank and tiebreaker accuracy
        \`${prefix}live\` (VIP Only) : To view your prediction score live
        `)
        msg.edit(embed)
    })
    
}


/**
 * function to find the bot's ping (latency time)
 * @param {discord.Message} message The message identified as a command
 */
function ping(message){
   message.channel.send(`Pong!`) //Send the difference between the current time and the time at which the message was sent
   .then((msg)=>{
       msg.edit(`Pong!\`${msg.createdTimestamp-message.createdTimestamp}ms\``)
   })
}

/**
 * Sets the score spreadsheet of the current PPV
 * @param {string} URL 
 */
async function setCurrentDoc(URL){
    current_doc = new GoogleSpreadsheet(URL)
    await current_doc.useServiceAccountAuth(require('./auth.json'))
    await current_doc.loadInfo()
    for(let i=0; i<3; i++){
        current_sheets.push(current_doc.sheetsByIndex[i])
        current_rows.push(await current_sheets[i].getRows())
    }
}

/**
 * Updades the spreadsheet used to store the URLS of the PPV scoresheets 
 */
async function updateURLDoc(){
    await score_url_doc.useServiceAccountAuth(require('./auth.json'))
    await score_url_doc.loadInfo()
    score_url_sheet = score_url_doc.sheetsByIndex[0]
    score_url_rows = await score_url_sheet.getRows()
    
    await setScoreDoc()
}

/**
 * Takes required information to make the ?predictions command functional
 * @param {discord.Message} message The message identified as a command
 */
async function setForm(message){
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
        console.log(sheet_url)
        let embed = new discord.MessageEmbed()
        .setColor("#FFD700")
        .setTitle("Form Set!")
        .setDescription(`Google Form URL : ${form_url}
        User ID Prefill : ${form_user_id}
        IWD Promotion Prefill : ${form_user_promotion}
        Username Prefill : ${form_user_name}
        Google Sheet URL : ${sheet_url}
        Event Type : ${!is_wwe?"Non":""} WWE Event`)
        message.channel.send("Please wait...")
        await setCurrentDoc(sheet_url)
        formChannel.send(embed)
        formChannel = ""
        formTrig = ""
        inForm = false
    }
}

/**
 * function to reset all google form ids to an empty string
 */
function formClosed(){
    form_url = ""
    form_user_id = ""
    form_user_promotion = ""
    form_user_name = ""
    sheet_url = ""
    is_wwe = ""
}

/**
 * Recieves a link to the PPV predictions Google Form
 * @param {discord.Message} message The message identified as a command
 */
function predictions(message){ //function to construct and send a google form url to the author of the ?predictions command
    if(form_url == ""){
        message.reply("Predictions are closed! Sorry!")
        return
    }
    
    let user_id = message.author.id //message author's discord id
    let user_name = message.author.username //message author's discord username
    let user_promotion = ""
    let roleArr = [] //array to store all discord roles held by the message author
    message.member.roles.cache.array().forEach((val)=>{
        roleArr.push(val.name)
    })
    //if the author belongs to one of IWD's promotions, have it set to user_promotion. Else, the promotion is considered "Independent"
    if(roleArr.includes("High Flyers"))
        user_promotion = "High_Flyers"
    else if(roleArr.includes("SubmissionSpecialists"))
        user_promotion = "Submission_Specialists"
    else if(roleArr.includes("Technical Wizards"))
        user_promotion = "Technical_Wizards"
    else
        user_promotion = "Independent"
    let url = `https://docs.google.com/forms/d/e/${form_url}/viewform?usp=pp_url&entry.${form_user_id}=${user_id}&entry.${form_user_promotion}=${user_promotion}&entry.${form_user_name}=${user_name}` //construct a Google Form URL using a template literal
    
    let embed = new discord.MessageEmbed()
    .setColor("#FFD700")
    .setTitle("IWD Predictions Form")
    .setDescription(`Here's the link for the form!\n<${url}>`)

    message.author.send(embed) //send the URL to the message author as a DM
}

/**
 * Shows the prediction picks of the user
 * @param {discord.Message} message The message identified as a command
 * @param {boolean} isRefreshed If the cache of the Google Sheet being used has been refreshed
 */
async function picks(message, isRefreshed=false){
    
    if(sheet_url == ""){
        message.reply("Viewing your picks is not available right now. Sorry!")
        return
    }

    const isShow = message.content.split(' ')[1] == 'show'

    let offset = is_wwe? 0 : 1

    let author_row = -1
    let rows = current_rows[0]

    for(let i=rows.length-1; i>=0; i--)
        if(rows[i]._rawData[1] == message.author.id){
            author_row = i
            break;
        }
    
    if(author_row == -1 && !isRefreshed){
        await setCurrentDoc(sheet_url)
        picks(message, true)
        return
    }
  
    let embed = new discord.MessageEmbed().setColor("#FFD700")
    if(author_row == -1){
        embed.setDescription(`${message.author.username}'s picks : 
        \`Picks Not Found! Get your predictions form by using the ?predictions command in #botspam and fill it in!\``)
        message.reply(embed)
        return
    }
    if(isShow){
        if(author_row == -1){
        embed.setDescription(`${message.author.username}'s picks : 
        \`Picks Not Found! Get your predictions form by using the ?predictions command in #botspam and fill it in!\``)
        }
        else{
        embed.setDescription(`${message.author.username}'s picks : 
        \`[${(rows[author_row]._rawData.slice(5 - offset,rows[author_row]._rawData.length)).toString().replace(/,/g,', ')}]\``)
        }
        message.reply(embed)
    }
    else{
        if(author_row == -1){
        embed.setDescription(`Your picks : 
        \`Picks Not Found! Get your predictions form by using the ?predictions command in #botspam and fill it in!\``)
        }
        else{
        embed.setDescription(`${message.author.username}'s picks : 
        \`[${(rows[author_row]._rawData.slice(4,rows[author_row]._rawData.length)).toString().replace(/,/g,', ')}]\``)
        }
        message.author.send(embed)
    }
        
}

/**
 * Shows the live score of the user (VIP Only)
 * @param {discord.Message} message The message identified as a command
 */
async function live(message){
    let roleArr = message.member.roles.cache.array()
    let isEligible = false
    for(let i = 0; i < roleArr.length; i++)
        if((roleArr[i].name.includes("VIP") || roleArr[i].name.includes("Level 15")))
            isEligible = true

    if(!isEligible)
        return
    
    if(sheet_url == ""){
        message.reply("Live score viewing is not available at the moment. Sorry!")
        return
    }
    

    const rows = await current_sheets[1].getRows()

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
    .setDescription(`${message.author.username}'s Live Score : ${rows[author_row]._rawData[0]}`)

    message.channel.send(embed)
}

let score_docs = []
let score_sheets = []
let score_rows = []

/**
 * Sets the Google Spreadsheet of the 5 PPV scoresheets
 */
async function setScoreDoc(){
    score_docs = []
    score_sheets = []
    score_rows = []
    for(let i=0; i<5; i++){
        score_docs.push(new GoogleSpreadsheet(score_url_rows[i]._rawData[1]))
        await score_docs[i].useServiceAccountAuth(require('./auth.json'))
        await score_docs[i].loadInfo()
        score_sheets.push(score_docs[i].sheetsByIndex[2])
        score_rows.push(await score_sheets[i].getRows())
    }
}

/**
 * Displays the score, rank and tiebreaker accuracy of the user
 * @param {discord.Message} message The message identified as a command
 */
async function score(message){
    let content = message.content.split(" ")
    if(content.length == 2){
        for (let i = 0; i < score_url_rows.length; i++) {
            if(score_url_rows[i]._rawData[0] == content[1]){
                let author_row = -1
                //console.log(message.author.id)
                for(let j = 0; j < score_rows[i].length; j++)
                    //console.log(score_rows[j]._rawData[0] +' '+ message.author.id)
                    if(score_rows[i][j]._rawData[0] == message.author.id){
                        author_row = j
                        break
                    }

                let embed = new discord.MessageEmbed()
                .setColor("#FFD700")
                .setTitle("Prediction Score")

                if(author_row == -1)
                    embed.setDescription(`${message.author.username}, Score not found!`)
        
                else
                    embed.setDescription(`${message.author.username}'s \`${score_url_rows[i]._rawData[0]}\` score is : ${score_rows[i][author_row]._rawData[2]}
                Your tiebreaker time was ${score_rows[i][author_row]._rawData[3]} seconds off
                You ranked #${author_row+1} out of ${score_rows[i].length}`)

                message.channel.send(embed)
                return
            }
        }
    }
    
    let embed = new discord.MessageEmbed()
        .setColor("#FFD700")
        .setTitle("Prediction Score")
        .setDescription(`Available Scores:
        \`${score_url_rows[0]._rawData[0]}\`  \`${score_url_rows[1]._rawData[0]}\`  \`${score_url_rows[2]._rawData[0]}\`  \`${score_url_rows[3]._rawData[0]}\`  \`${score_url_rows[4]._rawData[0]}\`  `)

    message.channel.send(embed)
}

client.login(`${process.env.BOT_TOKEN}`) // log in the bot