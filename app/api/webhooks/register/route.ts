import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';

import { prisma } from '@/lib/db';
import { env } from '@/env';

export async function POST(req: Request) {
    const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET;

    const headerPayload = await headers();

    const svic_id = headerPayload.get('svix-id');
    const svic_timestamp = headerPayload.get('svix-timestamp');
    const svic_signature = headerPayload.get('svix-signature');

    if (!svic_id || !svic_timestamp || !svic_signature) {
        return new Response('Missing required headers', { status: 400 });
    }

    const payload = await req.json();

    const body = JSON.stringify(payload);

    const webhook = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;

    try {
        evt = webhook.verify(body, {
            'svix-id': svic_id,
            'svix-timestamp': svic_timestamp,
            'svix-signature': svic_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error('Webhook verification failed:', err);
        return new Response('Webhook verification failed', { status: 400 });
    }

    console.log('Webhook verified successfully:', evt);
    console.log('\n\n');

    const { id } = evt.data;
    const eventType = evt.type;

    // Logs
    if (eventType === 'user.created') {
        console.log(`User created with ID: ${id}`);
        try {
            // Handle user creation logic here
            const { email_addresses, primary_email_address_id } = evt.data;

            const primaryEmail = email_addresses.find(
                (email) => email.id === primary_email_address_id,
            );

            console.log(`Primary email: ${primaryEmail?.email_address}`);

            if (!primaryEmail) {
                console.error('Primary email not found for user:', id);
                return new Response('Primary email not found', { status: 400 });
            }

            // Create a new user in your database with the primary email
            await prisma.user.create({
                data: {
                    id,
                    email: primaryEmail.email_address,
                },
            });

            console.log(
                `User with ID ${id} created successfully in the database.`,
            );
            return new Response('User created successfully', { status: 200 });
        } catch (error) {
            console.error('Error handling user.created event:', error);
            return new Response('Error creating user in database', {
                status: 400,
            });
        }
    }

    // Handle other event types as needed
    return new Response('Webhook recived successfully', { status: 200 });
}
