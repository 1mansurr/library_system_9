describe('Authentication Flow E2E', () => {
  it('should navigate to login page, allow typing and display error on invalid login', () => {
    cy.visit('/login');
    
    // Check that we're on the login page
    cy.contains('Welcome back');
    cy.contains('Sign in to your library account.');

    // Type in credentials
    cy.get('input[type="email"]').type('test.student@st.knust.edu.gh');
    cy.get('input[type="password"]').type('wrongpassword');

    // Submit form
    cy.get('button[type="submit"]').click();

    // Verify error message
    cy.contains('Invalid email or password.').should('be.visible');
  });

  it('should clear form inputs correctly', () => {
    cy.visit('/login');
    
    cy.get('input[type="email"]').type('test@example.com').clear().should('have.value', '');
    cy.get('input[type="password"]').type('password').clear().should('have.value', '');
  });
});
