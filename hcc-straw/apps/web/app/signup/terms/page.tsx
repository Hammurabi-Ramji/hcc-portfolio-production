import Link from 'next/link';

export default function SignupTermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary px-4 py-12">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/signup" className="text-primary hover:underline">
              Back to signup
            </Link>
          </p>
          <h1 className="mt-4 text-3xl font-bold text-gradient">Terms of Service</h1>
          <p className="mt-2 text-muted-foreground">
            Local AUTARCH / STRAW registration terms for this development surface.
          </p>
        </div>

        <article className="space-y-4 rounded-xl border border-border bg-card p-8 shadow-lg text-sm leading-6 text-foreground">
          <p>
            By creating an account you confirm that you are authorized to use this local
            application, that the email and username you provide are yours to use, and that you
            will not attempt to access another user&apos;s session or data.
          </p>
          <p>
            Accounts are authenticated with an HttpOnly session cookie issued by the local API.
            You must keep your password confidential. Operators may disable accounts that abuse
            registration, storage, or network resources.
          </p>
          <p>
            These terms apply to the quarantined web signup flow only. Product, deployment, and
            release obligations remain with their respective owners.
          </p>
        </article>
      </div>
    </div>
  );
}
