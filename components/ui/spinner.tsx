import { cn } from '@/lib/utils';
import { RiLoaderLine } from '@remixicon/react';
import type { ComponentPropsWithoutRef } from 'react';

function Spinner({
    className,
    ...props
}: Omit<ComponentPropsWithoutRef<'svg'>, 'children'>) {
    return (
        <RiLoaderLine
            data-slot="spinner"
            role="status"
            aria-label="Loading"
            className={cn('size-4 animate-spin', className)}
            {...props}
        />
    );
}

export { Spinner };
