import { SignUp } from '@clerk/nextjs';
import Logo from '../../components/ui/Logo';

export default function SignUpPage() {
  return (
    <div className="min-h-[100dvh]">
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col items-center bg-white px-4 pb-10 pt-10">
        <Logo size="md" className="mb-8" />
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
      </main>
    </div>
  );
}
