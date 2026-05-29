import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, CheckCircle, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateRegistration } from '@/hooks/useRegistrations';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const linkedinUrlPattern = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub)\/[\w-]+\/?$/i;

const registrationSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().email('Please enter a valid email').max(255, 'Email is too long'),
  phone: z.string().max(20, 'Phone number is too long').optional(),
  company: z.string().max(100, 'Company name is too long').optional(),
  designation: z.string().max(100, 'Designation is too long').optional(),
  linkedin_url: z.string().optional().refine(
    (val) => !val || linkedinUrlPattern.test(val),
    'Please enter a valid LinkedIn profile URL'
  ),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface RegistrationFormProps {
  eventId: string;
}

export function RegistrationForm({ eventId }: RegistrationFormProps) {
  const [success, setSuccess] = useState<{ qrCode: string; registrationNumber: string } | null>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const createRegistration = useCreateRegistration();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      email: user?.email || '',
      phone: profile?.phone || '',
      company: profile?.company || '',
      designation: profile?.designation || '',
      linkedin_url: (profile as { linkedin_url?: string })?.linkedin_url || '',
    },
  });

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      const result = await createRegistration.mutateAsync({
        event_id: eventId,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        designation: data.designation,
        linkedin_url: data.linkedin_url,
        user_id: user?.id,
      });

      setSuccess({
        qrCode: result.qr_code || '',
        registrationNumber: result.registration_number,
      });

      toast({
        title: 'Registration successful!',
        description: 'Check your email for confirmation.',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to register';
      toast({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="h-16 w-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">You're Registered!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Registration #{success.registrationNumber}
          </p>
        </div>
        {success.qrCode && (
          <div className="bg-background rounded-lg p-4 inline-block">
            <img
              src={success.qrCode}
              alt="Registration QR Code"
              className="w-48 h-48 mx-auto"
            />
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Show this QR code at check-in
        </p>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            if (success.qrCode) {
              const link = document.createElement('a');
              link.download = `registration-${success.registrationNumber}.png`;
              link.href = success.qrCode;
              link.click();
            }
          }}
        >
          Download QR Code
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name *</Label>
        <Input
          id="full_name"
          placeholder="John Doe"
          {...register('full_name')}
          className={errors.full_name ? 'border-destructive' : ''}
        />
        {errors.full_name && (
          <p className="text-sm text-destructive">{errors.full_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register('email')}
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+1 (555) 000-0000"
          {...register('phone')}
          className={errors.phone ? 'border-destructive' : ''}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          placeholder="Acme Inc."
          {...register('company')}
          className={errors.company ? 'border-destructive' : ''}
        />
        {errors.company && (
          <p className="text-sm text-destructive">{errors.company.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="designation">Designation</Label>
        <Input
          id="designation"
          placeholder="Software Engineer"
          {...register('designation')}
          className={errors.designation ? 'border-destructive' : ''}
        />
        {errors.designation && (
          <p className="text-sm text-destructive">{errors.designation.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="linkedin_url" className="flex items-center gap-2">
          <Linkedin className="h-4 w-4 text-[#0A66C2]" />
          LinkedIn Profile (Optional)
        </Label>
        <Input
          id="linkedin_url"
          placeholder="https://linkedin.com/in/yourprofile"
          {...register('linkedin_url')}
          className={errors.linkedin_url ? 'border-destructive' : ''}
        />
        <p className="text-xs text-muted-foreground">
          Share your LinkedIn to help attendees find their connections
        </p>
        {errors.linkedin_url && (
          <p className="text-sm text-destructive">{errors.linkedin_url.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={createRegistration.isPending}
      >
        {createRegistration.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Registering...
          </>
        ) : (
          'Register for Event'
        )}
      </Button>
    </form>
  );
}
