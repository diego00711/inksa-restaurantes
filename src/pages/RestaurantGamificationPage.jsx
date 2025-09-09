// Ficheiro: src/pages/RestaurantGamificationPage.jsx (PÁGINA EM CONSTRUÇÃO)

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Award, Star, Zap, Target, Gift, Wrench, Clock, Users, TrendingUp, ChefHat, Utensils } from 'lucide-react';

export default function RestaurantGamificationPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <Wrench className="w-16 h-16 text-orange-500 animate-bounce" />
                            <div className="absolute -top-2 -right-2">
                                <div className="w-6 h-6 bg-red-400 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-red-800">!</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        Gamificação em Desenvolvimento
                    </h1>
                    <p className="text-lg text-gray-600 mb-4">
                        Sistema de recompensas para restaurantes em construção!
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>Lançamento em breve</span>
                    </div>
                </div>

                {/* Preview do que está vindo */}
                <Card className="shadow-xl mb-8">
                    <CardContent className="p-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                            Funcionalidades Exclusivas para Restaurantes
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Pontuação por Vendas */}
                            <div className="text-center p-4 bg-gradient-to-b from-green-100 to-green-200 rounded-lg">
                                <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-3" />
                                <h3 className="font-bold text-gray-800 mb-2">Pontos por Vendas</h3>
                                <p className="text-sm text-gray-600">
                                    Ganhe pontos baseados no volume de vendas e faturamento
                                </p>
                            </div>

                            {/* Avaliações */}
                            <div className="text-center p-4 bg-gradient-to-b from-yellow-100 to-yellow-200 rounded-lg">
                                <Star className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                                <h3 className="font-bold text-gray-800 mb-2">Sistema de Avaliações</h3>
                                <p className="text-sm text-gray-600">
                                    Bônus por manter alta qualidade e satisfação dos clientes
                                </p>
                            </div>

                            {/* Ranking de Restaurantes */}
                            <div className="text-center p-4 bg-gradient-to-b from-purple-100 to-purple-200 rounded-lg">
                                <Trophy className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                                <h3 className="font-bold text-gray-800 mb-2">Ranking Regional</h3>
                                <p className="text-sm text-gray-600">
                                    Compete com outros restaurantes da sua região
                                </p>
                            </div>

                            {/* Badges Especiais */}
                            <div className="text-center p-4 bg-gradient-to-b from-blue-100 to-blue-200 rounded-lg">
                                <Award className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                                <h3 className="font-bold text-gray-800 mb-2">Badges Culinários</h3>
                                <p className="text-sm text-gray-600">
                                    Conquiste emblemas especiais por especialidades culinárias
                                </p>
                            </div>

                            {/* Programa de Fidelidade */}
                            <div className="text-center p-4 bg-gradient-to-b from-red-100 to-red-200 rounded-lg">
                                <Users className="w-12 h-12 text-red-600 mx-auto mb-3" />
                                <h3 className="font-bold text-gray-800 mb-2">Fidelidade de Clientes</h3>
                                <p className="text-sm text-gray-600">
                                    Pontos extras por clientes frequentes e recorrentes
                                </p>
                            </div>

                            {/* Recompensas Exclusivas */}
                            <div className="text-center p-4 bg-gradient-to-b from-indigo-100 to-indigo-200 rounded-lg">
                                <Gift className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
                                <h3 className="font-bold text-gray-800 mb-2">Recompensas VIP</h3>
                                <p className="text-sm text-gray-600">
                                    Benefícios exclusivos e descontos em taxas da plataforma
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Funcionalidades específicas para restaurantes */}
                <Card className="shadow-lg mb-8">
                    <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center flex items-center justify-center gap-2">
                            <ChefHat className="w-6 h-6 text-orange-500" />
                            Recursos Especiais para Restaurantes
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Utensils className="w-5 h-5 text-orange-500" />
                                    <span className="text-sm font-medium">Metas de Vendas Mensais</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Star className="w-5 h-5 text-yellow-500" />
                                    <span className="text-sm font-medium">Programa de Qualidade</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Users className="w-5 h-5 text-blue-500" />
                                    <span className="text-sm font-medium">Análise de Satisfação</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Trophy className="w-5 h-5 text-purple-500" />
                                    <span className="text-sm font-medium">Certificações Especiais</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-green-500" />
                                    <span className="text-sm font-medium">Relatórios de Performance</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Gift className="w-5 h-5 text-red-500" />
                                    <span className="text-sm font-medium">Programa de Benefícios</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Progresso simulado */}
                <Card className="shadow-lg mb-8">
                    <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                            Progresso de Desenvolvimento
                        </h3>
                        
                        <div className="space-y-4">
                            {/* Backend para Restaurantes */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">APIs de Restaurantes</span>
                                    <span className="text-sm text-green-600">90%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                                </div>
                            </div>

                            {/* Sistema de Pontuação */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Sistema de Pontuação</span>
                                    <span className="text-sm text-yellow-600">70%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                                </div>
                            </div>

                            {/* Interface do Usuário */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Interface para Restaurantes</span>
                                    <span className="text-sm text-blue-600">50%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                                </div>
                            </div>

                            {/* Integração */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Integração & Testes</span>
                                    <span className="text-sm text-orange-600">25%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Mensagem motivacional */}
                <Card className="shadow-lg bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    <CardContent className="p-6 text-center">
                        <ChefHat className="w-12 h-12 mx-auto mb-4 text-orange-100" />
                        <h3 className="text-xl font-bold mb-2">Continue oferecendo excelência!</h3>
                        <p className="text-orange-100">
                            Mantenha a qualidade e o bom atendimento. Quando o sistema de gamificação estiver pronto, 
                            você receberá pontos retroativos baseados no seu histórico de vendas e avaliações!
                        </p>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center mt-8 text-gray-500 text-sm">
                    <p>🏆 Em breve: Sistema completo de gamificação para restaurantes Inksa Delivery</p>
                </div>
            </div>
        </div>
    );
}
