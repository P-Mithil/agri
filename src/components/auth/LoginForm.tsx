
'use client';

import React, { useState, useTransition } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Loader2, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from 'react-i18next';

const LoginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').min(1, 'Password is required'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').optional(),
});

type LoginFormValues = z.infer<typeof LoginSchema>;

export default function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [authError, setAuthError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useTranslation();

  const { register, handleSubmit, formState: { errors }, watch } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
      displayName: '',
    },
  });

  const currentEmail = watch("email");

  const handleAuthAction = async (data: LoginFormValues, action: 'signIn' | 'signUp') => {
    setAuthError(null);
    startTransition(async () => {
      try {
        if (action === 'signUp') {
          if (!data.displayName || data.displayName.trim().length < 2) {
             setAuthError(t('displayNameRequiredToast'));
             toast({
                title: t('signUpErrorToastTitle'),
                description: t('displayNameRequiredToast'),
                variant: "destructive",
              });
             return;
          }
          const { error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
              data: {
                display_name: data.displayName,
              },
            },
          });

          if (error) throw error;

          toast({
            title: t('accountCreatedToastTitle'),
            description: t('accountCreatedToastDescription'),
            variant: 'default',
          });
          router.push('/');
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
          });

          if (error) throw error;

          toast({
            title: t('signedInToastTitle'),
            description: t('signedInToastDescription'),
            variant: 'default',
          });
          router.push('/');
        }
      } catch (error: any) {
        let friendlyMessage = error.message || 'An unknown error occurred. Please try again.';
        if (error.message?.includes('Invalid login credentials')) {
          friendlyMessage = 'Invalid email or password. Please try again.';
        } else if (error.message?.includes('User already registered')) {
          friendlyMessage = 'This email is already registered. Please sign in.';
        } else if (error.message?.includes('Password should be at least 6 characters')) {
          friendlyMessage = 'Password should be at least 6 characters.';
        }

        setAuthError(friendlyMessage);
        toast({
          title: action === 'signUp' ? t('signUpErrorToastTitle') : t('signInErrorToastTitle'),
          description: friendlyMessage,
          variant: 'destructive',
        });
      }
    });
  };

  const onSignInSubmit: SubmitHandler<LoginFormValues> = (data) => handleAuthAction(data, 'signIn');
  const onSignUpSubmit: SubmitHandler<LoginFormValues> = (data) => handleAuthAction(data, 'signUp');
  
  const likelyExistingUser = currentEmail.includes('@gmail.com') || currentEmail.includes('@outlook.com') || currentEmail.includes('@yahoo.com');

  return (
    <form className="space-y-6">
      {authError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('authErrorTitle')}</AlertTitle>
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">{t('emailLabel')}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t('emailPlaceholder')}
          {...register('email')}
          className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
          aria-invalid={errors.email ? "true" : "false"}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t('passwordLabel')}</Label>
        <Input
          id="password"
          type="password"
          placeholder={t('passwordPlaceholder')}
          {...register('password')}
          className={errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}
          aria-invalid={errors.password ? "true" : "false"}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      
      {(!likelyExistingUser || (currentEmail && !errors.email)) && (
          <div className="space-y-2">
            <Label htmlFor="displayName">{t('displayNameLabel')}</Label>
            <Input
              id="displayName"
              type="text"
              placeholder={t('displayNamePlaceholder')}
              {...register('displayName')}
              className={errors.displayName ? 'border-destructive focus-visible:ring-destructive' : ''}
              aria-invalid={errors.displayName ? "true" : "false"}
            />
            {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
            <p className="text-xs text-muted-foreground">{t('displayNameHelper')}</p>
          </div>
        )}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          type="button"
          onClick={handleSubmit(onSignInSubmit)}
          disabled={isPending}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
          {t('signInButton')}
        </Button>
        <Button
          type="button"
          onClick={handleSubmit(onSignUpSubmit)}
          disabled={isPending}
          variant="secondary"
          className="w-full"
        >
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
          {t('signUpButton')}
        </Button>
      </div>
    </form>
  );
}
