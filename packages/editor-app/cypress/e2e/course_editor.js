
describe('Navigate Course Editor', () => {
    beforeEach(() => {
        cy.intercept('**/session', { fixture: 'session.json' }).as("session")
        cy.intercept('**/courses', { fixture: 'courses.json' }).as("courses")
        cy.intercept('**/*backend*/**/course/12', { fixture: 'course12.json' }).as("course_es")
        cy.intercept('**/*backend*/**/course/2', { fixture: 'course2.json' }).as("course_du")
        cy.intercept('**/*backend*/**/course/9', { fixture: 'course9.json' }).as("course_ru")
        cy.intercept('**/import/12/2', { fixture: 'import_12_2.json' }).as("import_du")
        cy.intercept('**/story/75', { fixture: 'story_75.json' }).as("story75")
        cy.intercept('**/image/*', { fixture: 'image.json' }).as("image")
        cy.intercept('**/avatar_names', { fixture: 'avatar_names.json' }).as("avatar_names")
        cy.intercept('**/avatar_names/9', { fixture: 'avatar_names.json' }).as("avatar_names")
        cy.intercept('**/language/9', { fixture: 'language_9.json' }).as("language_9")
        cy.intercept('**/language/1', { fixture: 'language_1.json' }).as("language_1")

        cy.visit("")
    })

    it('Open Spanish (official)', () => {
        // Click on Spanish to see if it is an offical story
        cy.contains("Spanish [en]").parent().click()
        cy.url().should('include', '/course/12')
        cy.get("[data-cy=course-title]").contains("Spanish")

        cy.get("[data-cy=story_list]").get("tr").should('have.length.greaterThan', 1)
        cy.get('[data-cy=label_official]')
        cy.get('[data-cy=button_import]').should('not.exist')
    })

    it('Open Dutch (un official) and try import', () => {
        // Open Dutch
        cy.contains("Dutch [en]").parent().click()
        cy.get("[data-cy=course-title]").contains("Dutch")
        cy.get("[data-cy=story_list]").get("tr").should('have.length.greaterThan', 1)
        cy.get('[data-cy=label_official]').should('not.exist')
        cy.get('[data-cy=button_import]').click()

        cy.get("[data-cy=import_list]").parent().contains('Importing')
        cy.get("[data-cy=import_list]").get("tr").should("have.length.greaterThan", 1)

        cy.get('[data-cy=button_back]').click()
        cy.get("[data-cy=story_list]").parent().should('not.contain', 'Importing')
    })

    it('Open Russian and start Editor', () => {
        // Select the Russian stories
        cy.contains("Russian [en]").parent().click()
        cy.get("[data-cy=course-title]").contains("Russian")
        cy.get("[data-cy=story_list]").get("tr").should('have.length.greaterThan', 1)

        // should not be official
        cy.get('[data-cy=label_official]').should('not.exist')

        // click on one of the stories
        cy.get("[data-cy=story_list]").get("tr").contains("Room for Rent").click()

        // story should open, and we should be able to scroll down
        cy.get('#story').get(".title").should('exist')
        //cy.get("#preview").scrollTo('bottom')
        //cy.get('#button_back').click()
    })

    it('Navigation via link and back/forward', () => {
        // directly link to the Dutch stories
        cy.visit("/course/2")
        cy.get("[data-cy=course-title]").contains("Dutch")

        // navigate to russian
        cy.contains("Russian [en]").parent().click()
        cy.url().should('include', '/course/9')
        cy.get("[data-cy=course-title]").contains("Russian")

        // then to spanish
        cy.contains("Spanish [en]").parent().click()
        cy.url().should('include', '/course/12')
        cy.get("[data-cy=course-title]").contains("Spanish")

        // test back (with history state)
        cy.go('back')
        cy.url().should('include', '/course/9')
        cy.get("[data-cy=course-title]").contains("Russian")

        // test back (without history state)
        cy.go('back')
        cy.url().should('include', '/course/2')
        cy.get("[data-cy=course-title]").contains("Dutch")

        // test 2x forward
        cy.go('forward')
        cy.url().should('include', '/course/9')
        cy.get("[data-cy=course-title]").contains("Russian")

        cy.go('forward')
        cy.url().should('include', '/course/12')
        cy.get("[data-cy=course-title]").contains("Spanish")

        // and once back
        cy.go('back')
        cy.url().should('include', '/course/9')
        cy.get("[data-cy=course-title]").contains("Russian")
    })
})
