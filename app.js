const discord = require('discord.js') //import the discord.js library
const client = new discord.Client() //create a discord Client object for the bot

const { GoogleSpreadsheet } = require('google-spreadsheet'); //import library for the Google Sheets V4 API

require('dotenv').config() //import library to use environment variable to store sensitive information like the bot token

const prefix = '?' //the bot's default command prefix

let form_url = "" //the Google Forms url to be sent to the user
let form_user_id = "" //the user's discord ID
let form_user_promotion = "" //the user's IWD promotion
let form_user_name = "" //the user's discord username

client.on('ready',()=>{
    console.log(`${client.user.tag} : Login Successful!`) //Print to console if successfully logged in
})

client.on('message',(msg)=>{
    if(msg.author.bot) return //if the author of a message is a bot, ignore it
    if(msg.content.substring(0,prefix.length) == prefix)//if the message starts with the prefix, it is a command that needs to be processed and executed by the bot
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

/**
 * 
 * @param {discord.Message} message The message identified as a command
 */
function setForm(message){ //function to set the details required to construct a google forms URL
    let content = message.content.substring(' ')
    if(content.length < 5) //the setForm command needs to have 4 arguments
        return
    form_url = content[1] //the id of the Google Form
    form_user_id = content[2] //id of the discord user ID field for pre-filling
    form_user_promotion = content[3] //id of the IWD user promotion field for pre-filling
    form_user_name = content[4] //id of the discord user name field for pre-filling
}

function formClosed(){ //function to reset all google form ids to an empty string
    form_url = ""
    form_user_id = ""
    form_user_promotion = ""
    form_user_name = ""
}

/**
 * 
 * @param {discord.Message} message The message identified as a command
 */
function predictions(message){ //function to construct and send a google form url to the author of the ?predictions command
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
    message.author.send(`Here's the link for your predictions!\n<${url}>`) //send the URL to the message author as a DM
}

client.login(`${process.env.BOT_TOKEN}`) // log in the bot