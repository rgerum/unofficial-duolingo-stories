
describe('Test Logins', () => {
    beforeEach(() => {
        cy.intercept('**/login*', {body: {}}).as("login")
        cy.intercept('**/logout*', {body: {}}).as("logout")
        //cy.intercept('**/session', {body: {}})
        cy.intercept('**/session', {body: {}}).as("session_empty")
        cy.intercept('**/courses', { fixture: 'courses.json' }).as("courses")

        cy.visit("")
    })
    it('Unauthorized login', () => {
        cy.get("[data-cy=username]").type("test2")
        cy.get("[data-cy=password]").type("test2")
        cy.intercept('**/session', {body: { "username": "test", "role": 0}}).as("session_invalid")
        cy.get("[data-cy=submit]").click()
        cy.contains("Not allowed")
        cy.intercept('**/session', {body: {}}).as("session_empty")
        cy.get("[data-cy=back]").click()
        cy.get("[data-cy=username]")
    })
    it('Unsuccessful login attempt!', () => {
        cy.intercept('**/login*', {statusCode: 403, body: {}}).as("login_error")

        cy.get("[data-cy=username]").type("test")
        cy.get("[data-cy=password]").type("wrong")
        cy.get("[data-cy=submit]").click()
        cy.get("[data-cy=login_error]")
    })

    it('Successful login!', () => {
        cy.get("[data-cy=username]").type("test")
        cy.get("[data-cy=password]").type("right")
        cy.intercept('**/session', {body: { "username": "test", "role": 1}}).as("session_valid")
        cy.get("[data-cy=submit]").click()
        cy.contains("Course-Editor")
    })

})
