
describe('Navigate Course Editor', () => {
    beforeEach(() => {
        cy.fixture('courses.json').as('courses')
        cy.intercept('**/session', { fixture: 'session.json' }).as("session")
        //cy.intercept('POST', '**/courses', { fixture: 'courses.json' }).as("courses")
        //cy.intercept('POST', '**/course?id=12', { fixture: 'course12.json' }).as("course_es")
        //cy.intercept('POST', '**/course?id=2', { fixture: 'course2.json' }).as("course_du")
        //cy.intercept('POST', '**/course?id=9', { fixture: 'course9.json' }).as("course_ru")
        //cy.intercept('POST', '**/import?id=12&id2=2', { fixture: 'import_12_2.json' }).as("import_du")
        //cy.intercept('POST', '**/story?id=75', { fixture: 'story_75.json' }).as("story75")
        //cy.intercept('POST', '**/image?id=*', { fixture: 'image.json' }).as("image")
        //cy.intercept('POST', '**/avatar_names?*', { fixture: 'avatar_names.json' }).as("avatar_names")
        //cy.intercept('POST', '**/language?id=9', { fixture: 'language_9.json' }).as("language_9")
        cy.intercept('**/*backend*/**/language/2', { fixture: 'language_2.json' }).as("language_2")
        cy.intercept('**/*backend*/**/speakers/2', { fixture: 'speakers_2.json' }).as("speakers_2")
        cy.intercept('**/avatar_names/2', { fixture: 'avatars_2.json' }).as("avatars_2")

        cy.visit("language/2")
        //cy.get("input[type=text]").type("test")
        //cy.get("input[type=password]").type("test")
        //cy.get("button").type("click")
        //cy.contains("Course-Editor")
    })

    it('Open Dutch', () => {
        // Click on Spanish to see if it is an offical story
        cy.get("[data-cy=language-name]").contains("Dutch")
        cy.get("[data-cy=voice_list]").get("tr").should('have.length.greaterThan', 1)
        cy.get("[data-cy=avatar_list1]").get("div").should('have.length.greaterThan', 1)
        cy.get("[data-cy=avatar_list2]").get("div").should('have.length.greaterThan', 1)
    })
})
