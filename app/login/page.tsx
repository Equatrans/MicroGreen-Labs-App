
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../../context/AppContext';

export default function Login() {
    const { login } = useAppContext();
    const router = useRouter();
    const [email, setEmail] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        login(email);
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Вход</h1>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="user@example.com" />
                    <button type="submit" className="w-full py-3 bg-green-500 text-white font-bold rounded-xl">Войти</button>
                </form>
            </div>
        </div>
    );
}
