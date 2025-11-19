import { withAuth } from "next-auth/middleware";

// On exporte explicitement la fonction withAuth
export default withAuth({
  // On précise où est la page de login
  pages: {
    signIn: "/login",
  },
});

// On protège ces routes
export const config = {
  matcher: ["/", "/api/portfolio", "/api/alert"],
};