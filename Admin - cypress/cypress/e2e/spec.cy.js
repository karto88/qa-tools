describe('Login Page', () => {
  it('opens login page', () => {

    cy.visit('https://dashboard.dev.keepz.me/login')
    cy.wait(2000)

    // ნომრის ჩაწერა: 591078180
    cy.get('input').first().type('591078180')
    cy.wait(1000)

    // "Log In" ღილაკზე დაკლიკება
    cy.contains('button', /Log In/i).click()
    cy.wait(2000)

    // Admin-ის არჩევა dropdown-დან
    cy.contains('Admin').click()
    cy.wait(1000)

    // პაროლის ჩაწერა: Keepz1234
    cy.get('input[type="password"]').type('Keepz1234')
    cy.wait(1000)

    // შესვლის ღილაკზე დაკლიკება
    cy.get('button').contains(/შესვლა|Log In|Submit/i).click()
    cy.wait(3000)
  })
})