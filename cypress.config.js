import { defineConfig } from "cypress";
const ms = require("smtp-tester");
//import ms from "smtp-tester"

export default defineConfig({
  projectId: "cvszgh",
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      // implement node event listeners here
      // starts the SMTP server at localhost:7777
      const port = 7777;
      const mailServer = ms.init(port);
      console.log("mail server at port %d", port);

      // [receiver email]: email text
      let lastEmail = {};

      // process all emails
      mailServer.bind((addr, id, email) => {
        console.log("--- email to %s ---", email.headers.to);
        console.log(email.body);
        console.log("--- end ---");
        // store the email by the receiver email
        lastEmail[email.headers.to] = {
          body: email.body,
          html: email.html,
        };
        console.log("lastEmail", lastEmail);
      });

      on("task", {
        resetEmails(email) {
          console.log("reset all emails", email);
          if (email) {
            delete lastEmail[email];
          } else {
            lastEmail = {};
          }
          return null;
        },

        getLastEmail(userEmail) {
          console.log("lastEmail", userEmail, lastEmail);
          // cy.task cannot return undefined
          // thus we return null as a fallback
          return lastEmail[userEmail].html || null;
        },
      });
    },
  },
});
