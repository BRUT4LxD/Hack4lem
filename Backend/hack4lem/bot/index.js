const path = require("path");
const express = require("express");
const mustacheExpress = require('mustache-express');
const { BotFrameworkAdapter } = require("botbuilder");
const { MessageExtensionBot } = require("./messageExtensionBot.js");
const JSONdb = require('simple-json-db');

const adapter = new BotFrameworkAdapter({
  appId: "9d85185d-7010-4d6c-9869-f30fe8fcf081",
  appPassword: "R~DB02aw_Ec0JQe7PwS_~kAf72~IfYSddX",
});

adapter.onTurnError = async (context, error) => {
  console.error(`\n [onTurnError] unhandled error: ${error}`);

  await context.sendTraceActivity(
    "OnTurnError Trace",
    `${error}`,
    "https://www.botframework.com/schemas/error",
    "TurnError"
  );

  await context.sendActivity("The bot encountered an error or bug.");
  await context.sendActivity("To continue to run this bot, please fix the bot source code.");
};

const db = new JSONdb('database.json');
const messageExtensionBot = new MessageExtensionBot(db);


const server = express();
const port = process.env.port || process.env.PORT || 3978;
server.listen(port, () => console.log(`\Bot/ME service listening at https://localhost:${port}`));
server.set('views', path.join(__dirname, 'views'));
server.set('view engine', 'mustache');
server.engine('html', mustacheExpress());


server.post("/api/messages", (req, res) => {
  adapter.processActivity(req, res, async (context) => {
    console.log("Process activity");
    await messageExtensionBot.run(context);
  });
});

server.post("/tst", (req, res) => {
  console.log('REQUEST');
});


server.get("/teacher-panel", (req, res) => {
  const hatesJson = db.JSON();
  const hatesList = Array.from(Object.entries(hatesJson)).map(([key, value]) => ({key, ...value}));
  const model = {
    name: 'PAWEŁ',
    hates: hatesList
  }
  res.render('teacher-panel.html', model);
});
