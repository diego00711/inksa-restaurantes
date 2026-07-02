// src/context/ProfileContext.jsx

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { useAuth } from './AuthContext';

const ProfileContext = createContext(null);

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setProfile(null);
      return null;
    }
    setLoading(true);
    try {
      const response = await authService.getProfile();
      // A resposta de getProfile já contém o objeto do perfil
      setProfile(response.data);
      return response.data; // retorna o perfil fresco para quem precisa decidir na hora
    } catch (error) {
      console.error("Erro ao carregar perfil no context:", error);
      // Usa objeto vazio para não travar a UI — o backend auto-cria o perfil na próxima requisição GET
      setProfile({});
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfileInContext = (newProfileData) => {
    // Esta função espera receber apenas o objeto do perfil para atualizar o estado
    setProfile(prevProfile => ({ ...prevProfile, ...newProfileData }));
  };

  const value = {
    profile,
    loading,
    fetchProfile,
    updateProfileInContext,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
