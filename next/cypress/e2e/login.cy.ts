
describe('Login', () => {
    beforeEach(() => {
        cy.visit("http://localhost:3000")
    })
    it('Login with default user', () => {
        cy.get("[data-cy=login-button]").click()

        // should lead to the login page
        cy.url().should('include', '/auth/')

        cy.get("[data-cy=username]").type("user");
        cy.get("[data-cy=password]").type("test");
        cy.get("[data-cy=submit]").click();

        // should go back to the overview
        cy.url().should('not.include', '/auth/')
        // there should be multiple courses
        cy.get("[data-cy*=language_button_big]").should("have.length.greaterThan", 2);

        cy.get("[data-cy=user-profile]").click({force:true});
        // should lead to the login page
        cy.url().should('include', '/profile');
        cy.get("[data-cy=profile-error]").should("not.exist");

        cy.get("[data-cy=user-lightdark]").click({force:true});
        cy.get("[data-cy=user-lightdark]").click({force:true});

        //
        cy.get("[data-cy=user-logout]").click({force:true});
        cy.get("[data-cy=profile-error]").should("exist");

    })
})
