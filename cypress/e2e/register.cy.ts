//import query from "lib/db"

describe('Email confirmation', () => {
    beforeEach(() => {
        cy.exec('npm run init-reset')
        //query('DELETE FROM user WHERE username = "user_new"')
    })
    it('sends an email', () => {
        cy.task('hello', { greeting: 'Hello', name: 'World' })
        cy.task('resetEmails', "user@test.org")

        cy.visit('/')

        cy.get("[data-cy=login-button]").click()
        cy.url().should('include', '/auth/')

        cy.get("[data-cy=register-button]").click()
        cy.url().should('include', '/auth/register')

        cy.get("[data-cy=username]").type("user_new");
        cy.get("[data-cy=email]").type("user@test.org");
        cy.get("[data-cy=password]").type("test");

        cy.intercept('POST', '/auth/register/send').as('register')
        cy.get("[data-cy=submit]").click();

        cy.log('**redirects to /confirm**')
        cy.get("[data-cy=message-confirm").should("exist")
        //cy.location('pathname').should('equal', '/confirm')

        cy.wait(500)
        // by now the SMTP server has probably received the email
        cy.task('getLastEmail', 'user@test.org')
            .then(cy.wrap)
            // Tip: modern browsers supports named groups
            //.invoke('match', /href=.*?(?<code>\/auth\/.*?)'/)
            .invoke('match', /(?<code>\/auth\/[\/\w-]*)/)
            // the confirmation code
            .its('groups.code')
            .should('be.a', 'string')
            .then((code) => {
                cy.visit(code)
                cy.get("[data-cy=log-in]").click()
                cy.url().should('not.include', '/activate/')

                //cy.get("[data-cy=login-button]").click()
                cy.url().should('include', '/auth/signin')
                
                cy.get("[data-cy=username]").type("user_new");
                cy.get("[data-cy=password]").type("test");

                cy.get("[data-cy=submit]").click();

                // should go back to the overview
                cy.url().should('not.include', '/auth/')
                //cy.get('#confirmation_code').type(code)
                //cy.get('button[type=submit]').click()
                //cy.get('[data-cy=incorrect-code]').should('not.exist')
                //cy.get('[data-cy=confirmed-code]').should('be.visible')
            })

    })
})