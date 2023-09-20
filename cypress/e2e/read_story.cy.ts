describe("Test Story", () => {
  beforeEach(() => {
    // reset and seed the database prior to every test
    //cy.exec('npm run init')
    // log in
    cy.login("user", "test");
    cy.visit("/");
  });
  it("Read Minimalist Story", () => {
    // there should be multiple courses
    cy.get("[data-cy*=language_button_big]").should(
      "have.length.greaterThan",
      2,
    );
    // open the Dutch course
    cy.get("[data-cy=language_button_big_test-en]").click();
    cy.url().should("include", "test-en");
    cy.get("[data-loaded=true]");
    cy.get("[data-cy*=story_button]").eq(1).click();

    cy.url().should("include", "story");

    cy.get("[data-cy=continue]").click();
    cy.get("[data-cy=continue]").click();

    // Finished
    cy.get("[data-cy=finished]").should("have.lengthOf", 1);

    cy.get("[data-cy=button-finished]").click();

    // story page
    cy.url().should("include", "test-en");

    // should now see one story done
    cy.get("[data-loaded=true]");
    cy.get("[data-cy*=story_button]")
      .eq(1)
      .get("[data-done=true]")
      .should("exist");

    // now we should have the language in the dropdown menu
    //cy.get("[data-cy=button_lang_dropdown]").should("have.lengthOf", 1)
  });
  it.only("Read Full Story", () => {
    // there should be multiple courses
    cy.get("[data-cy*=language_button_big]").should(
      "have.length.greaterThan",
      2,
    );
    // open the Dutch course
    cy.get("[data-cy=language_button_big_test-en]").click();
    cy.url().should("include", "test-en");
    cy.get("[data-loaded=true]");
    cy.get("[data-cy*=story_button]").eq(0).click();

    cy.url().should("include", "story");

    // have one part, the title
    cy.get("[data-cy=part]").should("have.lengthOf", 1);
    cy.get("[data-cy=continue]").click();

    // have one narrator line
    cy.get("[data-cy=part]").should("have.lengthOf", 2);
    cy.get("[data-cy=continue]").click();

    // one speaker line
    cy.get("[data-cy=part]").should("have.lengthOf", 3);
    cy.get("[data-cy=continue]").click();

    // MULTIPLE CHOICE
    cy.get("[data-cy=part]").should("have.lengthOf", 4);
    cy.get("[data-cy=continue]").click();
    cy.get("[data-cy=multiple-choice] [data-cy=button]").first().click();

    cy.get("[data-cy=continue]").click();

    // ARRANGE
    cy.get("[data-cy=part]").should("have.lengthOf", 5);
    cy.get("[data-cy=part] [data-cy=arrange-button]").first().next().click();
    cy.get("[data-cy=part] [data-cy=arrange-button]")
      .first()
      .next()
      .next()
      .click();
    cy.get("[data-cy=part] [data-cy=arrange-button]").first().click();

    cy.get("[data-cy=continue]").click();

    // POINT_TO_PHRASE
    cy.get("[data-cy=part]").should("have.lengthOf", 6);
    cy.get("[data-cy=continue]").click();

    cy.get("[data-cy=part]").should("have.lengthOf", 6);
    cy.get("[data-cy=part] [data-cy=point-button]").first().click();
    cy.get("[data-cy=continue]").click();

    // SELECT_PHRASE
    cy.get("[data-cy=part]").should("have.lengthOf", 7);
    cy.get("[data-cy=part] [data-cy=select-button]").first().click();
    cy.get("[data-cy=continue]").click();

    // CONTINUATION
    cy.get("[data-cy=part]").should("have.lengthOf", 8);
    cy.get("[data-cy=multiple-choice] [data-cy=button]").first().click();

    cy.get("[data-cy=continue]").click();

    // MATCH
    cy.get("[data-cy=part]").should("have.lengthOf", 9);
    cy.get("[data-cy=col1-button]").eq(4).click();
    cy.get("[data-cy=col2-button]").eq(3).click();

    cy.get("[data-cy=col1-button]").eq(0).click();
    cy.get("[data-cy=col2-button]").eq(4).click();

    cy.get("[data-cy=col1-button]").eq(2).click();
    cy.get("[data-cy=col2-button]").eq(0).click();

    cy.get("[data-cy=col1-button]").eq(1).click();
    cy.get("[data-cy=col2-button]").eq(2).click();

    cy.get("[data-cy=col1-button]").eq(3).click();
    cy.get("[data-cy=col2-button]").eq(1).click();

    cy.get("[data-cy=continue]").click();

    cy.get("[data-cy=button-finished]").click();

    // Finished
    cy.get("[data-loaded=true]");
    cy.get("[data-cy*=story_button]")
      .eq(0)
      .get("[data-done=true]")
      .should("exist");

    // story page
    cy.url().should("include", "test-en");
  });
});
