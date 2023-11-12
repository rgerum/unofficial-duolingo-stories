//import query from "lib/db"

describe("Reset password", () => {
  beforeEach(() => {
    cy.exec("npm run init-reset");
    //query('DELETE FROM user WHERE username = "user_new"')
  });
  it("reset the password", () => {
    cy.task("resetEmails", "test2@duostories.org");

    cy.visit("/");

    cy.get("[data-cy=login-button]").click();
    cy.url().should("include", "/auth/");

    cy.get("[data-cy=reset-button]").click();
    cy.url().should("include", "/auth/reset_pw");

    cy.get("[data-cy=email]").type("test2@duostories.org");

    cy.intercept("POST", "/auth/register/send").as("register");
    cy.get("[data-cy=submit]").click();

    cy.log("**redirects to /confirm**");
    cy.get("[data-cy=message-confirm").should("exist");
    //cy.location('pathname').should('equal', '/confirm')

    cy.wait(1000);
    // by now the SMTP server has probably received the email
    cy.task("getLastEmail", "test2@duostories.org")
      .then(cy.wrap)
      // Tip: modern browsers supports named groups
      //.invoke('match', /href=.*?(?<code>\/auth\/.*?)'/)
      .invoke("match", /(?<code>\/auth\/[\/\w-]*)/)
      // the confirmation code
      .its("groups.code")
      .should("be.a", "string")
      .then((code) => {
        cy.visit(code);
        cy.get("[data-cy=password]").type("test1234");
        cy.get("[data-cy=submit]").click();
        cy.get("[data-cy=log-in]").click();
        cy.url().should("not.include", "/activate/");

        //cy.get("[data-cy=login-button]").click()
        cy.url().should("include", "/auth/signin");

        cy.get("[data-cy=username]").type("user");
        cy.get("[data-cy=password]").type("test1234");

        cy.get("[data-cy=submit]").click();

        // should go back to the overview
        cy.url().should("not.include", "/auth/");
        //cy.get('#confirmation_code').type(code)
        //cy.get('button[type=submit]').click()
        //cy.get('[data-cy=incorrect-code]').should('not.exist')
        //cy.get('[data-cy=confirmed-code]').should('be.visible')
      });
  });
});
