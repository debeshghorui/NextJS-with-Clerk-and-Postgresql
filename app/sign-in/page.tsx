'use client';

import React, { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';

const AUTH_REDIRECT_URL = '/dashboard';

function getErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
        return error;
    }

    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
        const message = (error as { message?: unknown }).message;

        if (typeof message === 'string') {
            return message;
        }
    }

    if (typeof error === 'object' && error !== null && 'errors' in error) {
        const errors = (error as { errors?: unknown }).errors;

        if (Array.isArray(errors)) {
            const firstError = errors[0] as { message?: unknown } | undefined;

            if (typeof firstError?.message === 'string') {
                return firstError.message;
            }
        }
    }

    return 'Something went wrong. Please try again.';
}

export default function SignInPage() {
    const { signIn, fetchStatus } = useSignIn();
    const router = useRouter();

    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [pendingVerification, setPendingVerification] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isBusy = isSubmitting || fetchStatus === 'fetching' || !signIn;

    async function finalizeSignIn() {
        if (!signIn) return;

        const { error: finalizeError } = await signIn.finalize({
            navigate: ({ decorateUrl }) => {
                const url = decorateUrl(AUTH_REDIRECT_URL);

                if (url.startsWith('http')) {
                    window.location.href = url;
                    return;
                }

                router.push(url);
            },
        });

        if (finalizeError) {
            setError(getErrorMessage(finalizeError));
        }
    }

    async function sendEmailVerificationCode() {
        if (!signIn) return;

        const emailCodeFactor = signIn.supportedSecondFactors.find(
            (factor) => factor.strategy === 'email_code',
        );

        if (!emailCodeFactor) {
            setError(
                'This sign-in needs a verification method that is not enabled here.',
            );
            return;
        }

        const { error: emailCodeError } = await signIn.mfa.sendEmailCode();

        if (emailCodeError) {
            setError(getErrorMessage(emailCodeError));
            return;
        }

        setPendingVerification(true);
    }

    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!signIn || isSubmitting) return;

        setError(null);
        setIsSubmitting(true);

        try {
            const { error: passwordError } = await signIn.password({
                emailAddress,
                password,
            });

            if (passwordError) {
                setError(getErrorMessage(passwordError));
                return;
            }

            if (signIn.status === 'complete') {
                await finalizeSignIn();
                return;
            }

            if (
                signIn.status === 'needs_client_trust' ||
                signIn.status === 'needs_second_factor'
            ) {
                await sendEmailVerificationCode();
                return;
            }

            setError('This sign-in needs another step before it can continue.');
        } catch (err) {
            console.error(err);
            setError(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    }

    async function verify(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!signIn || isSubmitting) return;

        setError(null);
        setIsSubmitting(true);

        try {
            const { error: verifyError } = await signIn.mfa.verifyEmailCode({
                code,
            });

            if (verifyError) {
                setError(getErrorMessage(verifyError));
                return;
            }

            if (signIn.status === 'complete') {
                await finalizeSignIn();
                return;
            }

            setError(
                'The verification code was accepted, but sign-in is not complete yet.',
            );
        } catch (err) {
            console.error(err);
            setError(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    }

    async function resendCode() {
        if (!signIn || isSubmitting) return;

        setError(null);
        setIsSubmitting(true);

        try {
            const { error: emailCodeError } = await signIn.mfa.sendEmailCode();

            if (emailCodeError) {
                setError(getErrorMessage(emailCodeError));
            }
        } catch (err) {
            console.error(err);
            setError(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    }

    async function resetFlow() {
        if (!signIn || isSubmitting) return;

        await signIn.reset();
        setCode('');
        setError(null);
        setPendingVerification(false);
    }

    if (!signIn) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Spinner className="size-8 text-primary" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-6 space-y-2 text-center">
                    <h1 className="text-2xl font-bold">
                        {pendingVerification
                            ? 'Verify your account'
                            : 'Sign in'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {pendingVerification
                            ? 'Enter the verification code sent to your email.'
                            : 'Use your email and password to continue.'}
                    </p>
                </div>

                {!pendingVerification ? (
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="email"
                                className="text-sm font-medium"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={emailAddress}
                                onChange={(e) =>
                                    setEmailAddress(e.target.value)
                                }
                                placeholder="john@example.com"
                                required
                                className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2"
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="password"
                                className="text-sm font-medium"
                            >
                                Password
                            </label>

                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="••••••••"
                                    required
                                    className="w-full rounded-md border bg-background px-3 py-2 pr-12 outline-none focus:ring-2"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword((prev) => !prev)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                                {error}
                            </p>
                        )}

                        <div id="clerk-captcha" />

                        <button
                            type="submit"
                            disabled={isBusy}
                            className="w-full rounded-md bg-primary py-2 font-medium text-primary-foreground disabled:opacity-50"
                        >
                            {isBusy ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={verify} className="space-y-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="code"
                                className="text-sm font-medium"
                            >
                                Verification Code
                            </label>

                            <input
                                id="code"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="123456"
                                required
                                className="w-full rounded-md border bg-background px-3 py-2 text-center text-lg tracking-[0.3em] outline-none focus:ring-2"
                            />
                        </div>

                        {error && (
                            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isBusy}
                            className="w-full rounded-md bg-primary py-2 font-medium text-primary-foreground disabled:opacity-50"
                        >
                            {isBusy ? 'Verifying...' : 'Verify'}
                        </button>

                        <button
                            type="button"
                            onClick={resendCode}
                            disabled={isBusy}
                            className="w-full text-sm text-muted-foreground hover:underline disabled:opacity-50"
                        >
                            Send a new code
                        </button>

                        <button
                            type="button"
                            onClick={resetFlow}
                            disabled={isBusy}
                            className="w-full text-sm text-muted-foreground hover:underline disabled:opacity-50"
                        >
                            Start over
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
