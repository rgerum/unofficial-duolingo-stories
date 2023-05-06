
describe('Test Logins', () => {
    beforeEach(() => {
        cy.visit("http://localhost:3000")
    })
    it('Open Overview', () => {
        cy.get("[data-cy*=language_button_big]").should("have.length.greaterThan", 1)
        cy.get("[data-cy=language_button_big_nl-en]").click()
        cy.url().should('include', 'nl-en')
        cy.get("[data-cy*=story_button]").should("have.length.greaterThan", 1)
        cy.go('back')

        cy.get("[data-cy=language_button_big_ca-en]").click()
        cy.url().should('include', 'ca-en')
        cy.get("[data-cy*=story_button]").should("have.length.greaterThan", 1)
        cy.go('back')
    })

})
