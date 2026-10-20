import { SignIn } from '@clerk/nextjs';
import Logo from '../../components/ui/Logo';

export default function SignInPage() {
  return (
    <div className="min-h-[100dvh]">
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col items-center bg-white px-4 pb-10 pt-10">
        <Logo size="md" className="mb-8" />
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
      </main>
    </div>
  );
}
