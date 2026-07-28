'use client';

import React, { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
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

export default function Signup() {
    const { signUp, fetchStatus } = useSignUp();
    const router = useRouter();

    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [pendingVerification, setPendingVerification] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isBusy = isSubmitting || fetchStatus === 'fetching' || !signUp;

    async function finalizeSignUp() {
        if (!signUp) return;

        const { error: finalizeError } = await signUp.finalize({
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

    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!signUp || isSubmitting) return;

        setError(null);
        setIsSubmitting(true);

        try {
            const { error: passwordError } = await signUp.password({
                emailAddress,
                password,
            });

            if (passwordError) {
                setError(getErrorMessage(passwordError));
                return;
            }

            if (signUp.status === 'complete') {
                await finalizeSignUp();
                return;
            }

            if (signUp.unverifiedFields.includes('email_address')) {
                const { error: emailCodeError } =
                    await signUp.verifications.sendEmailCode();

                if (emailCodeError) {
                    setError(getErrorMessage(emailCodeError));
                    return;
                }

                setPendingVerification(true);
                return;
            }

            if (signUp.status === 'missing_requirements') {
                setError(
                    'This account needs more required details before it can be created.',
                );
                return;
            }

            setError('This sign-up needs another step before it can continue.');
        } catch (err) {
            console.error(err);
            setError(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    }

    async function onPressVerify(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!signUp || isSubmitting) return;

        setError(null);
        setIsSubmitting(true);

        try {
            const verifyResult = await signUp.verifications.verifyEmailCode({
                code,
            });

            if (verifyResult.error) {
                setError(getErrorMessage(verifyResult.error));
                return;
            }

            if (signUp.status === 'complete') {
                await finalizeSignUp();
                return;
            }

            if (signUp.status === 'missing_requirements') {
                setError(
                    'Your email was verified, but this account still needs more details.',
                );
                return;
            }

            setError(
                'Your email was verified, but sign-up is not complete yet.',
            );
        } catch (err) {
            console.error(err);
            setError(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    }

    async function resetFlow() {
        if (!signUp || isSubmitting) return;

        await signUp.reset();
        setCode('');
        setError(null);
        setPendingVerification(false);
    }

    if (!signUp) {
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
                            ? 'Verify your email'
                            : 'Create an account'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {pendingVerification
                            ? 'Enter the verification code sent to your email.'
                            : 'Create your account to continue.'}
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
                            {isBusy ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={onPressVerify} className="space-y-4">
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
                            {isBusy ? 'Verifying...' : 'Verify Email'}
                        </button>

                        <button
                            type="button"
                            onClick={resetFlow}
                            disabled={isBusy}
                            className="w-full text-sm text-muted-foreground hover:underline disabled:opacity-50"
                        >
                            Back
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
