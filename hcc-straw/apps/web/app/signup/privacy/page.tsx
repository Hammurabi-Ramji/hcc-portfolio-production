import Link from 'next/link';

export default function SignupPrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary px-4 py-12">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/signup" className="text-primary hover:underline">
              Back to signup
            </Link>
          </p>
          <h1 className="mt-4 text-3xl font-bold text-gradient">Privacy Policy</h1>
          <p className="mt-2 text-muted-foreground">
            How this local signup surface handles account data.
          </p>
        </div>

        <article className="space-y-4 rounded-xl border border-border bg-card p-8 shadow-lg text-sm leading-6 text-foreground">
          <p>
            Registration stores the email, username, password hash, and optional name fields you
            submit. The session credential is held only in an HttpOnly cookie named{' '}
            <code className="rounded bg-secondary px-1 py-0.5">straw_session</code>; the browser
            client does not keep that credential in local storage.
          </p>
          <p>
            Profile and account records live in the local API database for this development stack.
            There is no third-party marketing transfer from this signup page. Recovery email
            delivery remains unsupported until an authorized transport exists.
          </p>
          <p>
            You can sign out to revoke the current server session. Further retention and deletion
            controls belong to the API and settings owners.
          </p>
        </article>
      </div>
    </div>
  );
}
