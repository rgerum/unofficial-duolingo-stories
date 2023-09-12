
describe('Test Logins', () => {
    beforeEach(() => {
        cy.visit("/")
    })
    it('Open Overview', () => {
        // there should be multiple courses
        cy.get("[data-cy*=language_button_big]").should("have.length.greaterThan", 1)
        // open the Dutch course
        cy.get("[data-cy=language_button_big_nl-en]").click()
        cy.url().should('include', 'nl-en')
        cy.get("[data-cy*=story_button]").should("have.length.greaterThan", 1)
        // go back by the browser navigation
        cy.go('back')

        // go to the CCatalan course
        cy.get("[data-cy=language_button_big_ca-en]").click()
        cy.url().should('include', 'ca-en')
        cy.get("[data-cy*=story_button]").should("have.length.greaterThan", 1)
        // click on the logo to go back
        cy.get("[data-cy=logo]").click()

        // there should be multiple courses
        cy.get("[data-cy*=language_button_big]").should("have.length.greaterThan", 1)
    })

})
