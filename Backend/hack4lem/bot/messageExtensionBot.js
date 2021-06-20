const axios = require("axios");
const querystring = require("querystring");
const { TeamsActivityHandler, CardFactory } = require("botbuilder");
const { v4: uuidv4 } = require('uuid');

class MessageExtensionBot extends TeamsActivityHandler {

  constructor(db) {
    super();
    this.db = db;
  }


  // Triggers when the message action is invoked by a user
  handleTeamsMessagingExtensionFetchTask(context, action) {
    const {contentType, content} = action.messagePayload.body;
    const hateAuthor = action.messagePayload.from.user.displayName;

    // Defining an Adaptive card and the content
    const card = {
      type: 'AdaptiveCard',
      version: '1.0'
    };

    // Show a dialog with a submit button
    card.body = [
      { type: 'TextBlock', text: 'Wiadomość, którą chcesz zgłosić:', weight: 'bolder'},
      { id: 'hateMessage', type: 'TextBlock', text: content },
      { type: 'TextBlock', text: 'Autor komentarza:', weight: 'bolder'},
      { id: 'hateAuthor', type: 'TextBlock', text: hateAuthor },
      { type: 'TextBlock', text: 'Twój komentarz:', weight: 'bolder'},
      { id: 'reporterComment', type: 'Input.Text' },
    ];
    card.actions = [{
      data: {
        continueConversation: true,
        hateMessage: content,
        hateAuthor: hateAuthor,
      },
      title: 'Zgłoś hejtera!',
      type: 'Action.Submit'
    }];

    const adaptiveCard = CardFactory.adaptiveCard(card);

    return {
      task: {
        type: 'continue',
        value: {
          card: adaptiveCard
        }
      }
    };

  }

  // Action.
  handleTeamsMessagingExtensionSubmitAction(context, action) {
    switch (action.commandId) {
      case "testCommand":
        return createCardCommand(context, action);
      case "testCommand2":
        return shareMessageCommand(context, action);
      case "reportHater":
        return this.reportHaterFlow(context, action);
      default:
        throw new Error("NotImplemented");
    }
  }

  // Search.
  async handleTeamsMessagingExtensionQuery(context, query) {
    const searchQuery = query.parameters[0].value;
    const response = await axios.get(
      `http://registry.npmjs.com/-/v1/search?${querystring.stringify({
        text: searchQuery,
        size: 8,
      })}`
    );

    const attachments = [];
    response.data.objects.forEach((obj) => {
      const heroCard = CardFactory.heroCard(obj.package.name);
      const preview = CardFactory.heroCard(obj.package.name);
      preview.content.tap = {
        type: "invoke",
        value: { description: obj.package.description },
      };
      const attachment = { ...heroCard, preview };
      attachments.push(attachment);
    });

    return {
      composeExtension: {
        type: "result",
        attachmentLayout: "list",
        attachments: attachments,
      },
    };
  }

  async handleTeamsMessagingExtensionSelectItem(context, obj) {
    return {
      composeExtension: {
        type: "result",
        attachmentLayout: "list",
        attachments: [CardFactory.thumbnailCard(obj.description)],
      },
    };
  }

  // Link Unfurling.
  handleTeamsAppBasedLinkQuery(context, query) {
    const attachment = CardFactory.thumbnailCard("Thumbnail Card", query.url, [query.url]);

    const result = {
      attachmentLayout: "list",
      type: "result",
      attachments: [attachment],
    };

    const response = {
      composeExtension: result,
    };
    return response;
  }

  reportHaterFlow(context, action) {
    return action.data.continueConversation
        ? this.reportHater(action)
        : this.endConversation();
  }
  
  reportHater(action) {
    const { hateAuthor, hateMessage, reporterComment } = action.data;

    this.db.set(uuidv4(), {
      hateAuthor,
      hateMessage,
      reporterComment
    });

    return this.showHaterReportedCard();
  }

  showHaterReportedCard() {
    const card = {
      type: 'AdaptiveCard',
      version: '1.0'
    };

    // Show a dialog with a submit button
    card.body = [
      { type: 'TextBlock', text: 'Twoje anonimowe zgłoszenie zostało wysłane.', weight: 'bolder'},
    ];
    card.actions = [{
      data: {
        continueConversation: false
      },
      title: 'OK',
      type: 'Action.Submit'
    }];

    const adaptiveCard = CardFactory.adaptiveCard(card);

    return {
      task: {
        type: 'continue',
        value: {
          card: adaptiveCard,
        }
      },
    }
  }

  endConversation() {
    return {
      composeExtension: {
        type: 'message',
        text: ''
      }
    }
  }
}

function createCardCommand(context, action) {
  // The user has chosen to create a card by choosing the 'Create Card' context menu command.
  const data = action.data;
  const heroCard = CardFactory.heroCard(data.title, data.text);
  heroCard.content.subtitle = data.subTitle;
  const attachment = {
    contentType: heroCard.contentType,
    content: heroCard.content,
    preview: heroCard,
  };

  return {
    composeExtension: {
      type: "result",
      attachmentLayout: "list",
      attachments: [attachment],
    },
  };
}

function shareMessageCommand(context, action) {
  // The user has chosen to share a message by choosing the 'Share Message' context menu command.
  let userName = "unknown";
  if (
    action.messagePayload &&
    action.messagePayload.from &&
    action.messagePayload.from.user &&
    action.messagePayload.from.user.displayName
  ) {
    userName = action.messagePayload.from.user.displayName;
  }

  // This Messaging Extension example allows the user to check a box to include an image with the
  // shared message.  This demonstrates sending custom parameters along with the message payload.
  let images = [];
  const includeImage = action.data.includeImage;
  if (includeImage === "true") {
    images = [
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtB3AwMUeNoq4gUBGe6Ocj8kyh3bXa9ZbV7u1fVKQoyKFHdkqU",
    ];
  }
  const heroCard = CardFactory.heroCard(
    `${userName} originally sent this message:`,
    action.messagePayload.body.content,
    images
  );

  if (
    action.messagePayload &&
    action.messagePayload.attachment &&
    action.messagePayload.attachments.length > 0
  ) {
    // This sample does not add the MessagePayload Attachments.  This is left as an
    // exercise for the user.
    heroCard.content.subtitle = `(${action.messagePayload.attachments.length} Attachments not included)`;
  }

  const attachment = {
    contentType: heroCard.contentType,
    content: heroCard.content,
    preview: heroCard,
  };

  return {
    composeExtension: {
      type: "result",
      attachmentLayout: "list",
      attachments: [attachment],
    },
  };
}



module.exports.MessageExtensionBot = MessageExtensionBot;
