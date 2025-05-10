'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateTripForm } from '@/features/trip/create-trip/ui/CreateTripForm';
import { createTrip } from '@/features/trip/create-trip/model';
import { CreateTripData } from '@/entities/trip/types';

export default function NewTripPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreateTrip = async (tripData: CreateTripData) => {
    try {
      setLoading(true);
      setError(null);
      
      const newTrip = await createTrip(tripData);
      router.push(`/trips/${newTrip.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">새 여행 계획 만들기</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
          {error}
        </div>
      )}
      
      <CreateTripForm 
        onSubmit={handleCreateTrip}
        loading={loading}
      />
    </div>
  );
}