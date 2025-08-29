import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Wrench, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Password strength calculation
  const calculatePasswordStrength = (
    pwd: string
  ): { score: number; feedback: string; color: string } => {
    if (!pwd) return { score: 0, feedback: '', color: 'bg-gray-200' };

    let score = 0;
    let feedback = 'Weak';

    if (pwd.length >= 8) score += 25;
    if (pwd.length >= 12) score += 25;
    if (/[A-Z]/.test(pwd)) score += 15;
    if (/[a-z]/.test(pwd)) score += 15;
    if (/[0-9]/.test(pwd)) score += 10;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 10;

    if (score >= 80) {
      feedback = 'Strong';
      return { score, feedback, color: 'bg-green-500' };
    } else if (score >= 60) {
      feedback = 'Good';
      return { score, feedback, color: 'bg-yellow-500' };
    } else if (score >= 30) {
      feedback = 'Fair';
      return { score, feedback, color: 'bg-orange-500' };
    } else {
      feedback = 'Weak';
      return { score, feedback, color: 'bg-red-500' };
    }
  };

  const passwordStrength = calculatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      if (!result.success) {
        if (result.requiresMFA) {
          // Handle MFA if needed
          setError('MFA required');
        } else {
          setError(result.error || 'Invalid credentials');
        }
        toast({
          title: 'Error',
          description: result.error || 'Invalid credentials',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Successfully logged in',
        });
        setLocation('/dashboard');
      }
    } catch (_error) {
      const errorMessage = 'Login failed';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        {/* Header */}
        <div className='text-center'>
          <div className='mx-auto h-16 w-16 bg-primary-500 rounded-xl flex items-center justify-center'>
            <Wrench className='h-8 w-8 text-white' />
          </div>
          <h1 className='mt-6 text-3xl font-bold text-gray-900'>MaintAInPro CMMS</h1>
          <p className='mt-2 text-sm text-gray-600'>
            Sign in to your maintenance management system
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className='text-center'>Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-6'>
              {error && (
                <div
                  className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'
                  data-testid='error-message'
                >
                  {error}
                </div>
              )}

              <div>
                <label htmlFor='email' className='block text-sm font-medium text-gray-700'>
                  Email Address
                </label>
                <Input
                  id='email'
                  type='email'
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder='Enter your email'
                  className='mt-1'
                  data-testid='email-input'
                />
              </div>

              <div>
                <label htmlFor='password' className='block text-sm font-medium text-gray-700'>
                  Password
                </label>
                <div className='mt-1 relative'>
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder='Enter your password'
                    className='pr-10'
                    data-testid='password-input'
                  />
                  <button
                    type='button'
                    className='absolute inset-y-0 right-0 pr-3 flex items-center'
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid='password-toggle-button'
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4 text-gray-400' />
                    ) : (
                      <Eye className='h-4 w-4 text-gray-400' />
                    )}
                  </button>
                </div>
                {password && (
                  <div className='mt-2' data-testid='password-strength-meter'>
                    <div className='flex items-center justify-between mb-1'>
                      <span className='text-xs text-gray-600'>Password Strength</span>
                      <span
                        className={`text-xs font-medium ${passwordStrength.score >= 60 ? 'text-green-600' : passwordStrength.score >= 30 ? 'text-yellow-600' : 'text-red-600'}`}
                      >
                        {passwordStrength.feedback}
                      </span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-2'>
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.score}%` }}
                        data-testid='password-strength-bar'
                      />
                    </div>
                    {passwordStrength.score < 60 && (
                      <div className='flex items-center mt-1 text-xs text-gray-600'>
                        <AlertCircle className='h-3 w-3 mr-1' />
                        <span data-testid='password-strength-tip'>
                          Use 8+ characters with uppercase, lowercase, numbers, and symbols
                        </span>
                      </div>
                    )}
                    {passwordStrength.score >= 80 && (
                      <div className='flex items-center mt-1 text-xs text-green-600'>
                        <CheckCircle className='h-3 w-3 mr-1' />
                        <span data-testid='password-strength-success'>Strong password!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='remember-me'
                  checked={rememberMe}
                  onCheckedChange={checked => setRememberMe(checked as boolean)}
                  data-testid='remember-me-checkbox'
                />
                <label
                  htmlFor='remember-me'
                  className='text-sm text-gray-700 cursor-pointer'
                  data-testid='remember-me-label'
                >
                  Remember me for 30 days
                </label>
              </div>

              <Button
                type='submit'
                disabled={isLoading}
                className='w-full'
                data-testid='login-button'
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className='mt-6 p-4 bg-blue-50 rounded-lg'>
              <h3 className='text-sm font-medium text-blue-900 mb-2'>Demo Credentials</h3>
              <div className='space-y-1 text-sm text-blue-700'>
                <p>
                  <strong>Supervisor:</strong> supervisor@maintainpro.com
                </p>
                <p>
                  <strong>Technician:</strong> technician@maintainpro.com
                </p>
                <p>
                  <strong>Manager:</strong> manager@maintainpro.com
                </p>
                <p>
                  <strong>Password:</strong> demo123
                </p>
              </div>
              <div className='mt-3 flex space-x-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    setEmail('supervisor@maintainpro.com');
                    setPassword('demo123');
                  }}
                >
                  Use Supervisor
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    setEmail('technician@maintainpro.com');
                    setPassword('demo123');
                  }}
                >
                  Use Technician
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className='text-center text-sm text-gray-500'>
          <p>Enterprise Maintenance Management System</p>
          <p className='mt-1'>Secure • Reliable • Efficient</p>
        </div>
      </div>
    </div>
  );
}
