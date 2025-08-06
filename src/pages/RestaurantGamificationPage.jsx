// Ficheiro: src/pages/RestaurantGamificationPage.jsx (VERSÃO REESTILIZADA E CORRIGIDA)

import React, { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { useProfile } from '../context/ProfileContext';
import { useToast } from '../context/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, TrendingUp, User, Medal, Star } from 'lucide-react';

export default function RestaurantGamificationPage() {
    const { profile, loading: profileLoading } = useProfile();
    const addToast = useToast();

    const [gamificationStats, setGamificationStats] = useState(null);
    const [userBadges, setUserBadges] = useState([]);
    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchGamificationData = useCallback(async () => {
        if (profileLoading || !profile?.user_id) return;
        setLoading(true);
        setError('');
        try {
            const [statsData, badgesData, rankingsData] = await Promise.all([
                authService.getGamificationStats(profile.user_id),
                authService.getUserBadges(profile.user_id),
                authService.getGlobalRankings('restaurant')
            ]);
            setGamificationStats(statsData.data);
            setUserBadges(badgesData.data.badges || []);
            setRankings(rankingsData.data || []);
        } catch (err) {
            const errorMessage = err.message || 'Não foi possível carregar as estatísticas.';
            setError(errorMessage);
            addToast('error', errorMessage);
        } finally {
            setLoading(false);
        }
    }, [profile, profileLoading, addToast]);

    useEffect(() => {
        if (profile?.user_id) fetchGamificationData();
    }, [profile, fetchGamificationData]);

    const getProgressInfo = () => {
        if (!gamificationStats || !gamificationStats.total_points || !gamificationStats.points_to_next_level || gamificationStats.points_to_next_level <= 0) {
            return { percentage: 100, text: "Nível Máximo Atingido!" };
        }
        const currentLevelPoints = gamificationStats.total_points - gamificationStats.points_to_next_level;
        const pointsEarnedInLevel = gamificationStats.total_points - currentLevelPoints;
        const totalPointsForLevel = gamificationStats.points_to_next_level + pointsEarnedInLevel;

        const percentage = (pointsEarnedInLevel / totalPointsForLevel) * 100;
        return {
            percentage,
            text: `${gamificationStats.total_points} / ${currentLevelPoints + totalPointsForLevel} Pontos`
        };
    };

    if (profileLoading || loading) {
        return <div className="p-6">A carregar dados de gamificação...</div>;
    }
    if (error) {
        return <div className="p-6 text-red-500">Erro: {error}</div>;
    }

    const { total_points = 0, level_name = 'Iniciante' } = gamificationStats || {};
    const progressInfo = getProgressInfo();

    return (
        <div className="gamification-container p-4 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gamificação</h1>
                    <p className="text-muted-foreground">Acompanhe seu desempenho e conquistas.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pontuação Total</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-500">{total_points}</div>
                        <p className="text-xs text-muted-foreground">Pontos ganhos até agora.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nível Atual</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{level_name}</div>
                        <p className="text-xs text-muted-foreground">Sua classificação atual.</p>
                    </CardContent>
                </Card>
                <Card className="md:col-span-2 lg:col-span-1">
                     <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Progresso</CardTitle>
                     </CardHeader>
                     <CardContent>
                        <div className="text-xl font-bold mb-2">{progressInfo.text}</div>
                        <Progress value={progressInfo.percentage} className="w-full h-2" />
                     </CardContent>
                </Card>
            </div>
            
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <h2 className="text-2xl font-bold mb-4">Suas Conquistas</h2>
                    {userBadges.length > 0 ? (
                        <TooltipProvider delayDuration={100}>
                            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                                {userBadges.map(badge => (
                                    <Tooltip key={badge.id}>
                                        <TooltipTrigger asChild>
                                            <Card className="flex flex-col items-center justify-center p-4 text-center aspect-square transition-transform hover:scale-105 hover:shadow-lg">
                                                <img src={badge.icon_url} alt={badge.name} className="h-12 w-12 mb-2"/>
                                                <p className="font-semibold text-sm leading-tight">{badge.name}</p>
                                            </Card>
                                        </TooltipTrigger>
                                        <TooltipContent className="text-center">
                                            <p className="font-bold">{badge.name}</p>
                                            <p>{badge.description}</p>
                                            <p className="text-xs text-muted-foreground">Ganha em: {new Date(badge.earned_at).toLocaleDateString()}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </div>
                        </TooltipProvider>
                    ) : (
                        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                            <p>Nenhuma conquista ainda. Continue assim para desbloquear!</p>
                        </div>
                    )}
                </div>

                <div>
                    <h2 className="text-2xl font-bold mb-4">Ranking de Restaurantes</h2>
                    <Card>
                        <CardContent className="p-0">
                            <ul className="divide-y">
                                {rankings.map((entry, index) => {
                                    // <<< CORREÇÃO DO BUG: Comparar user_id com profile.user_id >>>
                                    const isCurrentUser = entry.user_id === profile?.user_id;
                                    return (
                                        <li key={entry.user_id} className={`flex items-center gap-4 p-3 ${isCurrentUser ? 'bg-primary/10' : ''}`}>
                                            <div className="font-bold text-lg w-6 text-center">
                                                {index < 3 ? (
                                                    <Medal className={`
                                                        ${index === 0 ? 'text-amber-400' : ''}
                                                        ${index === 1 ? 'text-slate-400' : ''}
                                                        ${index === 2 ? 'text-orange-600' : ''}
                                                    `} />
                                                ) : (
                                                    <span>{index + 1}</span>
                                                )}
                                            </div>
                                            <User className="h-8 w-8 text-muted-foreground"/>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-semibold truncate">{entry.profile_name}</p>
                                                <p className="text-sm text-muted-foreground">{entry.total_points} Pontos</p>
                                            </div>
                                            {isCurrentUser && <Badge variant="secondary">Você</Badge>}
                                        </li>
                                    );
                                })}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}