
describe('Test Logins', () => {
    beforeEach(() => {
        cy.intercept('**/backend_node*/session', {body: {}}).as("user")
        cy.intercept('**/backend_node*/courses', { fixture: 'courses.json' }).as("courses")
        cy.intercept('**/backend_node*/courses_user', { fixture: 'courses_user.json' }).as("courses_user")
        cy.intercept('**/backend_node*/course_counts', { fixture: 'course_count.json' }).as("course_count")
        cy.intercept('**/backend_node*/course/el-en', { fixture: 'get_list_el_en.json' }).as("list_el")
        cy.intercept('**/backend_node*/course/ru-en', { fixture: 'get_list_ru_en.json' }).as("list_ru")

        cy.visit("http://localhost:3000")
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
