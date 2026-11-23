import { Link } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { ROUTES } from "@shared/constants";

export function ForbiddenView() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="text-sm font-semibold text-primary">403</p>
      <h1 className="text-headline-md font-semibold text-on-surface">Access denied</h1>
      <p className="max-w-xl text-body-md text-on-surface-variant">
        Your account does not have access to this page.
      </p>
      <Button asChild className="min-h-12">
        <Link to={ROUTES.HOME}>Go to home</Link>
      </Button>
    </main>
  );
}
