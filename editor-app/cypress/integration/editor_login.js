
describe('Test Logins', () => {
    beforeEach(() => {
        cy.fixture('courses.json').as('courses')

        cy.intercept('**/login*', {body: {}}).as("login")
        //cy.intercept('**/session', {body: {}})
        cy.intercept('**/session', {body: {}}).as("session_empty")
        cy.intercept('POST', '**/courses', { fixture: 'courses.json' }).as("courses")

        cy.visit("")
    })
    it('Unauthorized login', () => {
        cy.get("input[type=text]").type("test2")
        cy.get("input[type=password]").type("test2")
        cy.intercept('**/session', {body: { "username": "test", "role": 0}}).as("session_invalid")
        cy.get("button").click()
        cy.contains("Not allowed")
    })
    it('Unsuccessful login attempt!', () => {
        cy.intercept('**/login*', {statusCode: 403, body: {}}).as("login_error")

        cy.get("input[type=text]").type("test")
        cy.get("input[type=password]").type("wrong")
        cy.get("button").click()
        cy.get(".login_error")
    })

    it('Successful login!', () => {
        cy.get("input[type=text]").type("test")
        cy.get("input[type=password]").type("right")
        cy.intercept('**/session', {body: { "username": "test", "role": 1}}).as("session_valid")
        cy.get("button").click()
        cy.contains("Course-Editor")
    })

})
