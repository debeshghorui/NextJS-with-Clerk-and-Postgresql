'use client';

import React, { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function Signup() {
    const { signUp, fetchStatus } = useSignUp();
    const router = useRouter();

    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [pendingVerification, setPendingVerification] = useState(false);
    const [error, setError] = useState<unknown>(null);
    const [showPassword, setShowPassword] = useState(false);

    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!signUp || fetchStatus === 'fetching') return;

        setError(null);

        try {
            const createResult = await signUp.create({
                emailAddress,
                password,
            });

            if (createResult.error) {
                setError(createResult.error);
                return;
            }

            const emailResult = await signUp.verifications.sendEmailCode();

            if (emailResult.error) {
                setError(emailResult.error);
                return;
            }

            setPendingVerification(true);
        } catch (err) {
            console.error(err);
            setError(err);
        }
    }

    async function onPressVerify(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!signUp || fetchStatus === 'fetching') return;

        setError(null);

        try {
            const verifyResult = await signUp.verifications.verifyEmailCode({
                code,
            });

            if (verifyResult.error) {
                setError(verifyResult.error);
                return;
            }

            // Email verified successfully
            if (signUp.status === 'complete') {
                const finalizeResult = await signUp.finalize();

                if (finalizeResult.error) {
                    setError(finalizeResult.error);
                    return;
                }

                router.push('/dashboard');
            }
        } catch (err) {
            console.error(err);
            setError(err);
        }
    }

    if (fetchStatus === 'fetching') {
        return (
            <div className="flex min-h-screen items-center justify-center">
                Loading...
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
                                {JSON.stringify(error)}
                            </p>
                        )}

                        <div id="clerk-captcha" />

                        <button
                            type="submit"
                            disabled={fetchStatus === 'fetching'}
                            className="w-full rounded-md bg-primary py-2 font-medium text-primary-foreground disabled:opacity-50"
                        >
                            {fetchStatus === 'fetching'
                                ? 'Creating account...'
                                : 'Create account'}
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
                                {JSON.stringify(error)}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={fetchStatus === 'fetching'}
                            className="w-full rounded-md bg-primary py-2 font-medium text-primary-foreground disabled:opacity-50"
                        >
                            {fetchStatus === 'fetching'
                                ? 'Verifying...'
                                : 'Verify Email'}
                        </button>

                        <button
                            type="button"
                            onClick={() => setPendingVerification(false)}
                            className="w-full text-sm text-muted-foreground hover:underline"
                        >
                            Back
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
