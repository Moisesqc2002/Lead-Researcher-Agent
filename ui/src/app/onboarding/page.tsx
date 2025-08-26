'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Users, Target, TrendingUp } from 'lucide-react';
import { userApi } from '@/lib/api';

const businessTypes = [
  { id: 'agency', label: 'Marketing & Sales Agency', icon: TrendingUp },
  { id: 'b2b', label: 'B2B Business', icon: Building2 },
  { id: 'hr', label: 'Recruiter / HR Team', icon: Users },
  { id: 'startup', label: 'Startup Founder', icon: Target }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [businessType, setBusinessType] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [goals, setGoals] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await userApi.updateProfile({
        businessType,
        businessName,
        goals
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return businessType !== '';
      case 2:
        return businessName.trim() !== '';
      case 3:
        return goals.trim() !== '';
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {step}
              </div>
              {step < 3 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  step < currentStep ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="p-8">
            {currentStep === 1 && (
              <div>
                <h2 className="text-2xl font-semibold text-center mb-2">
                  Please select what best describes you:
                </h2>
                <div className="grid grid-cols-1 gap-4 mt-8">
                  {businessTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setBusinessType(type.id)}
                      className={`p-4 rounded-lg border text-left transition-colors ${
                        businessType === type.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          businessType === type.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}>
                          <type.icon className="h-6 w-6" />
                        </div>
                        <span className="ml-4 font-medium">{type.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h2 className="text-2xl font-semibold text-center mb-2">
                  Tell us about your business
                </h2>
                <p className="text-muted-foreground text-center mb-8">
                  This helps us personalize your lead research experience
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="businessName">Business/Company Name</Label>
                    <Input
                      id="businessName"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Enter your business name"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h2 className="text-2xl font-semibold text-center mb-2">
                  What are your goals?
                </h2>
                <p className="text-muted-foreground text-center mb-8">
                  Help us understand what you're looking to achieve with lead research
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="goals">Goals & Objectives</Label>
                    <Textarea
                      id="goals"
                      value={goals}
                      onChange={(e) => setGoals(e.target.value)}
                      placeholder="e.g., Generate 100 qualified leads per month for our SaaS product targeting marketing managers at mid-size companies..."
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
              >
                {currentStep === 3 
                  ? (isLoading ? 'Completing...' : 'Complete Setup')
                  : 'Next'
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}