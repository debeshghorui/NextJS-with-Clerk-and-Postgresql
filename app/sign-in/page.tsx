'use client';

import React, { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';

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

    return 'Something went wrong. Please try again.';
}

export default function Signup() {
    const { signIn } = useSignIn();
    const router = useRouter();

    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isBusy = isSubmitting || !signIn;

    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!signIn || isSubmitting) return;

        setError(null);
        setIsSubmitting(true);

        try {
            const result = await signIn.create({
                identifier: emailAddress,
                password,
            });

            if (result.error) {
                setError(getErrorMessage(result.error));
                return;
            }

            // Redirect to the dashboard or any other page after successful sign-in
            router.push('/dashboard');
        } catch (err) {
            console.error(err);
            setError(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
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
            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        placeholder="john@example.com"
                        required
                        className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">
                        Password
                    </label>

                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full rounded-md border bg-background px-3 py-2 pr-12 outline-none focus:ring-2"
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
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
        </div>
    );
}
