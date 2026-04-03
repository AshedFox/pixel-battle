import { buttonVariants } from '@/components/ui/button';
import { confirmEmailParamsSchema } from '@repo/shared';
import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle2Icon, XCircleIcon } from 'lucide-react';
import { confirmEmail } from '@/services/auth.service';

export const Confirm = () => {
  const params = useParams();
  const { data, success } = confirmEmailParamsSchema.safeParse(params);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (!success) {
      setStatus('error');
      return;
    }

    if (fetchingRef.current) {
      return;
    }
    fetchingRef.current = true;

    const verify = async () => {
      try {
        const { error } = await confirmEmail(data.token);
        setStatus(!error ? 'success' : 'error');
      } catch {
        setStatus('error');
      }
    };

    verify();
  }, [success, data]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle>Email Confirmation</CardTitle>
          <CardDescription>
            {status === 'loading' && 'Verifying your email address...'}
            {status === 'success' && 'Email verified successfully!'}
            {status === 'error' && 'Failed to verify email'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6 gap-6">
          {status === 'loading' && <Spinner className="size-16 text-primary" />}
          {status === 'success' && (
            <>
              <CheckCircle2Icon className="size-16 text-green-500" />
              <Link className={buttonVariants()} to="/login">
                Go to login
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircleIcon className="size-16 text-red-500" />
              <p className="text-center text-muted-foreground text-sm">
                The confirmation link is invalid, expired, or the account is
                already verified.
              </p>
              <Link className={buttonVariants({ variant: 'link' })} to="/login">
                Go to login
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
