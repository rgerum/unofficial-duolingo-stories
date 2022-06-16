
describe('Test Logins', () => {
    beforeEach(() => {
        cy.intercept('**/user.php?*', {body: "null"}).as("user")
        cy.intercept('**/get_courses.php', { fixture: 'courses.json' }).as("courses")
        cy.intercept('**/get_list.php?lang=el&lang_base=en', { fixture: 'get_list_el_en.json' }).as("list_el")
        cy.intercept('**/get_list.php?lang=ru&lang_base=en', { fixture: 'get_list_ru_en.json' }).as("list_ru")

        cy.visit("")
    })
    it('Open Overview', () => {
        cy.get("[data-cy*=language_button_big]").should("have.length.greaterThan", 1)
        cy.get("[data-cy=language_button_big_3]").click()
        cy.url().should('include', 'el-en')
        cy.get("[data-cy*=story_button]").should("have.length.greaterThan", 1)
        cy.go('back')

        cy.get("[data-cy=language_button_big_9]").click()
        cy.url().should('include', 'ru-en')
        cy.get("[data-cy*=story_button]").should("have.length.greaterThan", 1)
        cy.go('back')
    })

})
